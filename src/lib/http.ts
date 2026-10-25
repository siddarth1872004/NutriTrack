import { NextResponse } from "next/server";
export const jsonError=(error:string,status=400)=>NextResponse.json({error},{status});
export async function readJson(request:Request):Promise<Record<string,unknown>|null>{try{const v:unknown=await request.json();return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;}catch{return null;}}
export const validUsername=(v:unknown):v is string=>typeof v==="string"&&/^[A-Za-z0-9_.-]{3,40}$/.test(v);
export const isDemoName=(v:unknown)=>typeof v==="string"&&/^demo_/i.test(v);
