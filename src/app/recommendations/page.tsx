import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { homeFor } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recommendations" };

type Rec = { id: string; message: string; created_at: string; dietitian: string };

const IDEAS = [
  { tag: "Fibre rich", tagClass: "nt-tag green", title: "Green goodness bowl", body: "Leafy greens, chickpeas, avocado, cucumber and a bright lemon dressing.", icon: "🥗" },
  { tag: "Protein source", tagClass: "nt-tag blue", title: "Yogurt & berry oats", body: "Rolled oats, plain Greek yogurt, seasonal berries and a sprinkle of seeds.", icon: "🥣" },
  { tag: "Balanced meal", tagClass: "nt-tag", title: "Lentil & vegetable stew", body: "Comforting lentils with carrots, tomatoes and herbs, served with whole-grain bread.", icon: "🍲" },
];

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "user") redirect(homeFor(user.role));

  let recs: Rec[] = [];
  let assigned = false;
  let dbError = false;
  try {
    const [r, a] = await Promise.all([
      db.query("SELECT r.id::text, r.message, to_char(r.created_at,'YYYY-MM-DD HH24:MI') AS created_at, d.username AS dietitian FROM recommendations r JOIN users d ON d.id=r.dietitian_id WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 100", [user.id]),
      db.query("SELECT 1 FROM dietitian_assignments WHERE user_id=$1", [user.id]),
    ]);
    recs = r.rows;
    assigned = Boolean(a.rowCount);
  } catch {
    dbError = true;
  }

  return (
    <main className="nt-wrap nt-page">
      <div className="nt-eyebrow">Ideas for your goals</div>
      <h1 className="nt-h1" style={{ fontSize: "clamp(36px,5vw,52px)" }}>Make your next meal <span>count.</span></h1>
      <p className="nt-lede">Guidance from your dietitian, plus simple meal inspiration to help you build variety and balance.</p>

      {dbError && <div className="nt-notice err" role="alert">We couldn’t load your recommendations right now. Please refresh in a moment.</div>}

      <div className="nt-section"><div><div className="nt-eyebrow">From your dietitian</div><h2 className="nt-h2">Your recommendations</h2></div></div>
      {!dbError && recs.length === 0 && (
        <div className="nt-card" style={{ textAlign: "center", padding: 30 }}>
          <div className="nt-icon green" style={{ margin: "0 auto 12px" }}>♡</div>
          {assigned ? (
            <p className="nt-muted">Your dietitian hasn’t sent any recommendations yet. They will appear here as soon as they do.</p>
          ) : (
            <p className="nt-muted">You aren’t linked to a dietitian yet. Ask your administrator to assign one, or keep using the tracker and ideas below in the meantime.</p>
          )}
        </div>
      )}
      <div className="nt-grid">
        {recs.map((r) => (
          <article className="nt-card" key={r.id}>
            <div className="nt-section" style={{ margin: "0 0 10px" }}>
              <span className="nt-tag green">From {r.dietitian}</span>
              <span className="nt-small">{r.created_at}</span>
            </div>
            <div className="nt-rec">{r.message}</div>
          </article>
        ))}
      </div>

      <div className="nt-section"><div><div className="nt-eyebrow">Inspiration</div><h2 className="nt-h2">Balanced meal ideas</h2></div></div>
      <div className="nt-grid c3">
        {IDEAS.map((i) => (
          <article className="nt-card" key={i.title}>
            <div className="nt-icon" style={{ fontSize: 22 }} aria-hidden="true">{i.icon}</div>
            <div style={{ margin: "14px 0 8px" }}><span className={i.tagClass}>{i.tag}</span></div>
            <h3>{i.title}</h3>
            <p className="nt-muted">{i.body}</p>
          </article>
        ))}
      </div>

      <div className="nt-card" style={{ marginTop: 16 }}>
        <div className="nt-eyebrow">A gentle reminder</div>
        <h2 className="nt-h2">Progress over perfection.</h2>
        <p className="nt-muted" style={{ marginBottom: 0 }}>Choose ideas that fit your preferences, budget and dietary needs. For medical nutrition advice, speak with a qualified healthcare professional. You can also <Link href="/dashboard" style={{ color: "var(--orange-dark)", fontWeight: 800 }}>log today’s meals</Link> to see how they fit your targets.</p>
      </div>
    </main>
  );
}
