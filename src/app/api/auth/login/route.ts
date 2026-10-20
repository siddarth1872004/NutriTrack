import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jsonError,readJson,validUsername } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){
 const body=await readJson(request);if(!body)return jsonError("Expected a JSON object.");
 if(!validUsername(body.username)||typeof body.password!=="string")return jsonError("Invalid username or password.",401);
 const r=await db.query("SELECT id::text,username,role,password_hash,active FROM users WHERE username=$1 LIMIT 1",[body.username]);
 const user=r.rows[0];if(!user||!user.active||!(await bcrypt.compare(body.password,user.password_hash)))return jsonError("Invalid username or password.",401);
 await createSession(user.id);return NextResponse.json({user:{id:user.id,username:user.username,role:user.role}});
}
