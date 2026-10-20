#!/usr/bin/env node
/**
 * One-time account seed. Set INITIAL_ADMIN_USERNAME/PASSWORD and
 * INITIAL_DIETITIAN_USERNAME/PASSWORD in your local shell, run, then unset them.
 * No default/shared passwords are embedded in the repository.
 */
import bcrypt from "bcryptjs";
import pg from "pg";
const {Pool}=pg,dbUrl=process.env.DATABASE_URL;
if(!dbUrl){console.error("DATABASE_URL is required.");process.exit(1);}
const adminName=process.env.INITIAL_ADMIN_USERNAME||"admin",adminPassword=process.env.INITIAL_ADMIN_PASSWORD;
const dietName=process.env.INITIAL_DIETITIAN_USERNAME||"dietitian",dietPassword=process.env.INITIAL_DIETITIAN_PASSWORD;
if(!adminPassword||adminPassword.length<12||!dietPassword||dietPassword.length<12){console.error("Set both INITIAL_ADMIN_PASSWORD and INITIAL_DIETITIAN_PASSWORD (minimum 12 characters each).");process.exit(1);}
if(!/^[A-Za-z0-9_.-]{3,40}$/.test(adminName)||!/^[A-Za-z0-9_.-]{3,40}$/.test(dietName)||adminName===dietName){console.error("Invalid or duplicate account usernames.");process.exit(1);}
const pool=new Pool({connectionString:dbUrl,ssl:dbUrl.includes("localhost")?undefined:{rejectUnauthorized:false},max:1});
try{
 await pool.query(await (await import("node:fs/promises")).readFile("db/schema.sql","utf8"));
 const adminHash=await bcrypt.hash(adminPassword,12),dietHash=await bcrypt.hash(dietPassword,12);
 await pool.query("BEGIN");
 try{
  for(const [username,passwordHash,role] of [[adminName,adminHash,"admin"],[dietName,dietHash,"dietitian"]]){
   const exists=await pool.query("SELECT id,role FROM users WHERE username=$1",[username]);
   if(exists.rowCount){if(exists.rows[0].role!==role)throw new Error("Username "+username+" already exists with a different role; no changes committed.");await pool.query("UPDATE users SET password_hash=$1,active=TRUE,updated_at=NOW() WHERE username=$2",[passwordHash,username]);}
   else await pool.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,$3)",[username,passwordHash,role]);
  }
  await pool.query("COMMIT");
 }catch(e){await pool.query("ROLLBACK");throw e;}
 console.log("Admin and dietitian accounts created/updated. Passwords were not printed.");
}catch(e){console.error("Account seeding failed:",e);process.exitCode=1;}
finally{await pool.end();}
