import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function DietitianPage(){const user=await getCurrentUser();if(!user)redirect("/login");if(user.role!=="dietitian")redirect(user.role==="admin"?"/admin":"/dashboard");const r=await db.query("SELECT COUNT(*)::int AS count FROM dietitian_assignments WHERE dietitian_id=$1",[user.id]);return <main className="shell"><header className="topbar"><Link className="brand" href="/">NutriTrack<span>.</span></Link><span className="pill">Dietitian workspace</span><form action="/api/auth/logout" method="post"><button className="button secondary">Sign out</button></form></header><section className="hero"><div className="eyebrow">Client care</div><h1>Welcome, {user.username}.</h1><p className="lede">You currently have {r.rows[0].count} assigned client(s). The assignment and recommendation SQL tables are ready for integration.</p><p className="muted">Client list and recommendation editing UI are not migrated yet.</p></section></main>}
