import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "NutriTrack", template: "%s · NutriTrack" },
  description: "Track meals, macros, hydration and weight, and get personalised guidance from your dietitian.",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { themeColor: "#f7f6f2", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The header needs the session, but the site should still render if the database is briefly unavailable.
  let user = null;
  try { user = await getCurrentUser(); } catch { user = null; }
  return (
    <html lang="en">
      <body>
        <SiteHeader user={user ? { username: user.username, role: user.role } : null} />
        {children}
        <footer className="nt-wrap nt-foot">
          <span><strong>NutriTrack.</strong> Nutrition, made personal. General information only, not medical advice.</span>
          <span>Need help? Ask your dietitian or an administrator.</span>
        </footer>
      </body>
    </html>
  );
}
