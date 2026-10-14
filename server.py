#!/usr/bin/env python3
"""Local NutriTrack server with account authentication and admin user management."""
import hashlib, hmac, http.cookies, json, os, re, secrets, socket, sqlite3, threading, time, webbrowser
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT=Path(__file__).resolve().parent
STATE=ROOT/'.nutritrack'
DB=STATE/'auth.sqlite3'
HOST='127.0.0.1'
BASE=int(os.environ.get('NUTRITRACK_PORT','8765'))
COOKIE='nutritrack_session'
TTL=43200
ROUNDS=310000
SESSIONS={}
LOCK=threading.Lock()
FAIL={}
FLOCK=threading.Lock()

def connect():
    STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    db=sqlite3.connect(DB, timeout=10)
    db.row_factory=sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute("""CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY, salt BLOB NOT NULL, digest BLOB NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin', active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )""")
    cols={r['name'] for r in db.execute('PRAGMA table_info(users)')}
    if 'role' not in cols: db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'")
    if 'active' not in cols: db.execute("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1")
    if 'created_at' not in cols: db.execute("ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT ''")
    db.commit()
    return db

def user_count():
    with connect() as db: return db.execute('SELECT COUNT(*) FROM users').fetchone()[0]
def derive(password, salt=None):
    salt=salt or secrets.token_bytes(16)
    return salt, hashlib.pbkdf2_hmac('sha256', password.encode(), salt, ROUNDS)
def esc(s):
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;').replace("'",'&#39;')
def auth_page(setup, error=''):
    title='Create your administrator account' if setup else 'Sign in to NutriTrack'
    confirm='<label>Confirm password<input name="confirm" type="password" minlength="12" required autocomplete="new-password"></label>' if setup else ''
    err='<p class="err">'+esc(error)+'</p>' if error else ''
    action='/auth/setup' if setup else '/auth/login'
    html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+title+'''</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f2ec;color:#222;font:16px system-ui;padding:20px}main{width:min(100%,440px);padding:30px;background:white;border:1px solid #ddd;border-radius:16px}.brand{font-size:2rem;font-weight:900}p{color:#666;line-height:1.5}label{display:block;margin-top:16px;font-size:.9rem;font-weight:650}input{display:block;width:100%;padding:12px;margin-top:6px;border:1px solid #bbb;border-radius:8px;font:inherit}button{width:100%;padding:13px;margin-top:22px;background:#222;color:white;border:0;border-radius:8px;font:inherit;font-weight:750}.err{color:#a21d17;background:#fff0ed;padding:10px;border-radius:8px}.hint{font-size:.78rem}</style><body><main><div class="brand">NutriTrack.</div><h1>'''+title+'''</h1><p>'''+('The first account becomes the administrator. Use a unique password with at least 12 characters.' if setup else 'Sign in to open your local nutrition tracker.')+'''</p>'''+err+'''<form method="post" action="'''+action+'''"><label>Username<input name="username" minlength="3" maxlength="40" pattern="[A-Za-z0-9_.-]+" required autocomplete="username"></label><label>Password<input name="password" type="password" minlength="12" maxlength="256" required autocomplete="'''+('new-password' if setup else 'current-password')+'''"></label>'''+confirm+'''<button>'''+('Create administrator' if setup else 'Sign in')+'''</button></form><p class="hint">Local-only account. Nutrition entries remain in this browser.</p></main></body></html>'''
    return html.encode()
def session(handler):
    c=http.cookies.SimpleCookie()
    try: c.load(handler.headers.get('Cookie','')); token=c[COOKIE].value
    except (http.cookies.CookieError, KeyError): return None
    with LOCK:
        rec=SESSIONS.get(token)
        if not rec or rec[1] < time.time():
            SESSIONS.pop(token,None); return None
        SESSIONS[token]=(rec[0],time.time()+TTL)
        name=rec[0]
    with connect() as db:
        row=db.execute('SELECT role,active FROM users WHERE username=?',(name,)).fetchone()
    if not row or not row['active']: return None
    return {'username':name,'role':row['role']}
def new_session(name):
    token=secrets.token_urlsafe(32)
    with LOCK: SESSIONS[token]=(name,time.time()+TTL)
    return token
