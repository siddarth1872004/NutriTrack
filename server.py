#!/usr/bin/env python3
import hashlib,hmac,http.cookies,os,secrets,socket,sqlite3,threading,time,webbrowser
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs
ROOT=Path(__file__).resolve().parent; STATE=ROOT/'.nutritrack'; DB=STATE/'auth.sqlite3'
HOST='127.0.0.1'; BASE=int(os.environ.get('NUTRITRACK_PORT','8765')); COOKIE='nutritrack_session'; TTL=43200; ROUNDS=310000
SESSIONS={}; LOCK=threading.Lock(); FAIL={}; FLOCK=threading.Lock()
def connect():
 STATE.mkdir(mode=0o700,parents=True,exist_ok=True); db=sqlite3.connect(DB,timeout=10)
 db.execute('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY,salt BLOB NOT NULL,digest BLOB NOT NULL)'); db.commit(); return db
def exists():
 with connect() as db: return db.execute('SELECT 1 FROM users LIMIT 1').fetchone() is not None
def derive(p,s=None):
 s=s or secrets.token_bytes(16); return s,hashlib.pbkdf2_hmac('sha256',p.encode(),s,ROUNDS)
def page(setup,error=''):
 title='Create your local account' if setup else 'Sign in to NutriTrack'
 extra='<label>Confirm password<input name="confirm" type="password" minlength="12" required></label>' if setup else ''
 err='<p class="err">'+error+'</p>' if error else ''
 action='/auth/setup' if setup else '/auth/login'
 html='''<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+title+'''</title><style>
 *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f2ec;color:#222;font:16px system-ui;padding:20px}main{width:min(100%,420px);padding:30px;background:white;border:1px solid #ddd;border-radius:16px}.brand{font-size:2rem;font-weight:900}p{color:#666;line-height:1.5}label{display:block;margin-top:16px;font-size:.9rem;font-weight:650}input{display:block;width:100%;padding:12px;margin-top:6px;border:1px solid #bbb;border-radius:8px;font:inherit}button{width:100%;padding:13px;margin-top:22px;background:#222;color:white;border:0;border-radius:8px;font:inherit;font-weight:750}.err{color:#a21d17;background:#fff0ed;padding:10px;border-radius:8px}.hint{font-size:.78rem}</style><body><main><div class="brand">NutriTrack.</div><h1>'''+title+'''</h1><p>'''+('Choose a username and a password with at least 12 characters.' if setup else 'Sign in to open your local nutrition tracker.')+'''</p>'''+err+'''<form method="post" action="'''+action+'''"><label>Username<input name="username" minlength="3" maxlength="40" pattern="[A-Za-z0-9_.-]+" required autocomplete="username"></label><label>Password<input name="password" type="password" minlength="12" maxlength="256" required autocomplete="'''+('new-password' if setup else 'current-password')+'''"></label>'''+extra+'''<button>'''+('Create account' if setup else 'Sign in')+'''</button></form><p class="hint">Local-only login. Nutrition data stays in this browser.</p></main></body></html>'''
 return html.encode()
def session(handler):
 c=http.cookies.SimpleCookie()
 try: c.load(handler.headers.get('Cookie','')); token=c[COOKIE].value
 except (http.cookies.CookieError,KeyError): return None
 with LOCK:
  rec=SESSIONS.get(token)
  if not rec or rec[1]<time.time(): SESSIONS.pop(token,None); return None
  SESSIONS[token]=(rec[0],time.time()+TTL); return rec[0]
def new_session(name):
 t=secrets.token_urlsafe(32)
 with LOCK: SESSIONS[t]=(name,time.time()+TTL)
 return t
def cookie(t): return COOKIE+'='+t+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+str(TTL)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,fmt,*args): print('[NutriTrack] '+fmt%args)
 def sendpage(self,status,body,headers=()):
  self.send_response(status); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(body))); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.send_header('X-Frame-Options','DENY')
  for k,v in headers:self.send_header(k,v)
  self.end_headers(); self.wfile.write(body)
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
 def do_GET(self):
  p=urlparse(self.path).path
  if p=='/health':return self.sendpage(200,b'{"status":"ok"}')
  if p=='/auth/logout':
   c=http.cookies.SimpleCookie()
   try:c.load(self.headers.get('Cookie','')); t=c[COOKIE].value
   except (http.cookies.CookieError,KeyError):t=None
   if t:
    with LOCK:SESSIONS.pop(t,None)
   return self.go('/login',[( 'Set-Cookie',COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')])
  if p in ('/login','/auth/setup','/auth/login'):
   if session(self):return self.go('/')
   return self.sendpage(200,page(not exists()))
  if not exists():return self.go('/auth/setup')
  if not session(self):return self.go('/login')
  if p=='/':self.path='/index.html'
  return super().do_GET()
 def do_POST(self):
  p=urlparse(self.path).path; n=int(self.headers.get('Content-Length','0'))
  if n>8192:return self.sendpage(413,b'Request too large')
  f=parse_qs(self.rfile.read(n).decode('utf-8','replace'),keep_blank_values=True); name=f.get('username',[''])[0].strip(); pw=f.get('password',[''])[0]; ip=self.client_address[0]
  if p=='/auth/setup' and not exists():
   if len(name)<3 or len(name)>40 or not all(c.isalnum() or c in '_.-' for c in name):return self.sendpage(400,page(True,'Username must be 3–40 valid characters.'))
   if len(pw)<12 or len(pw)>256:return self.sendpage(400,page(True,'Password must be 12–256 characters.'))
   if not hmac.compare_digest(pw,f.get('confirm',[''])[0]):return self.sendpage(400,page(True,'Passwords do not match.'))
   salt,d=derive(pw)
   with connect() as db:
    try:db.execute('INSERT INTO users VALUES(?,?,?)',(name,salt,d));db.commit()
    except sqlite3.IntegrityError:return self.sendpage(409,page(True,'Username already exists.'))
   return self.go('/',[('Set-Cookie',cookie(new_session(name)))])
  if p=='/auth/login' and exists():
   with FLOCK:
    ev=[t for t in FAIL.get(ip,[]) if time.time()-t<300];FAIL[ip]=ev
    if len(ev)>=8:return self.sendpage(429,page(False,'Too many attempts. Wait five minutes.'))
   with connect() as db:row=db.execute('SELECT salt,digest FROM users WHERE username=?',(name,)).fetchone()
   if row:
    _,d=derive(pw,row[0]);ok=hmac.compare_digest(d,row[1])
   else:derive(pw,b'nutritrack-dummy-salt');ok=False
   if not ok:
    with FLOCK:FAIL.setdefault(ip,[]).append(time.time())
    return self.sendpage(401,page(False,'Incorrect username or password.'))
   with FLOCK:FAIL.pop(ip,None)
   return self.go('/',[('Set-Cookie',cookie(new_session(name)))])
  return self.sendpage(404,b'Not found')
def main():
 port=None
 for p in range(BASE,BASE+20):
  s=socket.socket()
  try:s.bind((HOST,p));port=p;s.close();break
  except OSError:s.close()
 if port is None:raise RuntimeError('No free port found between 8765 and 8794.')
 server=ThreadingHTTPServer((HOST,port),Handler);url='http://'+HOST+':'+str(port)+'/'
 print('\\nNutriTrack local: '+url+'\\nOnly this computer can connect. Ctrl+C stops it.\\n')
 threading.Timer(1,lambda:webbrowser.open(url)).start()
 try:server.serve_forever()
 except KeyboardInterrupt:print('\\nStopping NutriTrack...')
 finally:server.server_close()
if __name__=='__main__':main()
