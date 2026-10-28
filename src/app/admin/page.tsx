import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/paths";
import AdminConsole from "./AdminConsole";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(homeFor(user.role));
  return <AdminConsole currentUser={user.username} />;
}
