import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jsonError, readJson, validUsername } from "@/lib/http";
import { clearLoginFailures, clientIp, isLoginBlocked, recordFailedLogin } from "@/lib/ratelimit";
export const runtime = "nodejs";

const INVALID = "Invalid username or password.";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Expected a JSON object.");
  if (!validUsername(body.username) || typeof body.password !== "string" || body.password.length > 256) {
    return jsonError(INVALID, 401);
  }
  const username = body.username;
  const ip = clientIp(request);
  if (await isLoginBlocked(username, ip)) {
    return jsonError("Too many failed sign-in attempts. Wait 15 minutes and try again.", 429);
  }
  const r = await db.query("SELECT id::text,username,role,password_hash,active FROM users WHERE username=$1 LIMIT 1", [username]);
  const user = r.rows[0];
  // Always run bcrypt so response timing does not reveal whether a username exists.
  const passwordOk = await bcrypt.compare(body.password, user?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !user.active || !passwordOk) {
    await recordFailedLogin(username, ip);
    return jsonError(INVALID, 401);
  }
  await clearLoginFailures(username);
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } });
}
