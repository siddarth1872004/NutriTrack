// Shared PostgreSQL connection options for the Node scripts.
// Local servers (localhost, 127.0.0.1, ::1) use plain TCP. Anything else (Supabase, hosted
// Postgres) uses TLS, because hosted providers require encrypted connections.
export function poolConfig(connectionString){
  let host="";
  try{host=new URL(connectionString).hostname;}catch{throw new Error("DATABASE_URL is not a valid PostgreSQL URI.");}
  const local=["localhost","127.0.0.1","::1","[::1]"].includes(host);
  return {connectionString,max:1,ssl:local?false:{rejectUnauthorized:false}};
}
