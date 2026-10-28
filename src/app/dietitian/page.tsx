import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/paths";
import DietitianWorkspace from "./DietitianWorkspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client workspace" };

export default async function DietitianPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "dietitian") redirect(homeFor(user.role));
  return <DietitianWorkspace currentUser={user.username} />;
}
