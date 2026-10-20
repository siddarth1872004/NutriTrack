import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(){try{await db.query("SELECT 1");const r=await db.query("SELECT COUNT(*)::int AS foods FROM foods");return NextResponse.json({status:"ok",database:"ok",foods:r.rows[0].foods});}catch{return NextResponse.json({status:"error",database:"unavailable"},{status:503});}}
