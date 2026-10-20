import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(){const d=await requireRole("dietitian");if(!d)return NextResponse.json({error:"Dietitian access required."},{status:403});const r=await db.query("SELECT u.id::text,u.username,a.assigned_at,s.updated_at,s.payload FROM dietitian_assignments a JOIN users u ON u.id=a.user_id LEFT JOIN nutrition_snapshots s ON s.user_id=u.id WHERE a.dietitian_id=$1 AND u.active=TRUE ORDER BY u.username",[d.id]);return NextResponse.json({clients:r.rows});}
