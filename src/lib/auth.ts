import { createHash,randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
const COOKIE="nutritrack_session",TTL=43200;
export type Role="user"|"dietitian"|"admin";
export type CurrentUser={id:string;username:string;role:Role};
const hash=(v:string)=>createHash("sha256").update(v).digest("hex");
export async function createSession(userId:string){const token=randomBytes(32).toString("base64url"),expires=new Date(Date.now()+TTL*1000);await db.query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)",[userId,hash(token),expires]);(await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires});}
export async function destroySession(){const jar=await cookies(),token=jar.get(COOKIE)?.value;if(token)await db.query("DELETE FROM sessions WHERE token_hash=$1",[hash(token)]);jar.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});}
export async function getCurrentUser():Promise<CurrentUser|null>{const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const r=await db.query("SELECT u.id::text,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.active=TRUE LIMIT 1",[hash(token)]);return r.rows[0]??null;}
export async function requireRole(...roles:Role[]){const u=await getCurrentUser();return u&&roles.includes(u.role)?u:null;}
