"use client";
import Link from "next/link";
import { FormEvent,useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginPage(){
 const router=useRouter();const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:f.get("username"),password:f.get("password")})});const b=await r.json();setBusy(false);if(!r.ok){setError(b.error||"Sign in failed.");return;}router.replace(b.user.role==="admin"?"/admin":b.user.role==="dietitian"?"/dietitian":"/dashboard");router.refresh();}
 return <main className="shell"><header className="topbar"><Link className="brand" href="/">NutriTrack<span>.</span></Link></header><section className="card" style={{maxWidth:440,margin:"40px auto"}}><h1 style={{fontSize:42}}>Welcome back.</h1><p className="muted">Sign in to NutriTrack.</p>{error&&<p className="error">{error}</p>}<form onSubmit={submit}><label className="field">Username<input name="username" required minLength={3} maxLength={40} autoComplete="username"/></label><label className="field">Password<input name="password" type="password" required minLength={12} maxLength={256} autoComplete="current-password"/></label><button className="button" disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form><p className="muted">New here? <Link href="/signup">Create an account</Link></p></section></main>;
}
