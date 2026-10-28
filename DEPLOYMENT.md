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

Any Node 20+ host works: a VPS, Railway, Render, Fly.io, or a container. Set `DATABASE_URL` as an environment variable on that host, run `npm run build && npm start`, and put it behind HTTPS. Session cookies are marked `Secure` in production, so HTTPS is required there.

Because the browser and server share one origin, no CORS setup is needed.

## Roles

| Role | Signs in to | Can |
| --- | --- | --- |
| User | `/dashboard` → tracker (`/index.html`) | Track meals, weight and water; view recommendations |
| Dietitian | `/dietitian` | View assigned clients and write recommendations |
| Admin | `/admin` | Create users, change roles, enable/disable/delete accounts, assign dietitians |

Each workspace page is checked on the server, and every API route enforces its role again.

## Migration status

The Next.js app covers sign-in, sign-up, role workspaces, food search, the tracker snapshot sync, and recommendations. The original static pages are reused for the tracker and workspace screens.

The original local SQLite data (`.nutritrack/auth.sqlite3`) and browser LocalStorage data are not uploaded automatically. Keep backups of them until you have verified your data in Supabase.
