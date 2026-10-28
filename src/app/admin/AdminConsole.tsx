"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import FoodManager from "./FoodManager";

type Account = { username: string; role: "user" | "dietitian" | "admin"; active: boolean; created_at: string };
type Overview = { total_users: number; active_users: number; admins: number; users: Account[]; assignments: { username: string; dietitian: string }[] };

const ROLE_LABEL: Record<string, string> = { user: "User", dietitian: "Dietitian", admin: "Admin" };

export default function AdminConsole({ currentUser }: { currentUser: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/overview", { cache: "no-store", credentials: "same-origin" });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Could not load the console.");
      setData(b);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load the console.");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Every action goes through one helper so messages and reloads behave the same way.
  async function act(url: string, body: unknown, success: string) {
    setBusy(true);
    setNotice(null);
    try {
      const r = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || "That didn’t work. Please try again.");
      setNotice({ kind: "ok", text: b.message || success });
      await load();
      return true;
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const dietitians = useMemo(() => (data?.users || []).filter((u) => u.role === "dietitian" && u.active), [data]);
  const assignmentOf = useMemo(() => new Map((data?.assignments || []).map((a) => [a.username, a.dietitian])), [data]);
  const visible = (data?.users || []).filter((u) => u.username.toLowerCase().includes(query.trim().toLowerCase()));

  if (loadError) return <main className="nt-wrap nt-page"><div className="nt-notice err" role="alert">{loadError}</div></main>;
  if (!data) return <main className="nt-wrap nt-page"><p className="nt-muted">Loading the console…</p></main>;

  return (
    <main className="nt-wrap nt-page">
      <div className="nt-eyebrow">Platform administration</div>
      <h1 className="nt-h1" style={{ fontSize: "clamp(36px,5vw,50px)" }}>Platform <span>overview.</span></h1>
      <p className="nt-lede">Manage accounts, roles and which dietitian supports each user. Signed in as {currentUser}.</p>

      <div className="nt-stats">
        <div className="nt-stat"><small>Accounts</small><strong>{data.total_users}</strong><small>All accounts</small></div>
        <div className="nt-stat"><small>Active</small><strong>{data.active_users}</strong><small>Can sign in</small></div>
        <div className="nt-stat"><small>Dietitians</small><strong>{dietitians.length}</strong><small>Active professionals</small></div>
        <div className="nt-stat"><small>Administrators</small><strong>{data.admins}</strong><small>Active admins</small></div>
      </div>

      {notice && <div className={"nt-notice " + (notice.kind === "ok" ? "ok" : "err")} role="status">{notice.text}</div>}

      <div className="nt-two">
        <CreateAccount busy={busy} onCreate={(body) => act("/api/admin/users", body, "Account created.")} />
        <Assign busy={busy} users={data.users.filter((u) => u.role === "user")} dietitians={dietitians} assignmentOf={assignmentOf}
          onAssign={(username, dietitian) => act("/api/admin/assignments", { username, dietitian }, dietitian ? `${username} is now assigned.` : `${username} is unassigned.`)} />
      </div>

      <div className="nt-card" style={{ marginTop: 16 }}>
        <div className="nt-split" style={{ marginBottom: 14 }}>
          <div><h2 className="nt-h2">Accounts</h2><p className="nt-small" style={{ margin: 0 }}>Change roles, disable accounts, reset passwords or delete them.</p></div>
          <input className="nt-input" style={{ maxWidth: 260 }} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accounts" aria-label="Search accounts" />
        </div>
        <div className="nt-table-wrap">
          <table className="nt-table">
            <thead><tr><th>Account</th><th>Role</th><th>Dietitian</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map((u) => (
                <AccountRow key={u.username} u={u} isSelf={u.username === currentUser} busy={busy}
                  dietitian={assignmentOf.get(u.username)}
                  onRole={(role) => act(`/api/admin/users/${encodeURIComponent(u.username)}/role`, { role }, `${u.username} is now ${ROLE_LABEL[role]}.`)}
                  onToggle={() => act(`/api/admin/users/${encodeURIComponent(u.username)}/${u.active ? "disable" : "enable"}`, {}, `${u.username} ${u.active ? "disabled" : "enabled"}.`)}
                  onDelete={() => confirm(`Permanently delete ${u.username}? This cannot be undone.`) && act(`/api/admin/users/${encodeURIComponent(u.username)}/delete`, {}, `${u.username} deleted.`)}
                  onPassword={(password) => act(`/api/admin/users/${encodeURIComponent(u.username)}/password`, { password }, `Password reset for ${u.username}. They have been signed out everywhere.`)}
                />
              ))}
              {visible.length === 0 && <tr><td colSpan={6}><div className="nt-empty">No accounts match “{query}”.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <FoodManager />
    </main>
  );
}

function AccountRow(props: {
  u: Account; isSelf: boolean; busy: boolean; dietitian?: string;
  onRole: (r: string) => void; onToggle: () => void; onDelete: () => void; onPassword: (p: string) => void;
}) {
  const { u, isSelf, busy, dietitian } = props;
  const [role, setRole] = useState(u.role);
  const [pw, setPw] = useState("");
  const initials = u.username.slice(0, 2).toUpperCase();
  return (
    <tr>
      <td><span className="nt-avatar">{initials}</span><strong>{u.username}</strong></td>
      <td><span className="nt-tag">{ROLE_LABEL[u.role]}</span></td>
      <td>{u.role === "user" ? (dietitian || <span className="nt-muted">—</span>) : <span className="nt-muted">—</span>}</td>
      <td className="nt-muted">{u.created_at}</td>
      <td>{u.active ? <span className="nt-tag green">Active</span> : <span className="nt-tag">Disabled</span>}</td>
      <td>
        {isSelf ? <span className="nt-muted">This is you</span> : (
          <div className="nt-row-actions">
            <select aria-label={`Role for ${u.username}`} value={role} onChange={(e) => setRole(e.target.value as Account["role"])} disabled={busy}>
              <option value="user">User</option><option value="dietitian">Dietitian</option><option value="admin">Admin</option>
            </select>
            <button className="nt-btn soft sm" disabled={busy || role === u.role} onClick={() => props.onRole(role)}>Save role</button>
            <button className="nt-btn soft sm" disabled={busy} onClick={props.onToggle}>{u.active ? "Disable" : "Enable"}</button>
            <form className="nt-row-actions" onSubmit={(e: FormEvent) => { e.preventDefault(); if (pw.length >= 12 && confirm(`Set a new password for ${u.username}?`)) { props.onPassword(pw); setPw(""); } }}>
              <input className="nt-input" style={{ width: 150, padding: "7px 9px", fontSize: 13 }} type="password" minLength={12} maxLength={256} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" aria-label={`New password for ${u.username}`} />
              <button className="nt-btn soft sm" disabled={busy || pw.length < 12}>Reset</button>
            </form>
            <button className="nt-btn danger sm" disabled={busy} onClick={props.onDelete}>Delete</button>
          </div>
        )}
      </td>
    </tr>
  );
}

function CreateAccount({ busy, onCreate }: { busy: boolean; onCreate: (b: unknown) => Promise<boolean> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await onCreate({ username: username.trim(), password, role })) { setUsername(""); setPassword(""); }
  }
  return (
    <form className="nt-card" onSubmit={submit}>
      <h2 className="nt-h2">Create an account</h2>
      <p className="nt-muted">Give the person a temporary password, then ask them to change it in Account settings.</p>
      <label className="nt-field">Username<input className="nt-input" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={40} pattern="[A-Za-z0-9_.\-]{3,40}" /></label>
      <label className="nt-field">Temporary password<input className="nt-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} maxLength={256} /></label>
      <label className="nt-field">Role
        <select className="nt-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">User</option><option value="dietitian">Dietitian</option>
        </select>
      </label>
      <button className="nt-btn orange" disabled={busy}>Create account</button>
    </form>
  );
}

