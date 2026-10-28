import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { homeFor, type Role } from "@/lib/paths";
export { homeFor };


// Serves a role-only HTML page from /public after checking the session on the server.
// Visitors without a session go to /login; other roles are sent to their own workspace.
export async function servePrivatePage(request: Request, role: Role, file: string) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (user.role !== role) return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  const html = await readFile(path.join(process.cwd(), "public", file), "utf8");
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
