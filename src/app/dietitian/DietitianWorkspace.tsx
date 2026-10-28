"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { summarizeTracker, type Summary } from "@/lib/tracker-summary";

type Client = { id: string; username: string; assigned_at: string; updated_at: string | null; has_data: boolean };
type Detail = { username: string; updated_at: string | null; snapshot: unknown; recommendations: { message: string; created_at: string }[] };

export default function DietitianWorkspace({ currentUser }: { currentUser: string }) {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadClients() {
    try {
      const r = await fetch("/api/dietitian/clients", { cache: "no-store", credentials: "same-origin" });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Could not load your clients.");
      setClients(b.clients);
      setLoadError("");
      setSelected((s) => s || b.clients[0]?.username || "");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load your clients.");
    }
  }
  useEffect(() => { loadClients(); }, []);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    let live = true;
    setDetailError("");
    fetch("/api/dietitian/clients/" + encodeURIComponent(selected), { cache: "no-store", credentials: "same-origin" })
      .then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error || "Could not load this client."); return b as Detail; })
      .then((d) => { if (live) setDetail(d); })
      .catch((e) => { if (live) { setDetail(null); setDetailError(e instanceof Error ? e.message : "Could not load this client."); } });
    return () => { live = false; };
  }, [selected]);

  const summary: Summary | null = useMemo(() => (detail ? summarizeTracker(detail.snapshot) : null), [detail]);
  const shown = (clients || []).filter((c) => c.username.toLowerCase().includes(search.trim().toLowerCase()));

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !message.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const r = await fetch("/api/dietitian/recommendations", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selected, message: message.trim() }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || "The recommendation could not be sent.");
      setMessage("");
      setNotice({ kind: "ok", text: `Recommendation sent to ${selected}.` });
      const fresh = await fetch("/api/dietitian/clients/" + encodeURIComponent(selected), { cache: "no-store", credentials: "same-origin" }).then((x) => x.json());
      setDetail(fresh);
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <main className="nt-wrap nt-page"><div className="nt-notice err" role="alert">{loadError}</div></main>;
  if (!clients) return <main className="nt-wrap nt-page"><p className="nt-muted">Loading your clients…</p></main>;

  const pct = (v: number, g: number) => Math.min(100, g > 0 ? (v / g) * 100 : 0);

  return (
    <main className="nt-wrap nt-page">
      <div className="nt-eyebrow">Dietitian workspace</div>
      <h1 className="nt-h1" style={{ fontSize: "clamp(36px,5vw,50px)" }}>Your <span>clients.</span></h1>
      <p className="nt-lede">Review each client’s latest day, weight trend and recommendations. Signed in as {currentUser}.</p>

      <div className="nt-stats">
        <div className="nt-stat"><small>Assigned clients</small><strong>{clients.length}</strong><small>Under your care</small></div>
        <div className="nt-stat"><small>Tracking</small><strong>{clients.filter((c) => c.has_data).length}</strong><small>Have synced data</small></div>
        <div className="nt-stat"><small>Recently active</small><strong>{clients.filter((c) => c.updated_at && Date.now() - new Date(c.updated_at).getTime() < 7 * 864e5).length}</strong><small>In the last 7 days</small></div>
        <div className="nt-stat"><small>Not yet tracking</small><strong>{clients.filter((c) => !c.has_data).length}</strong><small>Invite them to start</small></div>
      </div>

      {clients.length === 0 ? (
        <div className="nt-card nt-empty">No clients are assigned to you yet. An administrator assigns users to dietitians from the administration console.</div>
      ) : (
        <div className="nt-two">
          <div className="nt-card">
            <div className="nt-split" style={{ marginBottom: 12 }}>
              <h2 className="nt-h2" style={{ margin: 0 }}>Clients</h2>
              <input className="nt-input" style={{ maxWidth: 200, padding: "8px 11px" }} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search clients" />
            </div>
            {shown.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.username)} aria-pressed={selected === c.username}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textAlign: "left", padding: "12px 10px", border: 0, borderRadius: 12, background: selected === c.username ? "#faf7f1" : "transparent", cursor: "pointer", color: "inherit", font: "inherit" }}>
                <span><strong>{c.username}</strong><br /><small className="nt-muted">{c.has_data ? (c.updated_at ? "Synced " + c.updated_at : "Synced") : "Not tracking yet"}</small></span>
                {c.has_data ? <span className="nt-tag green">Tracking</span> : <span className="nt-tag">Invite</span>}
              </button>
            ))}
            {shown.length === 0 && <p className="nt-muted">No clients match “{search}”.</p>}
          </div>

          <div>
            {detailError && <div className="nt-notice err" role="alert">{detailError}</div>}
            {detail && summary && (
              <>
                <div className="nt-card">
                  <div className="nt-split">
                    <div><div className="nt-eyebrow">Client</div><h2 className="nt-h2" style={{ margin: 0 }}>{detail.username}</h2></div>
                    <span className="nt-small">{detail.updated_at ? "Last synced " + detail.updated_at : "No data synced yet"}</span>
                  </div>
                  {!summary.hasTracker ? (
                    <div className="nt-empty" style={{ marginTop: 14 }}>This client hasn’t logged anything in the tracker yet.</div>
                  ) : (
                    <>
                      <p className="nt-small" style={{ marginTop: 14 }}>Latest day with entries: {summary.latestDate}</p>
                      <div className="nt-bar"><i style={{ width: pct(summary.dayTotals.cal, summary.goals.cal) + "%" }} /></div>
                      <div className="nt-line"><span>Calories</span><strong>{Math.round(summary.dayTotals.cal)} / {summary.goals.cal} kcal</strong></div>
                      <div className="nt-line"><span>Protein</span><strong>{Math.round(summary.dayTotals.prot)} / {summary.goals.prot} g</strong></div>
                      <div className="nt-line"><span>Carbohydrates</span><strong>{Math.round(summary.dayTotals.carb)} / {summary.goals.carb} g</strong></div>
                      <div className="nt-line"><span>Fat</span><strong>{Math.round(summary.dayTotals.fat)} / {summary.goals.fat} g</strong></div>
                      <div className="nt-line"><span>Water</span><strong>{summary.water} / {summary.goals.water} ml</strong></div>

                      {summary.recentDays.length > 0 && (
                        <>
                          <h3 style={{ marginTop: 18 }}>Calories, last {summary.recentDays.length} days</h3>
                          <div className="nt-spark">
                            {summary.recentDays.map((d) => (
                              <div key={d.date} title={`${d.date}: ${d.cal} kcal`}><i style={{ height: Math.max(4, Math.min(100, (d.cal / summary.goals.cal) * 100)) + "%" }} />{d.date.slice(5)}</div>
                            ))}
                          </div>
                        </>
                      )}

                      {summary.meals.length > 0 && (
                        <>
                          <h3 style={{ marginTop: 18 }}>Foods on {summary.latestDate}</h3>
                          {summary.meals.map((m, i) => (
                            <div key={i} className="nt-line"><span>{m.name} <span className="nt-small">· {m.meal}</span></span><strong>{m.cal} kcal</strong></div>
                          ))}
                        </>
                      )}

                      {summary.weights.length > 0 && (
                        <>
                          <h3 style={{ marginTop: 18 }}>Recent weight</h3>
                          <div className="nt-line"><span>{summary.weights[summary.weights.length - 1].date}</span><strong>{summary.weights[summary.weights.length - 1].weight.toFixed(1)} kg</strong></div>
                          {summary.weights.length > 1 && <p className="nt-small">Change since {summary.weights[0].date}: {(summary.weights[summary.weights.length - 1].weight - summary.weights[0].weight).toFixed(1)} kg</p>}
                        </>
                      )}
                    </>
                  )}
                </div>

                <form className="nt-card" style={{ marginTop: 16 }} onSubmit={send}>
                  <h2 className="nt-h2">Send a recommendation</h2>
                  <p className="nt-muted">Clients see this on their Recommendations page. Keep it practical and specific.</p>
                  {notice && <div className={"nt-notice " + (notice.kind === "ok" ? "ok" : "err")} role="status">{notice.text}</div>}
                  <textarea className="nt-textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={10000} placeholder={`Write a note for ${detail.username}…`} aria-label="Recommendation message" required />
                  <div className="nt-split" style={{ marginTop: 10 }}>
                    <span className="nt-small">{message.length} / 10,000</span>
                    <button className="nt-btn orange" disabled={busy || !message.trim()}>{busy ? "Sending…" : "Send recommendation"}</button>
                  </div>
                </form>

                <div className="nt-card" style={{ marginTop: 16 }}>
                  <h2 className="nt-h2">Previous recommendations</h2>
                  {detail.recommendations.length === 0 && <p className="nt-muted">None yet.</p>}
                  {detail.recommendations.map((r, i) => (
                    <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                      <div className="nt-small">{r.created_at}</div>
                      <div className="nt-rec" style={{ marginTop: 6 }}>{r.message}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
