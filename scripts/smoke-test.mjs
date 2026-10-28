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
const ghost = "ghost_" + Math.random().toString(36).slice(2, 8);
let blocked = false;
for (let i = 0; i < 12 && !blocked; i++) {
  const r = await bad.fetch("/api/auth/login", json({ username: ghost, password: "wrong-password-here" }));
  blocked = r.status === 429;
}
check("repeated failed logins are throttled", blocked);

const changed = await userJar.fetch("/api/account/password", json({ current: "Smoke-test-pass-1", next: "Smoke-test-pass-2" }));
check("user can change their own password", changed.status === 200);
const relogin = await jar().fetch("/api/auth/login", json({ username: name, password: "Smoke-test-pass-2" }));
check("new password works after change", relogin.status === 200);
const reset = await adminJar.fetch("/api/admin/users/" + name + "/password", json({ password: "Smoke-reset-pass-3" }));
check("admin can reset a user's password", reset.status === 200);
check("reset signs the user out everywhere", (await userJar.fetch("/api/auth/me")).status === 401);
check("user can sign in with the reset password", (await jar().fetch("/api/auth/login", json({ username: name, password: "Smoke-reset-pass-3" }))).status === 200);

const newDiet = "diet_" + Math.random().toString(36).slice(2, 7);
const made = await adminJar.fetch("/api/admin/users", json({ username: newDiet, password: "Diet-created-pass-1", role: "dietitian" }));
check("admin can create a dietitian account", made.status === 201);
check("the new dietitian can sign in", (await jar().fetch("/api/auth/login", json({ username: newDiet, password: "Diet-created-pass-1" }))).status === 200);
check("a user cannot create accounts", (await userJar.fetch("/api/admin/users", json({ username: "nope_user1", password: "Nope-pass-123456", role: "user" }))).status === 403);

const foodBody = { name: "Smoke test bagel", category: "Bread", serving_label: "1 bagel", serving_size: 100, base: 100, calories: 250, protein: 10, carbs: 49, fat: 1 };
const addFood = await adminJar.fetch("/api/admin/foods", json(foodBody));
const added = addFood.status === 201 ? (await addFood.json()).food : null;
check("admin can add a food", Boolean(added));
if (added) {
  const edit = await adminJar.fetch("/api/admin/foods/" + added.id, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...foodBody, calories: 260 }) });
  check("admin can edit a food", edit.status === 200 && Number((await edit.json()).food.calories) === 260);
  check("the catalogue search finds it", (await userJar.fetch("/api/foods?q=Smoke%20test%20bagel")).status === 200 && (await (await userJar.fetch("/api/foods?q=Smoke%20test%20bagel")).json()).foods.some((f) => f.id === added.id));
  check("a user cannot change the food database", (await userJar.fetch("/api/admin/foods/" + added.id, { method: "DELETE" })).status === 403);
  check("admin can remove a food", (await adminJar.fetch("/api/admin/foods/" + added.id, { method: "DELETE" })).status === 200);
}
check("invalid food input is rejected", (await adminJar.fetch("/api/admin/foods", json({ ...foodBody, calories: -1 }))).status === 400);

await adminJar.fetch("/api/auth/logout", { method: "POST" });
check("logout ends the admin session", (await adminJar.fetch("/api/auth/me")).status === 401);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
