import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError,readJson,validUsername } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){
 const admin=await requireRole("admin");if(!admin)return jsonError("Administrator access required.",403);
 const body=await readJson(request);if(!body)return jsonError("Expected a JSON object.");
 const {username,password,role}=body;
 if(!validUsername(username))return jsonError("Invalid username.");
 if(typeof password!=="string"||password.length<12||password.length>256)return jsonError("Password must be 12–256 characters.");
 if(role!=="user"&&role!=="dietitian")return jsonError("Admin can create user or dietitian accounts only.");
 try{const hash=await bcrypt.hash(password,12);const r=await db.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,$3) RETURNING id::text,username,role,active,created_at",[username,hash,role]);return NextResponse.json({user:r.rows[0],message:`Account ${username} created.`},{status:201});}
 catch(e){if((e as {code?:string}).code==="23505")return jsonError("Username already exists.",409);console.error(e);return jsonError("Could not create account.",500);}
}
