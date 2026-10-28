import { Pool } from "pg";

declare global {
  // Reuse the pool across hot reloads in development and warm serverless instances.
  var nutritrackPool: Pool | undefined;
}

function isLocalUrl(connectionString: string): boolean {
  try {
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(connectionString).hostname);
  } catch {
    return false;
  }
}

function getPool(): Pool {
  if (globalThis.nutritrackPool) return globalThis.nutritrackPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add your PostgreSQL (Supabase) connection URI to .env.local.");
  }

  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
    query_timeout: 15000,
    allowExitOnIdle: true,
    // Local servers use plain TCP; hosted Postgres (for example Supabase) requires TLS.
    ssl: isLocalUrl(connectionString) ? undefined : { rejectUnauthorized: false },
  });

  globalThis.nutritrackPool = pool;
  return pool;
}

// Defer reading DATABASE_URL and creating the pool until a request actually queries
// the database. Next.js can then import/compile API routes during the production build.
export const db = new Proxy({} as Pool, {
  get(_target, property) {
    const pool = getPool();
    const value = Reflect.get(pool, property, pool) as unknown;
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
