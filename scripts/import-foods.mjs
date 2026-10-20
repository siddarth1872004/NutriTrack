#!/usr/bin/env node
/**
 * Import the complete FOOD_DB export in js/foods.js into PostgreSQL.
 * Run: DATABASE_URL='postgresql://...' npm run db:import-foods
 * Applies db/schema.sql first. Upserts by source_key, so repeated runs are safe.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
const {Pool}=pg;
const dbUrl=process.env.DATABASE_URL;
if(!dbUrl){console.error("Missing DATABASE_URL environment variable.");process.exit(1);}
const pool=new Pool({connectionString:dbUrl,ssl:dbUrl.includes("localhost")?undefined:{rejectUnauthorized:false},max:1});
try{
 const schema=await readFile(resolve("db/schema.sql"),"utf8");
 await pool.query(schema);
 const moduleUrl=pathToFileURL(resolve("js/foods.js")).href;
 const imported=await import(moduleUrl);
 const foods=imported.default;
 if(!foods||typeof foods!=="object"||Array.isArray(foods))throw new Error("js/foods.js did not export a FOOD_DB object.");
 const entries=Object.entries(foods);
 if(!entries.length)throw new Error("FOOD_DB is empty; refusing to run an empty import.");
 let count=0;
 await pool.query("BEGIN");
 try{
  for(const [sourceKey,raw] of entries){
   const f=raw;
   for(const key of ["name","category","unit","base","cal","prot","carb","fat","servingSize","servingLabel"]){
    if(f[key]===undefined||f[key]===null)throw new Error("Food "+sourceKey+" is missing required field "+key);
   }
   const n=["base","cal","prot","carb","fat","servingSize"].map(k=>Number(f[k]));
   if(n.some(v=>!Number.isFinite(v)))throw new Error("Food "+sourceKey+" has a non-numeric nutrition value.");
   await pool.query(`INSERT INTO foods(source_key,name,category,unit,base,calories,protein,carbs,fat,serving_size,serving_label,countable_unit_name,countable_grams_each,source_data,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,NOW())
    ON CONFLICT(source_key) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,unit=EXCLUDED.unit,base=EXCLUDED.base,calories=EXCLUDED.calories,protein=EXCLUDED.protein,carbs=EXCLUDED.carbs,fat=EXCLUDED.fat,serving_size=EXCLUDED.serving_size,serving_label=EXCLUDED.serving_label,countable_unit_name=EXCLUDED.countable_unit_name,countable_grams_each=EXCLUDED.countable_grams_each,source_data=EXCLUDED.source_data,updated_at=NOW()`,
    [sourceKey,String(f.name),String(f.category),String(f.unit),n[0],n[1],n[2],n[3],n[4],n[5],String(f.servingLabel),f.countable?.unitName??null,f.countable?.gramsEach??null,JSON.stringify(f)]);
   count++;
  }
  await pool.query("COMMIT");
 }catch(e){await pool.query("ROLLBACK");throw e;}
 const total=await pool.query("SELECT COUNT(*)::int AS count FROM foods");
 console.log("Imported/upserted "+count+" food records. Total rows in foods table: "+total.rows[0].count+".");
}catch(error){console.error("Food import failed:",error);process.exitCode=1;}
finally{await pool.end();}
