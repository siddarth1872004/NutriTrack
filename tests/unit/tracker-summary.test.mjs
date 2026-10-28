import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeTracker } from "../../src/lib/tracker-summary.ts";

test("unknown or legacy payloads report no tracker data", () => {
  assert.equal(summarizeTracker(null).hasTracker, false);
  assert.equal(summarizeTracker({ nutrilog_goals: "{}" }).hasTracker, false);
});

test("totals come from the latest day only", () => {
  const s = summarizeTracker({
    entries: [
      { date: "2026-10-26", name: "Idli", meal: "Breakfast", cal: 140, prot: 4, carb: 28, fat: 1 },
      { date: "2026-10-27", name: "Rice", meal: "Lunch", cal: 205, prot: 4, carb: 45, fat: 0.4 },
      { date: "2026-10-27", name: "Apple", meal: "Snacks", cal: 95, prot: 0.5, carb: 25, fat: 0.3 },
    ],
    goals: { cal: 2000, prot: 120, carb: 250, fat: 65, water: 2500 },
    waterByDate: { "2026-10-27": 1500 },
  });
  assert.equal(s.latestDate, "2026-10-27");
  assert.equal(Math.round(s.dayTotals.cal), 300);
  assert.equal(s.water, 1500);
  assert.equal(s.goals.cal, 2000);
  assert.equal(s.recentDays.length, 2);
});
