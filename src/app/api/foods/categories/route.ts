import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const r = await db.query("SELECT category, COUNT(*)::int AS count FROM foods GROUP BY category ORDER BY category");
    return NextResponse.json({ categories: r.rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Food database unavailable." }, { status: 503 });
  }
}
