import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jsonError,readJson,validUsername } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){
 const body=await readJson(request);if(!body)return jsonError("Expected a JSON object.");
 const {username,password,confirm}=body;
 if(!validUsername(username))return jsonError("Username must be 3–40 letters, numbers, dots, underscores or hyphens.");
 if(typeof password!=="string"||password.length<12||password.length>256)return jsonError("Password must be 12–256 characters.");
 if(password!==confirm)return jsonError("Passwords do not match.");
 const passwordHash=await bcrypt.hash(password,12);
 try{const r=await db.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,'user') RETURNING id::text,username,role",[username,passwordHash]);await createSession(r.rows[0].id);return NextResponse.json({user:r.rows[0]}, {status:201});}
 catch(e){if((e as {code?:string}).code==="23505")return jsonError("That username is already taken.",409);console.error(e);return jsonError("Could not create the account.",500);}
}
