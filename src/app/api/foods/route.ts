import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(request:Request){
 const url=new URL(request.url),q=(url.searchParams.get("q")||"").trim().slice(0,100),category=(url.searchParams.get("category")||"").trim().slice(0,80);
 const limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit")||30)||30)),offset=Math.max(0,Number(url.searchParams.get("offset")||0)||0);
 const values:unknown[]=[],where:string[]=[];
 if(q){values.push("%"+q.replace(/[\\%_]/g,"\\$&")+"%");where.push("(name ILIKE $"+values.length+" ESCAPE E'\\\\' OR source_key ILIKE $"+values.length+" ESCAPE E'\\\\')");}
 if(category){values.push(category);where.push("category=$"+values.length);}
 values.push(limit,offset);
 try{const r=await db.query("SELECT id::text,source_key,name,category,unit,base,calories,protein,carbs,fat,serving_size,serving_label,countable_unit_name,countable_grams_each FROM foods "+(where.length?"WHERE "+where.join(" AND "):"")+" ORDER BY name LIMIT $"+(values.length-1)+" OFFSET $"+values.length,values);return NextResponse.json({foods:r.rows,limit,offset,query:q});}
 catch(e){console.error(e);return NextResponse.json({error:"Food database unavailable. Apply db/schema.sql and import js/foods.js."},{status:503});}
}
