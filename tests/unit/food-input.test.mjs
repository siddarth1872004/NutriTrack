import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFoodInput, newSourceKey } from "../../src/lib/food-input.ts";

const good = { name: "Masala dosa", category: "South Indian", unit: "g", serving_label: "1 dosa", base: 100, calories: 320, protein: 8, carbs: 48, fat: 10, serving_size: 120 };

test("accepts a complete food record", () => {
  const r = parseFoodInput(good);
  assert.equal(r.ok, true);
  assert.equal(r.value.calories, 320);
  assert.equal(r.value.countable_grams_each, null);
});

test("accepts numeric strings from forms", () => {
  const r = parseFoodInput({ ...good, calories: "320", countable_grams_each: "40" });
  assert.equal(r.ok, true);
  assert.equal(r.value.countable_grams_each, 40);
});

test("rejects missing names, negative values and zero serving sizes", () => {
  assert.equal(parseFoodInput({ ...good, name: "x" }).ok, false);
  assert.equal(parseFoodInput({ ...good, calories: -5 }).ok, false);
  assert.equal(parseFoodInput({ ...good, calories: "abc" }).ok, false);
  assert.equal(parseFoodInput({ ...good, serving_size: 0 }).ok, false);
});

test("generated source keys are prefixed and url-safe", () => {
  const k = newSourceKey("Greek Yogurt (full fat)!");
  assert.match(k, /^admin:greek-yogurt-full-fat-[a-z0-9]+$/);
});
