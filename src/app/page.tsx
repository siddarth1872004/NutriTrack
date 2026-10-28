import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let user = null;
  try { user = await getCurrentUser(); } catch { user = null; }
  const primary = user
    ? { href: homeFor(user.role), label: user.role === "user" ? "Open my tracker" : "Open my workspace" }
    : { href: "/signup", label: "Create your account" };
  return (
    <main>
      <section className="nt-wrap nt-hero">
        <div>
          <div className="nt-eyebrow">A healthier routine starts here</div>
          <h1 className="nt-h1">Eat well.<br />Feel <span>your best.</span></h1>
          <p className="nt-lede">Track your meals, understand your nutrition, and find practical ideas that fit your everyday life.</p>
          <div className="nt-actions">
            <Link className="nt-btn orange" href={primary.href}>{primary.label} →</Link>
            <Link className="nt-btn soft" href="/foods">Browse foods</Link>
          </div>
          <p className="nt-small">Your food choices, your goals, your pace.</p>
        </div>
        <div className="nt-art" role="img" aria-label="Illustration of a balanced meal">
          <div className="nt-float one">Daily balance<small>One choice at a time</small></div>
          <div className="nt-plate" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="nt-float two">Eat the rainbow<small>Variety matters</small></div>
        </div>
      </section>

      <section className="nt-wrap">
        <div className="nt-section">
          <div><div className="nt-eyebrow">Everything in one place</div><h2 className="nt-h2" style={{ fontSize: 26 }}>Your nutrition workspace</h2></div>
          <p className="nt-small">Choose where to start.</p>
        </div>
        <div className="nt-grid c3">
          <Link className="nt-card link" href="/signup"><div className="nt-icon">＋</div><h3>Create account</h3><p className="nt-muted">Pick a goal and set up your daily targets in a couple of minutes.</p><span className="go">Get started →</span></Link>
          <Link className="nt-card link" href="/dashboard"><div className="nt-icon green">◫</div><h3>Daily tracker</h3><p className="nt-muted">Log meals, watch calories and macros, and track water and weight.</p><span className="go">Open tracker →</span></Link>
          <Link className="nt-card link" href="/foods"><div className="nt-icon lav">⌕</div><h3>Food search</h3><p className="nt-muted">Search the catalogue and compare calories and macros per serving.</p><span className="go">Find food →</span></Link>
          <Link className="nt-card link" href="/recommendations"><div className="nt-icon green">✳</div><h3>Recommendations</h3><p className="nt-muted">Read guidance from your dietitian and browse balanced meal ideas.</p><span className="go">View ideas →</span></Link>
          <Link className="nt-card link" href="/login"><div className="nt-icon">↗</div><h3>Sign in</h3><p className="nt-muted">Pick up where you left off on any device.</p><span className="go">Sign in →</span></Link>
          <div className="nt-card"><div className="nt-icon lav">♡</div><h3>For care teams</h3><p className="nt-muted">Dietitians review assigned clients and send recommendations. Administrators manage accounts and assignments.</p></div>
        </div>
        <p className="nt-small" style={{ marginTop: 22 }}>Nutrition values are general estimates and vary by brand, preparation and serving size. For medical nutrition advice, speak with a qualified healthcare professional.</p>
      </section>
    </main>
  );
}
