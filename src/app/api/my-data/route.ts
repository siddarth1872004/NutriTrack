import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError,readJson } from "@/lib/http";
export const runtime="nodejs";
export async function GET(){const u=await getCurrentUser();if(!u)return jsonError("Sign in required.",401);if(u.role!=="user")return jsonError("User account required.",403);const r=await db.query("SELECT payload,updated_at FROM nutrition_snapshots WHERE user_id=$1",[u.id]);return NextResponse.json({snapshot:r.rows[0]?.payload??null,updated_at:r.rows[0]?.updated_at??null});}
export async function POST(request:Request){const u=await getCurrentUser();if(!u)return jsonError("Sign in required.",401);if(u.role!=="user")return jsonError("User account required.",403);const b=await readJson(request);if(!b||!("payload" in b)||!b.payload||typeof b.payload!=="object"||Array.isArray(b.payload))return jsonError("Payload must be a JSON object.");const serialized=JSON.stringify(b.payload);if(serialized.length>1_000_000)return jsonError("Snapshot is too large.",413);await db.query("INSERT INTO nutrition_snapshots(user_id,payload,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(user_id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()",[u.id,serialized]);return NextResponse.json({ok:true});}
