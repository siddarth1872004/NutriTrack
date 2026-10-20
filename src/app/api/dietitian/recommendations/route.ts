import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError,readJson } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){const d=await requireRole("dietitian");if(!d)return jsonError("Dietitian access required.",403);const b=await readJson(request);if(!b)return jsonError("Expected a JSON object.");if(typeof b.username!=="string"||typeof b.message!=="string"||b.message.trim().length<1||b.message.length>10000)return jsonError("Username and a message of 1–10000 characters are required.");const client=await db.query("SELECT u.id FROM users u JOIN dietitian_assignments a ON a.user_id=u.id WHERE u.username=$1 AND a.dietitian_id=$2 AND u.role='user' AND u.active=TRUE",[b.username,d.id]);if(!client.rowCount)return jsonError("That user is not assigned to you.",403);const r=await db.query("INSERT INTO recommendations(user_id,dietitian_id,message) VALUES($1,$2,$3) RETURNING id::text,message,created_at",[client.rows[0].id,d.id,b.message.trim()]);return NextResponse.json({recommendation:r.rows[0]},{status:201});}
