import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jsonError,readJson } from "@/lib/http";
export const runtime="nodejs";
const ROLES={user:"demo_user",dietitian:"demo_dietitian",admin:"demo_admin"} as const;
// One-click showcase login. Only active when DEMO_MODE=true. Demo accounts have an unguessable
// random password (nobody can sign in with it) and are confined to other demo_* accounts.
export async function POST(request:Request){
 if(process.env.DEMO_MODE!=="true")return jsonError("Demo mode is disabled.",404);
 const body=await readJson(request);const role=body?.role;
 if(role!=="user"&&role!=="dietitian"&&role!=="admin")return jsonError("Choose user, dietitian or admin.");
 const ids:Record<string,string>={};
 for(const [r,name] of Object.entries(ROLES)){
  const hash=await bcrypt.hash(randomBytes(24).toString("base64url"),4);
  const res=await db.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,$3) ON CONFLICT(username) DO UPDATE SET role=EXCLUDED.role,active=TRUE RETURNING id::text",[name,hash,r]);
  ids[r]=res.rows[0].id;
 }
 await db.query("INSERT INTO dietitian_assignments(user_id,dietitian_id) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET dietitian_id=EXCLUDED.dietitian_id",[ids.user,ids.dietitian]);
 const sample={nutrilog_profile:JSON.stringify({age:'28',weight:'72',height:'176',gender:'female',activity:'1.55',goalMode:'maintain'}),nutrilog_goals:JSON.stringify({cal:2100,prot:120,carb:250,fat:65}),nutrilog_water_today:"1500"};
 await db.query("INSERT INTO nutrition_snapshots(user_id,payload) VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO NOTHING",[ids.user,JSON.stringify(sample)]);
 const has=await db.query("SELECT 1 FROM recommendations WHERE user_id=$1 LIMIT 1",[ids.user]);
 if(!has.rowCount)await db.query("INSERT INTO recommendations(user_id,dietitian_id,message) VALUES($1,$2,$3)",[ids.user,ids.dietitian,"Welcome to NutriTrack! Aim for protein at every meal and keep logging your water intake."]);
 await createSession(ids[role]);
 return NextResponse.json({user:{username:ROLES[role],role}});
}
export async function GET(){return NextResponse.json({enabled:process.env.DEMO_MODE==="true"});}
