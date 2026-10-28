"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

const GOALS = [
  ["healthy_habits", "Build healthier habits"],
  ["manage_weight", "Manage my weight"],
  ["energy", "Improve my energy"],
  ["strength", "Build strength"],
  ["balanced_meals", "Plan balanced meals"],
] as const;

export default function SignupPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    if (pw !== confirm) { setError("The passwords do not match. Please check them and try again."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: f.get("username"), password: pw, confirm, goal: f.get("goal") }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) { setError(b.error || "Could not create the account."); setBusy(false); return; }
      window.location.replace("/dashboard");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <main className="nt-wrap nt-page">
      <div className="nt-card nt-auth">
        <div className="nt-eyebrow">A fresh start</div>
        <h1 className="nt-h2" style={{ fontSize: 36, letterSpacing: "-.05em" }}>Make room for better habits.</h1>
        <p className="nt-muted">Create your account in under a minute. You can change your goals at any time.</p>
        {error && <div className="nt-notice err" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label className="nt-field">Username
            <input name="username" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_.\-]{3,40}" autoComplete="username" placeholder="3–40 letters, numbers, . _ -" />
            <small>This is how you sign in.</small>
          </label>
          <label className="nt-field">Password
            <input type="password" required minLength={12} maxLength={256} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="At least 12 characters" />
          </label>
          <label className="nt-field">Confirm password
            <input type="password" required minLength={12} maxLength={256} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Enter password again" />
          </label>
          <label className="nt-field">What is your main goal?
            <select name="goal" defaultValue="healthy_habits">
              {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <small>We use this to suggest a starting point. It is not medical advice.</small>
          </label>
          <button className="nt-btn orange block" disabled={busy}>{busy ? "Creating account…" : "Create account →"}</button>
        </form>
        <div className="nt-section" style={{ margin: "22px 0 0", borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <span className="nt-small">Already have an account?</span>
          <Link className="nt-small" style={{ color: "var(--orange-dark)", fontWeight: 800 }} href="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
