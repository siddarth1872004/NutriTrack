import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(){const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Sign in required."},{status:401});if(u.role!=="user")return NextResponse.json({error:"User account required."},{status:403});const r=await db.query("SELECT r.id::text,r.message,r.created_at,d.username AS dietitian FROM recommendations r JOIN users d ON d.id=r.dietitian_id WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 100",[u.id]);return NextResponse.json({recommendations:r.rows});}
