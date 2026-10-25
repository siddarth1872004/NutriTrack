import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDemoName,jsonError } from "@/lib/http";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const admin=await requireRole("admin");if(!admin)return jsonError("Administrator access required.",403);
 const demo=isDemoName(admin.username),f=demo?" WHERE username LIKE 'demo\\_%'":"";
 const [users,assignments]=await Promise.all([
  db.query("SELECT username,role,active,to_char(created_at,'YYYY-MM-DD HH24:MI') AS created_at FROM users"+f+" ORDER BY username"),
  db.query("SELECT u.username,d.username AS dietitian FROM dietitian_assignments a JOIN users u ON u.id=a.user_id JOIN users d ON d.id=a.dietitian_id"+(demo?" WHERE u.username LIKE 'demo\\_%'":""))
 ]);
 const list=users.rows as {role:string;active:boolean}[];
 return NextResponse.json({current_user:admin.username,total_users:list.length,active_users:list.filter(u=>u.active).length,admins:list.filter(u=>u.role==="admin"&&u.active).length,users:list,assignments:assignments.rows});
}
