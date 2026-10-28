// Pure helpers that turn a stored tracker snapshot into dietitian-friendly numbers.
// Works on the tracker's own snapshot format (version 1). Anything else is reported as "no tracker data".

export type Totals = { cal: number; prot: number; carb: number; fat: number };
export type Summary = {
  hasTracker: boolean;
  latestDate: string | null;
  dayTotals: Totals;
  goals: Totals & { water: number };
  water: number;
  recentDays: { date: string; cal: number }[];
  weights: { date: string; weight: number }[];
  meals: { name: string; meal: string; cal: number }[];
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const DEFAULT_GOALS = { cal: 2000, prot: 150, carb: 250, fat: 65, water: 2500 };

export function summarizeTracker(snapshot: unknown): Summary {
  const empty: Summary = { hasTracker: false, latestDate: null, dayTotals: { cal: 0, prot: 0, carb: 0, fat: 0 }, goals: DEFAULT_GOALS, water: 0, recentDays: [], weights: [], meals: [] };
  if (!snapshot || typeof snapshot !== "object" || !Array.isArray((snapshot as { entries?: unknown }).entries)) return empty;
  const snap = snapshot as Record<string, unknown>;
  const entries = (snap.entries as Record<string, unknown>[]).filter((e) => e && typeof e === "object");
  const goalsRaw = (snap.goals && typeof snap.goals === "object" ? snap.goals : {}) as Record<string, unknown>;
  const goals = { cal: num(goalsRaw.cal) || DEFAULT_GOALS.cal, prot: num(goalsRaw.prot) || DEFAULT_GOALS.prot, carb: num(goalsRaw.carb) || DEFAULT_GOALS.carb, fat: num(goalsRaw.fat) || DEFAULT_GOALS.fat, water: num(goalsRaw.water) || DEFAULT_GOALS.water };
  const waterByDate = (snap.waterByDate && typeof snap.waterByDate === "object" ? snap.waterByDate : {}) as Record<string, unknown>;
  const weightEntries = (Array.isArray(snap.weightEntries) ? snap.weightEntries : []) as Record<string, unknown>[];

  const byDate = new Map<string, Record<string, unknown>[]>();
  for (const e of entries) {
    const date = String(e.date ?? "");
    if (!date) continue;
    byDate.set(date, [...(byDate.get(date) ?? []), e]);
  }
  const dates = [...byDate.keys()].sort();
  const latestDate = dates.length ? dates[dates.length - 1] : null;
  const latest = latestDate ? byDate.get(latestDate)! : [];
  const dayTotals = latest.reduce<Totals>((t, e) => ({ cal: t.cal + num(e.cal), prot: t.prot + num(e.prot), carb: t.carb + num(e.carb), fat: t.fat + num(e.fat) }), { cal: 0, prot: 0, carb: 0, fat: 0 });

  return {
    hasTracker: true,
    latestDate,
    dayTotals,
    goals,
    water: latestDate ? num(waterByDate[latestDate]) : 0,
    recentDays: dates.slice(-7).map((date) => ({ date, cal: Math.round(byDate.get(date)!.reduce((s, e) => s + num(e.cal), 0)) })),
    weights: weightEntries.map((w) => ({ date: String(w.date ?? ""), weight: num(w.weight) })).filter((w) => w.date && w.weight > 0).sort((a, b) => a.date.localeCompare(b.date)).slice(-10),
    meals: latest.map((e) => ({ name: String(e.name ?? "Food"), meal: String(e.meal ?? "Snacks"), cal: Math.round(num(e.cal)) })),
  };
}
