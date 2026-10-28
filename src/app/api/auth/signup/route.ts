import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { isDemoName,jsonError,readJson,validUsername } from "@/lib/http";
export const runtime="nodejs";
const GOALS=["healthy_habits","manage_weight","energy","strength","balanced_meals"] as const;
type Goal=typeof GOALS[number];
export async function POST(request:Request){
 const body=await readJson(request);if(!body)return jsonError("Expected a JSON object.");
 const {username,password,confirm}=body;const goal=typeof body.goal==="string"&&GOALS.includes(body.goal as Goal)?body.goal:null;
 if(!validUsername(username))return jsonError("Username must be 3–40 letters, numbers, dots, underscores or hyphens.");
 if(isDemoName(username))return jsonError("Usernames starting with demo_ are reserved.");
 if(typeof password!=="string"||password.length<12||password.length>256)return jsonError("Password must be 12–256 characters.");
 if(password!==confirm)return jsonError("Passwords do not match.");
 const passwordHash=await bcrypt.hash(password,12);
 try{const r=await db.query("INSERT INTO users(username,password_hash,role,primary_goal) VALUES($1,$2,'user',$3) RETURNING id::text,username,role,primary_goal",[username,passwordHash,goal]);await createSession(r.rows[0].id);return NextResponse.json({user:r.rows[0]}, {status:201});}
 catch(e){if((e as {code?:string}).code==="23505")return jsonError("That username is already taken.",409);console.error(e);return jsonError("Could not create the account.",500);}
}
