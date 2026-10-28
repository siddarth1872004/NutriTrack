"use client";
import { FormEvent, useState } from "react";

export default function AccountForm() {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) { setMsg({ kind: "err", text: "The new passwords don’t match." }); return; }
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const r = await fetch("/api/account/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: f.get("current"), next }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ kind: "err", text: b.error || "Could not change the password." }); }
      else { setMsg({ kind: "ok", text: b.message }); setNext(""); setConfirm(""); e.currentTarget.reset(); }
    } catch {
      setMsg({ kind: "err", text: "Could not reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="nt-card" onSubmit={submit}>
      <h2 className="nt-h2">Change password</h2>
      <p className="nt-muted">Use at least 12 characters. Other devices will be signed out.</p>
      {msg && <div className={"nt-notice " + (msg.kind === "ok" ? "ok" : "err")} role="status">{msg.text}</div>}
      <label className="nt-field">Current password
        <input name="current" type="password" required autoComplete="current-password" />
      </label>
      <label className="nt-field">New password
        <input type="password" required minLength={12} maxLength={256} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </label>
      <label className="nt-field">Confirm new password
        <input type="password" required minLength={12} maxLength={256} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>
      <button className="nt-btn block" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
      <p className="nt-small" style={{ marginTop: 16 }}>Forgotten your password? Ask an administrator to set a new one for you. They can do this from the administration console.</p>
    </form>
  );
}
