"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Food = { id: string; name: string; category: string; unit: string; base: string; calories: string; protein: string; carbs: string; fat: string; serving_size: string; serving_label: string; countable_unit_name: string | null; countable_grams_each: string | null };
type Form = { name: string; category: string; unit: string; base: string; calories: string; protein: string; carbs: string; fat: string; serving_size: string; serving_label: string; countable_unit_name: string; countable_grams_each: string };
const EMPTY: Form = { name: "", category: "", unit: "g", base: "100", calories: "", protein: "", carbs: "", fat: "", serving_size: "100", serving_label: "100 g", countable_unit_name: "", countable_grams_each: "" };
const PAGE = 25;

export default function FoodManager() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Food | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/foods?q=${encodeURIComponent(query)}&limit=${PAGE}&offset=${offset}`, { cache: "no-store", credentials: "same-origin" });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Could not load foods.");
      setFoods(b.foods);
      setTotal(b.total);
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Could not load foods." });
    }
  }, [query, offset]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  useEffect(() => { setOffset(0); }, [query]);

  function edit(f: Food) {
    setEditing(f);
    setForm({
      name: f.name, category: f.category, unit: f.unit, base: f.base, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
      serving_size: f.serving_size, serving_label: f.serving_label, countable_unit_name: f.countable_unit_name ?? "", countable_grams_each: f.countable_grams_each ?? "",
    });
    setNotice(null);
  }
  function reset() { setEditing(null); setForm(EMPTY); }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const r = await fetch(editing ? `/api/admin/foods/${editing.id}` : "/api/admin/foods", {
        method: editing ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || "The food could not be saved.");
      setNotice({ kind: "ok", text: b.message });
      reset();
      await load();
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(f: Food) {
    if (!confirm(`Remove ${f.name} from the food database? Existing user logs keep their copy of the values.`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/foods/${f.id}`, { method: "DELETE", credentials: "same-origin" });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || "Could not remove the food.");
      setNotice({ kind: "ok", text: b.message });
      if (editing?.id === f.id) reset();
      await load();
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <section className="nt-card" style={{ marginTop: 16 }} aria-labelledby="food-admin">
      <div className="nt-split" style={{ marginBottom: 14 }}>
        <div><h2 id="food-admin" className="nt-h2" style={{ margin: 0 }}>Food database</h2><p className="nt-small" style={{ margin: 0 }}>{total.toLocaleString()} foods. Changes appear in search and in the tracker straight away.</p></div>
        <input className="nt-input" style={{ maxWidth: 260 }} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search foods" aria-label="Search foods" />
      </div>
      {notice && <div className={"nt-notice " + (notice.kind === "ok" ? "ok" : "err")} role="status">{notice.text}</div>}

      <div className="nt-two">
        <div className="nt-table-wrap">
          <table className="nt-table">
            <thead><tr><th>Food</th><th>Category</th><th>Per serving</th><th>Actions</th></tr></thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f.id} className={editing?.id === f.id ? "selected" : ""}>
                  <td><strong>{f.name}</strong><div className="nt-small">{f.serving_label}</div></td>
                  <td>{f.category}</td>
                  <td>{Math.round(Number(f.calories))} kcal · P {Number(f.protein).toFixed(1)} · C {Number(f.carbs).toFixed(1)} · F {Number(f.fat).toFixed(1)}</td>
                  <td><div className="nt-row-actions">
                    <button className="nt-btn soft sm" disabled={busy} onClick={() => edit(f)}>Edit</button>
                    <button className="nt-btn danger sm" disabled={busy} onClick={() => remove(f)}>Remove</button>
                  </div></td>
                </tr>
              ))}
              {foods.length === 0 && <tr><td colSpan={4}><div className="nt-empty">No foods match.</div></td></tr>}
            </tbody>
          </table>
          <div className="nt-split" style={{ marginTop: 10 }}>
            <button className="nt-btn soft sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</button>
            <span className="nt-small">{total ? offset + 1 : 0}–{Math.min(offset + PAGE, total)} of {total}</span>
            <button className="nt-btn soft sm" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Next</button>
          </div>
        </div>

        <form onSubmit={submit}>
          <h3 className="nt-h2" style={{ fontSize: 18 }}>{editing ? `Edit ${editing.name}` : "Add a food"}</h3>
          <div className="nt-grid c2" style={{ gap: 10 }}>
            <label className="nt-field">Name<input className="nt-input" required minLength={2} maxLength={120} value={form.name} onChange={set("name")} /></label>
            <label className="nt-field">Category<input className="nt-input" required maxLength={80} value={form.category} onChange={set("category")} /></label>
            <label className="nt-field">Serving label<input className="nt-input" required maxLength={120} placeholder="1 medium" value={form.serving_label} onChange={set("serving_label")} /></label>
            <label className="nt-field">Serving size (g or ml)<input className="nt-input" required type="number" min="0.1" step="any" value={form.serving_size} onChange={set("serving_size")} /></label>
            <label className="nt-field">Calories (kcal)<input className="nt-input" required type="number" min="0" step="any" value={form.calories} onChange={set("calories")} /></label>
            <label className="nt-field">Protein (g)<input className="nt-input" required type="number" min="0" step="any" value={form.protein} onChange={set("protein")} /></label>
            <label className="nt-field">Carbs (g)<input className="nt-input" required type="number" min="0" step="any" value={form.carbs} onChange={set("carbs")} /></label>
            <label className="nt-field">Fat (g)<input className="nt-input" required type="number" min="0" step="any" value={form.fat} onChange={set("fat")} /></label>
            <label className="nt-field">Countable unit (optional)<input className="nt-input" maxLength={40} placeholder="piece" value={form.countable_unit_name} onChange={set("countable_unit_name")} /></label>
            <label className="nt-field">Grams per piece (optional)<input className="nt-input" type="number" min="0" step="any" value={form.countable_grams_each} onChange={set("countable_grams_each")} /></label>
          </div>
          <div className="nt-row-actions" style={{ marginTop: 6 }}>
            <button className="nt-btn orange" disabled={busy}>{editing ? "Save changes" : "Add food"}</button>
            {editing && <button type="button" className="nt-btn soft" onClick={reset}>Cancel edit</button>}
          </div>
        </form>
      </div>
    </section>
  );
}
