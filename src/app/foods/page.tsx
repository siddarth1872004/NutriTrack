"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Food = { id: string; name: string; category: string; calories: string; protein: string; carbs: string; fat: string; serving_size: string; serving_label: string; unit: string };
const PAGE = 30;

export default function FoodsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);

  useEffect(() => {
    fetch("/api/foods/categories").then((r) => r.json()).then((b) => setCategories(b.categories || [])).catch(() => {});
  }, []);

  // Reset to the first page whenever the search or category changes.
  useEffect(() => { setOffset(0); }, [query, category]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: query, limit: String(PAGE), offset: String(offset) });
        if (category) params.set("category", category);
        const r = await fetch("/api/foods?" + params.toString(), { signal: controller.signal });
        const b = await r.json();
        if (!r.ok) throw new Error(b.error || "Could not load foods.");
        setFoods((prev) => (offset === 0 ? b.foods : [...prev, ...b.foods]));
        setHasMore(b.foods.length === PAGE);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load foods.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, category, offset]);

  return (
    <main className="nt-wrap nt-page">
      <div className="nt-eyebrow">Food catalogue</div>
      <h1 className="nt-h1" style={{ fontSize: "clamp(36px,5vw,52px)" }}>Find something <span>nourishing.</span></h1>
      <p className="nt-lede">Search by name or filter by category. Values are shown per listed serving.</p>

      <label className="nt-field" style={{ maxWidth: 620 }}>
        <span className="sr-only">Search foods</span>
        <input className="nt-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by food name, e.g. rice, dosa, apple" aria-label="Search foods" />
      </label>

      <div className="nt-chips" role="group" aria-label="Filter by category">
        <button className="nt-chip" aria-pressed={category === ""} onClick={() => setCategory("")}>All</button>
        {categories.map((c) => (
          <button key={c.category} className="nt-chip" aria-pressed={category === c.category} onClick={() => setCategory(c.category)}>
            {c.category} <span style={{ opacity: 0.6 }}>{c.count}</span>
          </button>
        ))}
      </div>

      {error && <div className="nt-notice err" role="alert">{error}</div>}

      <div className="nt-grid" style={{ gridTemplateColumns: selected ? "minmax(0,1.6fr) minmax(0,1fr)" : "1fr", alignItems: "start" }}>
        <div className="nt-card">
          {foods.length === 0 && !loading && !error && (
            <div style={{ textAlign: "center", padding: "24px 8px" }}>
              <p className="nt-muted">No foods match “{query}”. Try a shorter word or pick a category.</p>
            </div>
          )}
          {foods.map((f) => (
            <div className="nt-food" key={f.id}>
              <div>
                <strong>{f.name}</strong>
                <small>{f.category} · {f.serving_label}</small>
              </div>
              <div className="nt-num">
                <strong>{Math.round(Number(f.calories)).toLocaleString()} kcal</strong>
                <small className="nt-muted">P {Number(f.protein).toFixed(1)}g · C {Number(f.carbs).toFixed(1)}g · F {Number(f.fat).toFixed(1)}g</small>
              </div>
              <button className="nt-btn soft" onClick={() => setSelected(f)} aria-label={"Details for " + f.name}>Details</button>
            </div>
          ))}
          {loading && <p className="nt-muted" style={{ padding: "12px 0" }}>Loading…</p>}
          {!loading && hasMore && (
            <div style={{ textAlign: "center", paddingTop: 14 }}>
              <button className="nt-btn soft" onClick={() => setOffset(offset + PAGE)}>Show more foods</button>
            </div>
          )}
        </div>

        {selected && (
          <aside className="nt-card" aria-label="Food details">
            <div className="nt-section" style={{ margin: 0 }}>
              <div><div className="nt-eyebrow">{selected.category}</div><h2 className="nt-h2">{selected.name}</h2></div>
              <button className="nt-btn soft" onClick={() => setSelected(null)} aria-label="Close details">×</button>
            </div>
            <p className="nt-muted">Per {selected.serving_label}</p>
            <div className="nt-food"><span>Energy</span><strong>{Math.round(Number(selected.calories))} kcal</strong></div>
            <div className="nt-food"><span>Protein</span><strong>{Number(selected.protein).toFixed(1)} g</strong></div>
            <div className="nt-food"><span>Carbohydrates</span><strong>{Number(selected.carbs).toFixed(1)} g</strong></div>
            <div className="nt-food"><span>Fat</span><strong>{Number(selected.fat).toFixed(1)} g</strong></div>
            <div className="nt-notice ok" style={{ marginTop: 16 }}>
              Want to log this? <Link href="/dashboard" style={{ fontWeight: 800 }}>Open your tracker</Link> and search for it there.
            </div>
          </aside>
        )}
      </div>
      <p className="nt-small" style={{ marginTop: 14 }}>Nutrition values vary by ingredients, brand and preparation.</p>
    </main>
  );
}
