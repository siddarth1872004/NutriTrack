"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="nt-wrap nt-page">
      <div className="nt-card" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <div className="nt-eyebrow">Something went wrong</div>
        <h1 className="nt-h1" style={{ fontSize: 40 }}>Please try again.</h1>
        <p className="nt-muted">Your data is safe. If this keeps happening, check that the database is reachable.</p>
        <div className="nt-actions" style={{ justifyContent: "center" }}>
          <button className="nt-btn orange" onClick={() => reset()}>Try again</button>
          <a className="nt-btn soft" href="/">Home</a>
        </div>
      </div>
    </main>
  );
}
