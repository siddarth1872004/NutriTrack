import { Pool } from "pg";
declare global { var nutritrackPool: Pool | undefined; }
function makePool() {
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString) throw new Error("DATABASE_URL is missing. Configure hosted PostgreSQL.");
  return new Pool({connectionString,max:process.env.NODE_ENV==="production"?5:10,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,ssl:connectionString.includes("localhost")?undefined:{rejectUnauthorized:false}});
}
export const db=globalThis.nutritrackPool??makePool();
if(process.env.NODE_ENV!=="production") globalThis.nutritrackPool=db;
