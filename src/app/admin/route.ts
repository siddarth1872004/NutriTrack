import { servePrivatePage } from "@/lib/roles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return servePrivatePage(request, "admin", "admin.html");
}
