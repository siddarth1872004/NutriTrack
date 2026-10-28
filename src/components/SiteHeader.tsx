"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type HeaderUser = { username: string; role: "user" | "dietitian" | "admin" } | null;

// Navigation adapts to the signed-in role so each person only sees the tools they can use.
export default function SiteHeader({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items: { href: string; label: string }[] = [{ href: "/foods", label: "Food search" }];
  if (user?.role === "user") items.push({ href: "/dashboard", label: "My tracker" }, { href: "/recommendations", label: "Recommendations" });
  if (user?.role === "dietitian") items.push({ href: "/dietitian", label: "Client workspace" });
  if (user?.role === "admin") items.push({ href: "/admin", label: "Administration" });

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    window.location.assign("/login");
  }

  return (
    <header className="nt-header">
      <div className="nt-wrap">
        <Link className="nt-brand" href="/">NutriTrack<b>.</b></Link>
        <button className="nt-menu" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>Menu ☰</button>
        <nav id="site-nav" className={"nt-nav" + (open ? " open" : "")} aria-label="Primary">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={pathname === i.href ? "page" : undefined}>{i.label}</Link>
          ))}
          {user ? (
            <>
              <span className="nt-small" style={{ padding: "0 8px" }}>Signed in as <strong>{user.username}</strong></span>
              <button className="link" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link className="nt-btn orange" href="/signup" style={{ padding: "9px 14px" }}>Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
