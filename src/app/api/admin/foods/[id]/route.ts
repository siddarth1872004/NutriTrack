import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { parseFoodInput } from "@/lib/food-input";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = "id::text,source_key,name,category,unit,base,calories,protein,carbs,fat,serving_size,serving_label,countable_unit_name,countable_grams_each";
const isId = (v: string) => /^[0-9]{1,18}$/.test(v);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole("admin"))) return jsonError("Administrator access required.", 403);
  const { id } = await params;
  if (!isId(id)) return jsonError("Invalid food id.", 400);
  const body = await readJson(request);
  if (!body) return jsonError("Expected a JSON object.");
  const parsed = parseFoodInput(body);
  if (!parsed.ok) return jsonError(parsed.error);
  const f = parsed.value;
  const r = await db.query(
    `UPDATE foods SET name=$2,category=$3,unit=$4,base=$5,calories=$6,protein=$7,carbs=$8,fat=$9,serving_size=$10,serving_label=$11,countable_unit_name=$12,countable_grams_each=$13,updated_at=NOW()
     WHERE id=$1 RETURNING ${COLUMNS}`,
    [id, f.name, f.category, f.unit, f.base, f.calories, f.protein, f.carbs, f.fat, f.serving_size, f.serving_label, f.countable_unit_name, f.countable_grams_each],
  );
  if (!r.rowCount) return jsonError("Food not found.", 404);
  return NextResponse.json({ food: r.rows[0], message: `${f.name} updated.` });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole("admin"))) return jsonError("Administrator access required.", 403);
  const { id } = await params;
  if (!isId(id)) return jsonError("Invalid food id.", 400);
  const r = await db.query("DELETE FROM foods WHERE id=$1 RETURNING name", [id]);
  if (!r.rowCount) return jsonError("Food not found.", 404);
  return NextResponse.json({ ok: true, message: `${r.rows[0].name} removed from the food database.` });
}
