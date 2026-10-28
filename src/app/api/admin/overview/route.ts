import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const admin=await requireRole("admin");if(!admin)return jsonError("Administrator access required.",403);
 const [users,assignments]=await Promise.all([
  db.query("SELECT username,role,active,to_char(created_at,'YYYY-MM-DD HH24:MI') AS created_at FROM users ORDER BY username"),
  db.query("SELECT u.username,d.username AS dietitian FROM dietitian_assignments a JOIN users u ON u.id=a.user_id JOIN users d ON d.id=a.dietitian_id")
 ]);
 const list=users.rows as {role:string;active:boolean}[];
 return NextResponse.json({current_user:admin.username,total_users:list.length,active_users:list.filter(u=>u.active).length,admins:list.filter(u=>u.role==="admin"&&u.active).length,users:list,assignments:assignments.rows});
}
