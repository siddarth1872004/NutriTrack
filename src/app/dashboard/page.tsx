import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/paths";
import NutritionTracker from "./tracker";

export const dynamic = "force-dynamic";
export const metadata = { title: "My tracker" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "user") redirect(homeFor(user.role));
  return <NutritionTracker />;
}
