#!/usr/bin/env node
/**
 * End-to-end smoke test against a running server.
 * Usage: BASE_URL=http://localhost:3000 ADMIN_USERNAME=admin ADMIN_PASSWORD=... \
 *        DIETITIAN_USERNAME=dietitian DIETITIAN_PASSWORD=... npm run smoke
 * It creates one throwaway user account (smoke_<random>) and checks role boundaries.
 */
const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const admin = { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD };
const diet = { username: process.env.DIETITIAN_USERNAME, password: process.env.DIETITIAN_PASSWORD };
if (!admin.username || !admin.password || !diet.username || !diet.password) {
  console.error("Set ADMIN_USERNAME, ADMIN_PASSWORD, DIETITIAN_USERNAME and DIETITIAN_PASSWORD.");
  process.exit(2);
}

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

// Minimal cookie jar: keeps the session cookie between requests.
function jar() {
  let cookie = "";
  return {
    async fetch(path, init = {}) {
      const headers = { ...(init.headers || {}), ...(cookie ? { cookie } : {}) };
      const res = await fetch(base + path, { ...init, headers, redirect: "manual" });
      const set = res.headers.getSetCookie?.() || [];
      for (const c of set) {
        const [pair] = c.split(";");
        if (pair.startsWith("nutritrack_session=")) cookie = pair;
      }
      return res;
    },
  };
}
const json = (body) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const anon = jar();
const health = await anon.fetch("/api/health");
check("health reports database ok", health.status === 200 && (await health.json()).database === "ok");

const guest = await anon.fetch("/admin");
check("anonymous /admin redirects to login", guest.status === 307 && (guest.headers.get("location") || "").endsWith("/login"));

const adminJar = jar();
const adminLogin = await adminJar.fetch("/api/auth/login", json(admin));
check("admin can sign in", adminLogin.status === 200);
check("admin can open /admin", (await adminJar.fetch("/admin")).status === 200);

const dietJar = jar();
check("dietitian can sign in", (await dietJar.fetch("/api/auth/login", json(diet))).status === 200);
check("dietitian cannot open /admin", (await dietJar.fetch("/admin")).status !== 200);
check("dietitian can open /dietitian", (await dietJar.fetch("/dietitian")).status === 200);

const name = "smoke_" + Math.random().toString(36).slice(2, 8);
const userJar = jar();
const signup = await userJar.fetch("/api/auth/signup", json({ username: name, password: "Smoke-test-pass-1", confirm: "Smoke-test-pass-1", goal: "energy" }));
check("public sign-up creates a user", signup.status === 201);
check("user cannot open /admin", (await userJar.fetch("/admin")).status !== 200);
check("user can read the catalogue", (await userJar.fetch("/api/foods?q=rice&limit=5")).status === 200);
check("user cannot read admin overview", (await userJar.fetch("/api/admin/overview")).status === 403);

const bad = jar();
let blocked = false;
for (let i = 0; i < 12 && !blocked; i++) {
  const r = await bad.fetch("/api/auth/login", json({ username: name, password: "wrong-password-here" }));
  blocked = r.status === 429;
}
check("repeated failed logins are throttled", blocked);

await adminJar.fetch("/api/auth/logout", { method: "POST" });
check("logout ends the admin session", (await adminJar.fetch("/api/auth/me")).status === 401);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
