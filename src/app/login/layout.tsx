import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
// Already signed in? Go straight to the role's home instead of showing the form again.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try { user = await getCurrentUser(); } catch { /* database down: still show the form */ }
  if (user) redirect(user.role === "admin" ? "/admin" : user.role === "dietitian" ? "/dietitian" : "/dashboard");
  return children;
}