function Assign(props: {
  busy: boolean; users: Account[]; dietitians: Account[]; assignmentOf: Map<string, string>;
  onAssign: (username: string, dietitian: string) => Promise<boolean>;
}) {
  const [username, setUsername] = useState("");
  const [dietitian, setDietitian] = useState("");
  const current = username ? props.assignmentOf.get(username) : undefined;
  return (
    <form className="nt-card" onSubmit={async (e) => { e.preventDefault(); if (username) await props.onAssign(username, dietitian); }}>
      <h2 className="nt-h2">Assign a dietitian</h2>
      <p className="nt-muted">Each user has at most one dietitian. Choose “No dietitian” to unassign.</p>
      <label className="nt-field">User
        <select className="nt-select" value={username} onChange={(e) => { setUsername(e.target.value); setDietitian(props.assignmentOf.get(e.target.value) || ""); }} required>
          <option value="">Choose a user…</option>
          {props.users.map((u) => <option key={u.username} value={u.username}>{u.username}</option>)}
        </select>
      </label>
      <label className="nt-field">Dietitian
        <select className="nt-select" value={dietitian} onChange={(e) => setDietitian(e.target.value)} disabled={!username}>
          <option value="">No dietitian</option>
          {props.dietitians.map((d) => <option key={d.username} value={d.username}>{d.username}</option>)}
        </select>
        {current && <small>Currently assigned to {current}.</small>}
      </label>
      <button className="nt-btn" disabled={props.busy || !username}>Save assignment</button>
      {props.dietitians.length === 0 && <p className="nt-small" style={{ marginTop: 12 }}>Create a dietitian account first to assign users.</p>}
    </form>
  );
}
