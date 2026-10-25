import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError,readJson,validUsername } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{username:string;action:string}>}){
 const admin=await requireRole("admin");if(!admin)return jsonError("Administrator access required.",403);
 const {username,action}=await params;
 if(!validUsername(username))return jsonError("Invalid username.");
 if(username===admin.username)return jsonError("You cannot change your own account here.",400);
 const found=await db.query("SELECT id,role,active FROM users WHERE username=$1",[username]);
 const target=found.rows[0];if(!target)return jsonError("Account not found.",404);
 const removesAdmin=target.role==="admin"&&target.active;
 const otherAdmins=async()=>Number((await db.query("SELECT COUNT(*)::int AS c FROM users WHERE role='admin' AND active=TRUE AND id<>$1",[target.id])).rows[0].c);
 if(action==="role"){
  const body=await readJson(request);const role=body?.role;
  if(role!=="user"&&role!=="dietitian"&&role!=="admin")return jsonError("Invalid role.");
  if(removesAdmin&&role!=="admin"&&!await otherAdmins())return jsonError("The last active administrator cannot be demoted.",409);
  await db.query("UPDATE users SET role=$2,updated_at=NOW() WHERE id=$1",[target.id,role]);
  await db.query("DELETE FROM dietitian_assignments WHERE user_id=$1 OR dietitian_id=$1",[target.id]);
 }else if(action==="disable"||action==="enable"){
  if(action==="disable"&&removesAdmin&&!await otherAdmins())return jsonError("The last active administrator cannot be disabled.",409);
  await db.query("UPDATE users SET active=$2,updated_at=NOW() WHERE id=$1",[target.id,action==="enable"]);
  if(action==="disable")await db.query("DELETE FROM sessions WHERE user_id=$1",[target.id]);
 }else if(action==="delete"){
  if(removesAdmin&&!await otherAdmins())return jsonError("The last active administrator cannot be deleted.",409);
  await db.query("DELETE FROM users WHERE id=$1",[target.id]);
 }else return jsonError("Unknown action.",404);
 return NextResponse.json({ok:true});
}
