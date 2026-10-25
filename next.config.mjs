// One canonical URL per view. Role pages are static HTML in /public served at clean URLs.
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
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/admin", destination: "/admin.html" },
        { source: "/dietitian", destination: "/dietitian.html" },
      ],
    };
  },
  async headers() {
    return [{ source: "/(admin|dietitian|recommendations|index).html", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
};
export default nextConfig;
