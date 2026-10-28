# NutriTrack — database and deployment

NutriTrack is a Next.js (App Router) application that stores everything in **Supabase PostgreSQL**. It runs on any machine with Node.js 20+; no hosting platform is required. Supabase Auth is not used: accounts use NutriTrack's own bcrypt password hashes and HttpOnly session cookies.

## 1. Create the Supabase database

1. Create a project at [Supabase](https://supabase.com/).
2. Open **Project Settings → Database → Connection string** and copy the **URI**.
3. Create `.env.local` in the project folder (copy `.env.example`) and set:

   ```text
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres
   ```

   URL-encode special characters in the password. Keep the file private; Next.js reads it on the server only. Never prefix it with `NEXT_PUBLIC_`.

## 2. Create the tables and import the food catalogue

```bash
npm install
npm run db:import-foods
```

The importer applies `db/schema.sql`, then upserts every food from `js/foods.js` by `source_key`. It runs in one transaction and is safe to re-run.

You can alternatively paste `db/schema.sql` into the Supabase SQL Editor; that creates the tables but does not load the foods.

## 3. Create the admin and dietitian accounts

Run this once, passing the passwords for this command only:

```bash
INITIAL_ADMIN_USERNAME=admin INITIAL_ADMIN_PASSWORD='a-strong-password' \
INITIAL_DIETITIAN_USERNAME=dietitian INITIAL_DIETITIAN_PASSWORD='another-strong-password' \
npm run db:seed-accounts
```

On Windows PowerShell, set the variables with `$env:NAME = "value"` first. Passwords must be at least 12 characters. Passwords are never printed or stored in plain text. Re-running the script resets those two accounts' passwords, so only run it when you intend to.

Public sign-up creates normal `user` accounts only. Admins promote users, disable accounts, and assign clients to dietitians from the admin workspace.

## 4. Run the application

```bash
npm run build
npm start          # serves http://localhost:3000
```

For development with hot reload, use `npm run dev`. Check the setup at `/api/health`, which should report `"database":"ok"` and the number of foods.

## 5. Put it on the internet (optional)

Any Node 22+ host works: a VPS, Railway, Render, Fly.io, or a container. Set `DATABASE_URL` as an environment variable on that host, run `npm run build && npm start`, and put it behind HTTPS. Session cookies are marked `Secure` in production, so HTTPS is required there.

Because the browser and server share one origin, no CORS setup is needed.

## Roles

| Role | Signs in to | Can |
| --- | --- | --- |
| User | `/dashboard` (daily tracker) | Track meals, weight and water; view recommendations; change own password |
| Dietitian | `/dietitian` | View assigned clients and write recommendations |
| Admin | `/admin` | Create users, change roles, enable/disable/delete accounts, assign dietitians |

Each workspace page is checked on the server, and every API route enforces its role again.

## Production checklist

- [ ] `DATABASE_URL` points at the Supabase project you intend to use (Transaction pooler on port 6543 for a hosted server).
- [ ] `npm run db:import-foods` has been run against that project, and `/api/health` reports `"database":"ok"`.
- [ ] Admin and dietitian accounts were created with strong, unique passwords, and the seed variables were not saved in any file.
- [ ] The site is served over HTTPS. Session cookies are `Secure` in production, and HSTS is sent.
- [ ] `npm test` passes (Node 22.6+), and `npm run smoke` passes against the deployed URL (see below).
- [ ] Backups of the Supabase project are enabled in the Supabase dashboard.

## Smoke test

After deploying, run the end-to-end checks. They create one throwaway `smoke_*` account and verify role boundaries, password change and reset, and login throttling. Use a non-production database for this, or delete the `smoke_*` accounts afterwards:

```bash
BASE_URL=https://your-site.example ADMIN_USERNAME=admin ADMIN_PASSWORD='...' \
DIETITIAN_USERNAME=dietitian DIETITIAN_PASSWORD='...' npm run smoke
```

## Login protection

Sign-in attempts are recorded in the `login_attempts` table. An account is locked for 15 minutes after 10 failed attempts, and an IP address after 200 failures in the same window (generous, since many people can share one address). The IP is read from `x-forwarded-for`, so configure your proxy to set that header from the real client address, and do not expose the app without one.

## Migration status

Everything is served by the Next.js app: sign-in and sign-up (with a starting goal), the daily tracker with server sync and legacy-data import, the food catalogue, recommendations, the dietitian workspace (client summaries and recommendations), the administration console (accounts, roles, assignments, password resets), and account settings for changing a password.

Forgotten passwords are handled by an administrator, who sets a new password from the console. Self-service email reset needs an email provider, which this project does not include.

The original local SQLite data (`.nutritrack/auth.sqlite3`) and browser LocalStorage data are not uploaded automatically. Keep backups of them until you have verified your data in Supabase.
