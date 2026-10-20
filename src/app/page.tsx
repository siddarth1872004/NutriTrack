import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let foodCount = "—";
  let ready = false;

  try {
    const result = await db.query("SELECT COUNT(*)::int AS count FROM foods");
    foodCount = Number(result.rows[0]?.count ?? 0).toLocaleString();
    ready = true;
  } catch {}

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">NutriTrack<span>.</span></div>
        <span className="pill">Nutrition, made personal</span>
      </header>

      <section className="hero">
        <div className="eyebrow">Your health, your way</div>
        <h1>Know what you eat.<br />Own your progress.</h1>
        <p className="lede">
          Track meals, understand your nutrition, and make progress with a space
          designed for you. Choose how you want to use NutriTrack.
        </p>
      </section>

      <section className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,margin:"22px 0",flexWrap:"wrap"}}>
        <div>
          <h2 style={{margin:"0 0 6px"}}>Prefer the original NutriTrack?</h2>
          <p className="muted" style={{margin:0}}>Open the classic tracker with its original dashboard, food search, history, goals, templates and theme controls.</p>
        </div>
        <Link className="button" href="/legacy/index.html">Open classic tracker →</Link>
      </section>

      <section className="view-grid" aria-label="Choose a NutriTrack view">
        <Link className="view-card" href="/signup">
          <span className="view-number">01 / PERSONAL</span>
          <span className="view-icon" aria-hidden="true">↗</span>
          <h2>User</h2>
          <p>Log meals, follow your nutrition, and keep track of your progress.</p>
          <span className="view-action">Get started <span aria-hidden="true">→</span></span>
        </Link>

        <Link className="view-card" href="/login">
          <span className="view-number">02 / GUIDANCE</span>
          <span className="view-icon" aria-hidden="true">✳</span>
          <h2>Dietitian</h2>
          <p>Work with assigned clients and provide personalised recommendations.</p>
          <span className="view-action">Dietitian sign in <span aria-hidden="true">→</span></span>
        </Link>

        <Link className="view-card" href="/login">
          <span className="view-number">03 / MANAGEMENT</span>
          <span className="view-icon" aria-hidden="true">⌘</span>
          <h2>Admin</h2>
          <p>Manage accounts, assign dietitians, and oversee the platform.</p>
          <span className="view-action">Admin sign in <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      <footer className="home-footer">
        <span>{ready ? `${foodCount} foods in the nutrition catalogue` : "Nutrition tracking made simpler"}</span>
        <Link href="/foods">Browse food catalogue <span aria-hidden="true">→</span></Link>
      </footer>
    </main>
  );
}
