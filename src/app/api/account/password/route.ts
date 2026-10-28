import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, destroySessionsFor, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
export const runtime = "nodejs";

// Lets any signed-in person change their own password. All other sessions are signed out.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const body = await readJson(request);
  if (!body || typeof body.current !== "string" || typeof body.next !== "string") return jsonError("Current and new passwords are required.");
  if (body.next.length < 12 || body.next.length > 256) return jsonError("The new password must be 12–256 characters.");
  if (body.next === body.current) return jsonError("Choose a password that is different from your current one.");
  const r = await db.query("SELECT password_hash FROM users WHERE id=$1", [user.id]);
  if (!r.rows[0] || !(await bcrypt.compare(body.current, r.rows[0].password_hash))) return jsonError("Your current password is not correct.", 403);
  await db.query("UPDATE users SET password_hash=$2,updated_at=NOW() WHERE id=$1", [user.id, await bcrypt.hash(body.next, 12)]);
  await destroySessionsFor(user.id);
  await createSession(user.id);
  return NextResponse.json({ ok: true, message: "Your password has been changed." });
}
