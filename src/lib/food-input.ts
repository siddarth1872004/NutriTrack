// Validation for admin-managed food records. Pure, so it can be unit tested.
export type FoodInput = {
  name: string;
  category: string;
  unit: string;
  base: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  serving_label: string;
  countable_unit_name: string | null;
  countable_grams_each: number | null;
};

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseFoodInput(body: Record<string, unknown>): { ok: true; value: FoodInput } | { ok: false; error: string } {
  const name = text(body.name, 120);
  const category = text(body.category, 80);
  const unit = text(body.unit, 20) || "g";
  const serving_label = text(body.serving_label, 120);
  if (name.length < 2) return { ok: false, error: "Food name must be at least 2 characters." };
  if (!category) return { ok: false, error: "Category is required." };
  if (!serving_label) return { ok: false, error: "Serving label is required, for example “1 medium”." };
  const orDefault = (v: unknown, d: number) => (v === undefined || v === null || v === "" ? d : num(v));
  const fields = { base: orDefault(body.base, 100), calories: num(body.calories), protein: num(body.protein), carbs: num(body.carbs), fat: num(body.fat), serving_size: orDefault(body.serving_size, 100) };
  for (const [k, v] of Object.entries(fields)) {
    if (!Number.isFinite(v) || v < 0 || v > 100000) return { ok: false, error: `${k.replace("_", " ")} must be a number between 0 and 100000.` };
  }
  if (fields.base <= 0 || fields.serving_size <= 0) return { ok: false, error: "Base and serving size must be greater than 0." };
  const countableName = text(body.countable_unit_name, 40) || null;
  const gramsRaw = body.countable_grams_each === "" || body.countable_grams_each == null ? NaN : num(body.countable_grams_each);
  const grams = Number.isFinite(gramsRaw) && gramsRaw > 0 ? gramsRaw : null;
  return { ok: true, value: { name, category, unit, serving_label, ...fields, countable_unit_name: countableName, countable_grams_each: grams } };
}

// Stable identifier for admin-created foods. The importer uses JS keys; this prefix keeps them apart.
export function newSourceKey(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "food";
  return `admin:${slug}-${Math.random().toString(36).slice(2, 8)}`;
}