def cookie(token):
    return COOKIE+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+str(TTL)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,fmt,*args): print('[NutriTrack] '+fmt%args)
    def send_bytes(self,status,body,ctype='text/plain; charset=utf-8',headers=()):
        self.send_response(status); self.send_header('Content-Type',ctype); self.send_header('Content-Length',str(len(body))); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.send_header('X-Frame-Options','DENY'); self.send_header('Referrer-Policy','same-origin')
        for k,v in headers: self.send_header(k,v)
        self.end_headers()
        try:self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError):pass
    def json(self,status,data):
        self.send_bytes(status,json.dumps(data).encode(),'application/json; charset=utf-8')
    def go(self,path,headers=()):
        self.send_response(303); self.send_header('Location',path); self.send_header('Cache-Control','no-store')
        for k,v in headers:self.send_header(k,v)
        self.end_headers()
    def translate_path(self,path):
        p=(ROOT/urlparse(path).path.lstrip('/')).resolve()
        try:p.relative_to(ROOT.resolve())
        except ValueError:return str(ROOT/'__404__')
        if p==STATE or STATE in p.parents:return str(ROOT/'__404__')
        return str(p)
    def admin_required(self):
        u=session(self)
        if not u:
            self.json(401,{'error':'Sign in required'});return None
        if u['role']!='admin':
            self.json(403,{'error':'Administrator permission required'});return None
        return u
    def do_GET(self):
        p=urlparse(self.path).path
        if p=='/health': return self.json(200,{'status':'ok'})
        if p=='/api/me':
            u=session(self)
            if not u:return self.json(401,{'error':'Sign in required'})
            return self.json(200,{'username':u['username'],'role':u['role']})
        if p=='/api/my-recommendations':
            u=session(self)
            if not u:return self.json(401,{'error':'Sign in required'})
            if u['role']!='user':return self.json(403,{'error':'User account required'})
            with connect() as db:
                rows=db.execute('SELECT id,dietitian,message,created_at FROM recommendations WHERE username=? ORDER BY id DESC LIMIT 100',(u['username'],)).fetchall()
            return self.json(200,{'recommendations':[dict(r) for r in rows]})
        if p=='/api/dietitian/clients':
            u=session(self)
            if not u:return self.json(401,{'error':'Sign in required'})
            if u['role']!='dietitian':return self.json(403,{'error':'Dietitian account required'})
            with connect() as db:
                rows=db.execute("""SELECT u.username,a.assigned_at,s.updated_at,
                    CASE WHEN s.payload IS NULL THEN 0 ELSE 1 END AS has_data
                    FROM dietitian_assignments a JOIN users u ON u.username=a.username
                    LEFT JOIN nutrition_snapshots s ON s.username=u.username
                    WHERE a.dietitian=? AND u.active=1 AND u.role='user' ORDER BY u.username""",(u['username'],)).fetchall()
            return self.json(200,{'clients':[dict(r) for r in rows]})
        if p.startswith('/api/dietitian/clients/'):
            u=session(self)
            if not u:return self.json(401,{'error':'Sign in required'})
            if u['role']!='dietitian':return self.json(403,{'error':'Dietitian account required'})
            name=p[len('/api/dietitian/clients/'):]
            if not re.fullmatch(r'[A-Za-z0-9_.-]{3,40}',name):return self.json(400,{'error':'Invalid username'})
            with connect() as db:
                assigned=db.execute("SELECT 1 FROM dietitian_assignments a JOIN users target ON target.username=a.username WHERE a.username=? AND a.dietitian=? AND target.active=1 AND target.role='user'",(name,u['username'])).fetchone()
                if not assigned:return self.json(403,{'error':'This user is not assigned to you'})
                row=db.execute('SELECT payload,updated_at FROM nutrition_snapshots WHERE username=?',(name,)).fetchone()
                recs=db.execute('SELECT id,message,created_at FROM recommendations WHERE username=? AND dietitian=? ORDER BY id DESC LIMIT 100',(name,u['username'])).fetchall()
            payload=json.loads(row['payload']) if row else {}
            return self.json(200,{'username':name,'snapshot':payload,'updated_at':row['updated_at'] if row else None,'recommendations':[dict(r) for r in recs]})
        if p=='/auth/logout':
            c=http.cookies.SimpleCookie()
            try:c.load(self.headers.get('Cookie','')); token=c[COOKIE].value
            except (http.cookies.CookieError,KeyError):token=None
            if token:
                with LOCK:SESSIONS.pop(token,None)
            return self.go('/login',[('Set-Cookie',COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')])
        if p in ('/login','/auth/setup','/auth/login'):
            if session(self):return self.go('/')
            return self.send_bytes(200,auth_page(user_count()==0),'text/html; charset=utf-8')
        if p.startswith('/api/admin/'):
            u=self.admin_required()
            if not u:return
            if p=='/api/admin/overview':
                with connect() as db:
                    total=db.execute('SELECT COUNT(*) FROM users').fetchone()[0]
                    admins=db.execute("SELECT COUNT(*) FROM users WHERE role='admin' AND active=1").fetchone()[0]
                    active=db.execute('SELECT COUNT(*) FROM users WHERE active=1').fetchone()[0]
                    rows=db.execute('SELECT username,role,active,created_at FROM users ORDER BY created_at,username').fetchall()
                    assignments=db.execute('SELECT username,dietitian,assigned_at FROM dietitian_assignments').fetchall()
                return self.json(200,{'current_user':u['username'],'total_users':total,'active_users':active,'admins':admins,'users':[dict(x) for x in rows],'assignments':[dict(x) for x in assignments]})
            return self.json(404,{'error':'Not found'})
        if not user_count():return self.go('/auth/setup')
        u=session(self)
        if not u:return self.go('/login')
        if p=='/admin.html' and u['role']!='admin':return self.go('/dietitian.html' if u['role']=='dietitian' else '/')
        if p=='/dietitian.html' and u['role']!='dietitian':return self.go('/admin.html' if u['role']=='admin' else '/')
        if p=='/recommendations.html' and u['role']!='user':return self.go('/dietitian.html' if u['role']=='dietitian' else '/admin.html')
        if p=='/' and u['role']=='dietitian':return self.go('/dietitian.html')
        if p=='/':self.path='/index.html'
        return super().do_GET()
    def do_POST(self):
        p=urlparse(self.path).path
        try:n=int(self.headers.get('Content-Length','0'))
        except ValueError:n=0
        limit=1_100_000 if p=='/api/my-data' else 16384
        if n<0 or n>limit:return self.json(413,{'error':'Request too large'})
        raw=self.rfile.read(n)
        if p=='/api/dietitian/recommendations':
            u=session(self)
            if not u:return self.json(401,{'error':'Sign in required'})
            if u['role']!='dietitian':return self.json(403,{'error':'Dietitian account required'})
            try:data=json.loads(raw or b'{}')
            except (json.JSONDecodeError,UnicodeDecodeError):return self.json(400,{'error':'Invalid JSON'})
            name=str(data.get('username','')).strip()
            message=str(data.get('message','')).strip()
            if not re.fullmatch(r'[A-Za-z0-9_.-]{3,40}',name):return self.json(400,{'error':'Invalid username'})
            if not message or len(message)>4000:return self.json(400,{'error':'Recommendation must be 1–4000 characters'})
            with connect() as db:
                assigned=db.execute("SELECT 1 FROM dietitian_assignments a JOIN users target ON target.username=a.username WHERE a.username=? AND a.dietitian=? AND target.active=1 AND target.role='user'",(name,u['username'])).fetchone()
                if not assigned:return self.json(403,{'error':'This user is not assigned to you'})
                db.execute('INSERT INTO recommendations(username,dietitian,message) VALUES(?,?,?)',(name,u['username'],message))
            return self.json(201,{'ok':True,'message':'Recommendation saved'})
        if p=='/api/my-data':
            u=session(self)
            if not u:return self.json(401,{'error':'Sign in required'})
            if u['role']!='user':return self.json(403,{'error':'Only user accounts can sync nutrition data'})
            try:data=json.loads(raw or b'{}')
            except (json.JSONDecodeError,UnicodeDecodeError):return self.json(400,{'error':'Invalid JSON'})
            if not isinstance(data,dict) or len(data)>100:return self.json(400,{'error':'Invalid snapshot format'})
            payload=json.dumps(data,separators=(',',':'))
            if len(payload.encode())>1_000_000:return self.json(413,{'error':'Nutrition snapshot is too large'})
            with connect() as db:
                db.execute("""INSERT INTO nutrition_snapshots(username,payload,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
                    ON CONFLICT(username) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP""",(u['username'],payload))
            return self.json(200,{'ok':True})
        if p.startswith('/api/admin/'):
            actor=self.admin_required()
            if not actor:return
            try:data=json.loads(raw or b'{}')
            except (json.JSONDecodeError,UnicodeDecodeError):return self.json(400,{'error':'Invalid JSON'})
            if p=='/api/admin/users':
                name=str(data.get('username','')).strip(); pw=str(data.get('password','')); role=data.get('role','user')
                if not re.fullmatch(r'[A-Za-z0-9_.-]{3,40}',name):return self.json(400,{'error':'Username must be 3–40 letters, numbers, dots, underscores or hyphens'})
                if len(pw)<12 or len(pw)>256:return self.json(400,{'error':'Password must be 12–256 characters'})
                if role not in ('admin','user','dietitian'):return self.json(400,{'error':'Invalid role'})
                salt,digest=derive(pw)
                try:
                    with connect() as db:db.execute('INSERT INTO users(username,salt,digest,role,active,created_at) VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)',(name,salt,digest,role))
                except sqlite3.IntegrityError:return self.json(409,{'error':'Username already exists'})
                return self.json(201,{'ok':True,'message':'Account created'})
            if p=='/api/admin/assignments':
                username=str(data.get('username','')).strip()
                dietitian=str(data.get('dietitian','')).strip()
                with connect() as db:
                    user=db.execute("SELECT role,active FROM users WHERE username=?",(username,)).fetchone()
                    if not user or user['role']!='user' or not user['active']:return self.json(400,{'error':'Choose an active user account'})
                    if not dietitian:
                        db.execute('DELETE FROM dietitian_assignments WHERE username=?',(username,))
                        return self.json(200,{'ok':True,'message':'Dietitian assignment removed'})
                    dr=db.execute("SELECT role,active FROM users WHERE username=?",(dietitian,)).fetchone()
                    if not dr or dr['role']!='dietitian' or not dr['active']:return self.json(400,{'error':'Choose an active dietitian account'})
                    db.execute("""INSERT INTO dietitian_assignments(username,dietitian,assigned_at) VALUES(?,?,CURRENT_TIMESTAMP)
                        ON CONFLICT(username) DO UPDATE SET dietitian=excluded.dietitian,assigned_at=CURRENT_TIMESTAMP""",(username,dietitian))
                return self.json(200,{'ok':True,'message':'Dietitian assigned'})
            match=re.fullmatch(r'/api/admin/users/([A-Za-z0-9_.-]{3,40})/(disable|enable|role|delete)',p)
            if match:
                name,action=match.groups()
                if name==actor['username'] and action in ('disable','delete','role'):return self.json(400,{'error':'You cannot disable, delete, or change your own role'})
                with connect() as db:
                    row=db.execute('SELECT username,role,active FROM users WHERE username=?',(name,)).fetchone()
                    if not row:return self.json(404,{'error':'User not found'})
                    if action=='disable' and row['role']=='admin' and row['active']:
                        if db.execute("SELECT COUNT(*) FROM users WHERE role='admin' AND active=1").fetchone()[0]<=1:return self.json(400,{'error':'Cannot disable the last active administrator'})
                    if action=='delete' and row['role']=='admin' and row['active']:
                        if db.execute("SELECT COUNT(*) FROM users WHERE role='admin' AND active=1").fetchone()[0]<=1:return self.json(400,{'error':'Cannot delete the last active administrator'})
                    if action=='disable':db.execute('UPDATE users SET active=0 WHERE username=?',(name,))
                    elif action=='enable':db.execute('UPDATE users SET active=1 WHERE username=?',(name,))
                    elif action=='role':
                        role=data.get('role')
                        if role not in ('admin','user','dietitian'):return self.json(400,{'error':'Invalid role'})
                        if row['role']=='admin' and row['active'] and role!='admin' and db.execute("SELECT COUNT(*) FROM users WHERE role='admin' AND active=1").fetchone()[0]<=1:return self.json(400,{'error':'Cannot demote the last active administrator'})
                        db.execute('UPDATE users SET role=? WHERE username=?',(role,name))
                        if role!='dietitian':db.execute('DELETE FROM dietitian_assignments WHERE dietitian=?',(name,))
                        if role!='user':db.execute('DELETE FROM dietitian_assignments WHERE username=?',(name,))
                    elif action=='delete':db.execute('DELETE FROM users WHERE username=?',(name,))
                if action in ('disable','delete'):
                    with LOCK:
                        for token,rec in list(SESSIONS.items()):
                            if rec[0]==name:SESSIONS.pop(token,None)
                return self.json(200,{'ok':True,'message':'User '+action+'d' if action in ('disable','enable') else 'User '+action+'d successfully'})
            return self.json(404,{'error':'Not found'})
        form=parse_qs(raw.decode('utf-8','replace'),keep_blank_values=True)
        name=form.get('username',[''])[0].strip(); pw=form.get('password',[''])[0]; ip=self.client_address[0]
        if p=='/auth/setup' and user_count()==0:
            if not re.fullmatch(r'[A-Za-z0-9_.-]{3,40}',name):return self.send_bytes(400,auth_page(True,'Username must be 3–40 valid characters.'),'text/html; charset=utf-8')
            if len(pw)<12 or len(pw)>256:return self.send_bytes(400,auth_page(True,'Password must be 12–256 characters.'),'text/html; charset=utf-8')
            if not hmac.compare_digest(pw,form.get('confirm',[''])[0]):return self.send_bytes(400,auth_page(True,'Passwords do not match.'),'text/html; charset=utf-8')
            salt,digest=derive(pw)
            with connect() as db:
                try:db.execute("INSERT INTO users(username,salt,digest,role,active,created_at) VALUES(?,?,?,'admin',1,CURRENT_TIMESTAMP)",(name,salt,digest))
                except sqlite3.IntegrityError:return self.send_bytes(409,auth_page(True,'Username already exists.'),'text/html; charset=utf-8')
            return self.go('/',[('Set-Cookie',cookie(new_session(name)))])
        if p=='/auth/login' and user_count():
            with FLOCK:
                ev=[t for t in FAIL.get(ip,[]) if time.time()-t<300];FAIL[ip]=ev
                if len(ev)>=8:return self.send_bytes(429,auth_page(False,'Too many attempts. Wait five minutes.'),'text/html; charset=utf-8')
            with connect() as db:row=db.execute('SELECT salt,digest,active FROM users WHERE username=?',(name,)).fetchone()
            ok=False
            if row:
                _,derived=derive(pw,row['salt']);ok=hmac.compare_digest(derived,row['digest']) and bool(row['active'])
            else:derive(pw,b'nutritrack-dummy-salt')
            if not ok:
                with FLOCK:FAIL.setdefault(ip,[]).append(time.time())
                return self.send_bytes(401,auth_page(False,'Incorrect username or password, or account disabled.'),'text/html; charset=utf-8')
            with FLOCK:FAIL.pop(ip,None)
            return self.go('/',[('Set-Cookie',cookie(new_session(name)))])
        return self.json(404,{'error':'Not found'})
def main():
    port=None
    for candidate in range(BASE,BASE+20):
        s=socket.socket()
        try:s.bind((HOST,candidate));port=candidate;s.close();break
        except OSError:s.close()
    if port is None:raise RuntimeError('No free port found between 8765 and 8794.')
    server=ThreadingHTTPServer((HOST,port),Handler)
    url='http://'+HOST+':'+str(port)+'/'
    print('\nNutriTrack local: '+url+'\nOnly this computer can connect. Ctrl+C stops it.\n')
    threading.Timer(1,lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:print('\nStopping NutriTrack...')
    finally:server.server_close()
if __name__=='__main__':main()
