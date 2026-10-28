import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError,readJson,validUsername } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){
 const admin=await requireRole("admin");if(!admin)return jsonError("Administrator access required.",403);
 const b=await readJson(request);if(!b)return jsonError("Expected a JSON object.");
 if(!validUsername(b.username))return jsonError("A valid username is required.");
 if(b.dietitian===""){await db.query("DELETE FROM dietitian_assignments WHERE user_id=(SELECT id FROM users WHERE username=$1)",[b.username]);return NextResponse.json({ok:true,message:`${b.username} is now unassigned.`});}
 if(!validUsername(b.dietitian))return jsonError("A valid dietitian is required.");
 const client=await db.query("SELECT id FROM users WHERE username=$1 AND role='user' AND active=TRUE",[b.username]);
 const dietitian=await db.query("SELECT id FROM users WHERE username=$1 AND role='dietitian' AND active=TRUE",[b.dietitian]);
 if(!client.rowCount||!dietitian.rowCount)return jsonError("Active user and dietitian accounts are required.",404);
 await db.query("INSERT INTO dietitian_assignments(user_id,dietitian_id) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET dietitian_id=EXCLUDED.dietitian_id,assigned_at=NOW()",[client.rows[0].id,dietitian.rows[0].id]);
 return NextResponse.json({ok:true,message:`${b.username} assigned to ${b.dietitian}.`,username:b.username,dietitian:b.dietitian});
}
