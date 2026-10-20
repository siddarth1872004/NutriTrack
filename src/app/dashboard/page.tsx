import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NutritionTracker from "./tracker";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.role === "dietitian") redirect("/dietitian");
  return <NutritionTracker />;
}
