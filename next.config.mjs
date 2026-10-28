// Role workspaces (/admin, /dietitian) are served by route handlers that check the session.
// The legacy tracker and other static pages live in /public and are served as-is.
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/dietitian.html", destination: "/dietitian", permanent: true },
      { source: "/legacy/:path*", destination: "/", permanent: true },
      { source: "/auth/logout", destination: "/login", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/(index|recommendations).html", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
};
export default nextConfig;
