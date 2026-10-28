import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { newSourceKey, parseFoodInput } from "@/lib/food-input";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = "id::text,source_key,name,category,unit,base,calories,protein,carbs,fat,serving_size,serving_label,countable_unit_name,countable_grams_each";

export async function GET(request: Request) {
  if (!(await requireRole("admin"))) return jsonError("Administrator access required.", 403);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100).replace(/[\\%_]/g, "\\$&");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const params: unknown[] = [];
  let where = "";
  if (q) { params.push(`%${q}%`); where = `WHERE name ILIKE $1 OR source_key ILIKE $1 OR category ILIKE $1`; }
  params.push(limit, offset);
  const [rows, total] = await Promise.all([
    db.query(`SELECT ${COLUMNS} FROM foods ${where} ORDER BY name LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
    db.query(`SELECT COUNT(*)::int AS n FROM foods ${where}`, q ? [`%${q}%`] : []),
  ]);
  return NextResponse.json({ foods: rows.rows, total: total.rows[0].n, limit, offset });
}

export async function POST(request: Request) {
  if (!(await requireRole("admin"))) return jsonError("Administrator access required.", 403);
  const body = await readJson(request);
  if (!body) return jsonError("Expected a JSON object.");
  const parsed = parseFoodInput(body);
  if (!parsed.ok) return jsonError(parsed.error);
  const f = parsed.value;
  try {
    const r = await db.query(
      `INSERT INTO foods(source_key,name,category,unit,base,calories,protein,carbs,fat,serving_size,serving_label,countable_unit_name,countable_grams_each,source_data)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'{}'::jsonb) RETURNING ${COLUMNS}`,
      [newSourceKey(f.name), f.name, f.category, f.unit, f.base, f.calories, f.protein, f.carbs, f.fat, f.serving_size, f.serving_label, f.countable_unit_name, f.countable_grams_each],
    );
    return NextResponse.json({ food: r.rows[0], message: `${f.name} added to the food database.` }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Could not add the food.", 500);
  }
}
