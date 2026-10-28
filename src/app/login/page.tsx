"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { homeFor } from "@/lib/paths";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) { setError(b.error || "Sign-in failed. Please try again."); setBusy(false); return; }
      window.location.replace(homeFor(b.user.role));
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    post({ username: f.get("username"), password: f.get("password") });
  }

  return (
    <main className="nt-wrap nt-page">
      <div className="nt-card nt-auth">
        <div className="nt-eyebrow">Welcome back</div>
        <h1 className="nt-h2" style={{ fontSize: 36, letterSpacing: "-.05em" }}>Good to see you.</h1>
        <p className="nt-muted">Sign in to pick up where you left off.</p>
        {error && <div className="nt-notice err" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label className="nt-field">Username
            <input name="username" required minLength={3} maxLength={40} autoComplete="username" placeholder="your-username" />
          </label>
          <label className="nt-field">Password
            <input name="password" type="password" required maxLength={256} autoComplete="current-password" placeholder="Enter your password" />
          </label>
          <button className="nt-btn orange block" disabled={busy}>{busy ? "Signing in…" : "Sign in →"}</button>
        </form>
        <div className="nt-section" style={{ margin: "22px 0 0", borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <span className="nt-small">New to NutriTrack?</span>
          <Link className="nt-small" style={{ color: "var(--orange-dark)", fontWeight: 800 }} href="/signup">Create an account</Link>
        </div>
      </div>
    </main>
  );
}
