import { db } from "@/lib/db";

// Database-backed login throttling so limits hold across server instances and restarts.
const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_USER = 10;
const MAX_FAILURES_PER_IP = 40;

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("x-real-ip") || "unknown").slice(0, 64);
}

export async function isLoginBlocked(username: string, ip: string): Promise<boolean> {
  const r = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE username=$1)::int AS by_user,
       COUNT(*) FILTER (WHERE ip=$2)::int AS by_ip
     FROM login_attempts WHERE attempted_at > NOW() - ($3 || ' minutes')::interval`,
    [username, ip, String(WINDOW_MINUTES)],
  );
  const { by_user, by_ip } = r.rows[0];
  return by_user >= MAX_FAILURES_PER_USER || by_ip >= MAX_FAILURES_PER_IP;
}

export async function recordFailedLogin(username: string, ip: string): Promise<void> {
  await db.query("INSERT INTO login_attempts(username,ip) VALUES($1,$2)", [username.slice(0, 40), ip]);
}

export async function clearLoginFailures(username: string): Promise<void> {
  await db.query("DELETE FROM login_attempts WHERE username=$1", [username]);
}
