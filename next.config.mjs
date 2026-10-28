// Role workspaces (/admin, /dietitian) are served by route handlers that check the session.
// The tracker and other static pages live in /public and are served as-is.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/dietitian.html", destination: "/dietitian", permanent: true },
      { source: "/legacy/:path*", destination: "/", permanent: true },
      { source: "/auth/logout", destination: "/login", permanent: false },
    ];
  },
  async headers() {
    const hsts = process.env.NODE_ENV === "production"
      ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
      : [];
    return [
      { source: "/:path*", headers: [...securityHeaders, ...hsts] },
      { source: "/(index|recommendations).html", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
