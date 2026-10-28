import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main className="nt-wrap nt-page">
      <div className="nt-eyebrow">Your account</div>
      <h1 className="nt-h1" style={{ fontSize: "clamp(36px,5vw,50px)" }}>Account <span>settings.</span></h1>
      <div className="nt-two" style={{ marginTop: 20 }}>
        <div className="nt-card">
          <h2 className="nt-h2">Profile</h2>
          <div className="nt-line"><span className="nt-muted">Username</span><strong>{user.username}</strong></div>
          <div className="nt-line"><span className="nt-muted">Role</span><strong style={{ textTransform: "capitalize" }}>{user.role}</strong></div>
          <p className="nt-small" style={{ marginTop: 14 }}>Usernames can’t be changed. Ask an administrator if you need a different one.</p>
        </div>
        <AccountForm />
      </div>
    </main>
  );
}
