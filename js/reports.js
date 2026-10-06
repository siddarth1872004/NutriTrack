/* Progress & Reporting (pure functions, no DOM). */

export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sumEntries(entries = []) {
  return entries.reduce(
    (t, e) => ({
      cal: t.cal + (e.cal || 0),
      prot: t.prot + (e.prot || 0),
      carb: t.carb + (e.carb || 0),
      fat: t.fat + (e.fat || 0)
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  );
}

/**
 * Build a report for the last `days` days ending today.
 * `history` holds archived days; `todayEntries` is the live log.
 */
export function buildReport({ history = {}, todayEntries = [], goals, days = 7, today = new Date() }) {
  const rows = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const entries = i === 0 ? todayEntries : history[key];
    const logged = Array.isArray(entries) && entries.length > 0;
    rows.push({ date: key, logged, ...(logged ? sumEntries(entries) : { cal: 0, prot: 0, carb: 0, fat: 0 }) });
  }

  const loggedRows = rows.filter(r => r.logged);
  const n = loggedRows.length;
  const avg = k => (n ? loggedRows.reduce((s, r) => s + r[k], 0) / n : 0);
  const onTarget = loggedRows.filter(r => goals.cal > 0 && Math.abs(r.cal - goals.cal) <= goals.cal * 0.1).length;
  const kcalFromMacros = avg('prot') * 4 + avg('carb') * 4 + avg('fat') * 9;
  const split = kcalFromMacros
    ? {
        prot: Math.round((avg('prot') * 4 / kcalFromMacros) * 100),
        carb: Math.round((avg('carb') * 4 / kcalFromMacros) * 100),
        fat: Math.round((avg('fat') * 9 / kcalFromMacros) * 100)
      }
    : { prot: 0, carb: 0, fat: 0 };

  return {
    days,
    rows,
    loggedDays: n,
    avg: { cal: Math.round(avg('cal')), prot: Math.round(avg('prot')), carb: Math.round(avg('carb')), fat: Math.round(avg('fat')) },
    onTargetDays: onTarget,
    split,
    vsGoal: n ? Math.round(avg('cal') - goals.cal) : 0
  };
}

/** Weight change across the window from [{date, kg}] samples; null if < 2 points. */
export function weightChange(bodyWeight = [], days = 7, today = new Date()) {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const startKey = dateKey(start);
  const pts = bodyWeight.filter(w => w.date >= startKey).sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 2) return null;
  return +(pts.at(-1).kg - pts[0].kg).toFixed(1);
}

export function reportToCSV(report) {
  const lines = ['date,logged,calories,protein_g,carbs_g,fat_g'];
  for (const r of report.rows) {
    lines.push([r.date, r.logged ? 'yes' : 'no', Math.round(r.cal), r.prot.toFixed(1), r.carb.toFixed(1), r.fat.toFixed(1)].join(','));
  }
  return lines.join('\n');
}
