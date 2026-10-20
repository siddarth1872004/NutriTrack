import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(){const user=await getCurrentUser();return user?NextResponse.json({user}):NextResponse.json({error:"Sign in required"},{status:401});}
