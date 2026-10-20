import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function DashboardPage(){const user=await getCurrentUser();if(!user)redirect("/login");if(user.role==="admin")redirect("/admin");if(user.role==="dietitian")redirect("/dietitian");return <main className="shell"><header className="topbar"><Link className="brand" href="/">NutriTrack<span>.</span></Link><form action="/api/auth/logout" method="post"><button className="button secondary">Sign out</button></form></header><section className="hero"><div className="eyebrow">Your nutrition space</div><h1>Hello, {user.username}.</h1><p className="lede">Your account is ready. Browse the SQL-backed food catalogue. The old browser tracker and its localStorage data have not yet been migrated into this new interface.</p><Link className="button" href="/foods">Browse foods</Link></section></main>}
