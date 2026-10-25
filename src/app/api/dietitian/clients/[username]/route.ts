import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError,validUsername } from "@/lib/http";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{username:string}>}){
 const d=await requireRole("dietitian");if(!d)return jsonError("Dietitian access required.",403);
 const {username}=await params;if(!validUsername(username))return jsonError("Invalid username.");
 const c=await db.query("SELECT u.id,u.username,to_char(s.updated_at,'YYYY-MM-DD HH24:MI') AS updated_at,s.payload FROM users u JOIN dietitian_assignments a ON a.user_id=u.id LEFT JOIN nutrition_snapshots s ON s.user_id=u.id WHERE u.username=$1 AND a.dietitian_id=$2 AND u.role='user' AND u.active=TRUE",[username,d.id]);
 const client=c.rows[0];if(!client)return jsonError("That user is not assigned to you.",403);
 const recs=await db.query("SELECT message,to_char(created_at,'YYYY-MM-DD HH24:MI') AS created_at FROM recommendations WHERE user_id=$1 AND dietitian_id=$2 ORDER BY created_at DESC LIMIT 50",[client.id,d.id]);
 return NextResponse.json({username:client.username,updated_at:client.updated_at,snapshot:client.payload??{},recommendations:recs.rows});
}
