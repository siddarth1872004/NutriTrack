import Link from "next/link";
export default function NotFound() {
  return (
    <main className="nt-wrap nt-page">
      <div className="nt-card" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <div className="nt-eyebrow">Page not found</div>
        <h1 className="nt-h1" style={{ fontSize: 40 }}>We couldn&apos;t find that page.</h1>
        <p className="nt-muted">The link may be out of date, or the page may have moved.</p>
        <div className="nt-actions" style={{ justifyContent: "center" }}>
          <Link className="nt-btn" href="/">Go to home</Link>
          <Link className="nt-btn soft" href="/foods">Search foods</Link>
        </div>
      </div>
    </main>
  );
}
