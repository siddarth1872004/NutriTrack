# NutriTrack — Next.js + Supabase + Vercel

NutriTrack's new deployment foundation uses Next.js App Router on Vercel and **Supabase Postgres** as its hosted SQL database. The app connects to PostgreSQL with the `pg` driver using a server-only `DATABASE_URL`. Supabase Auth is not currently used: the included account routes use NutriTrack's own bcrypt password hashes and HttpOnly cookie sessions.

The original static pages and local Python/SQLite app remain in the repository for local compatibility. The deployed tracker requires a valid NutriTrack session; it never falls back to an unauthenticated demo.

## 1. Create your Supabase database

1. Create a project at [Supabase](https://supabase.com/).
2. Open **Project Settings → Database → Connection string**.
3. Choose the connection method recommended for your runtime. For Vercel serverless functions, use Supabase's **Transaction pooler** connection string when available; use the session/direct connection for local migrations if your network supports it.
4. Copy the full PostgreSQL URI. Keep it private and do not commit it.

Set `DATABASE_URL` locally and in Vercel's **Project Settings → Environment Variables**. Use the correct value for Development, Preview, and Production. Keep database credentials server-side; do not prefix them with `NEXT_PUBLIC_`.

Example shape only (not a real credential):

```text
postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres
```

Use the exact URI and port shown in your Supabase dashboard. If the password contains URI-special characters, use the correctly URL-encoded password supplied by your provider.

## 2. Create the SQL tables and import the food catalogue

From the repository root with Node.js 20+:

```powershell
npm install
$env:DATABASE_URL = "YOUR_SUPABASE_POSTGRES_URI"
npm run db:import-foods
```

The importer first applies `db/schema.sql`, then imports the default `FOOD_DB` export from `js/foods.js`. It validates required nutrition fields, writes nutrition values to typed PostgreSQL columns, preserves each full original food object in JSONB (including optional countable-serving metadata), and upserts by the original JavaScript key (`source_key`). Re-running it updates matching records rather than duplicating them. Import is transactional and rolls back on validation or database errors.

Alternatively, paste and run `db/schema.sql` in the Supabase SQL Editor, then run the importer to load the foods. The SQL Editor alone creates the tables; it does not execute the JavaScript importer.

## 3. Create admin and dietitian accounts

No shared passwords are hardcoded in this public repository. Set your own passwords in your local terminal and run the one-time seed script:

```powershell
$env:INITIAL_ADMIN_USERNAME = "admin"
$env:INITIAL_ADMIN_PASSWORD = "YOUR_UNIQUE_ADMIN_PASSWORD"
$env:INITIAL_DIETITIAN_USERNAME = "dietitian"
$env:INITIAL_DIETITIAN_PASSWORD = "YOUR_UNIQUE_DIETITIAN_PASSWORD"
npm run db:seed-accounts
Remove-Item Env:INITIAL_ADMIN_PASSWORD, Env:INITIAL_DIETITIAN_PASSWORD
```

Use unique passwords of at least 12 characters. The script uses bcrypt hashes, never prints passwords, and refuses to reassign an existing username to a different role. It updates passwords for matching existing accounts, so run it only when you intend to seed/reset those accounts. Do not configure the initial passwords as persistent Vercel runtime environment variables.

## 4. Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com/).
2. Add `DATABASE_URL` to Vercel Environment Variables for Preview and Production.
3. Use Vercel's standard Next.js build command, `npm run build`.
4. Deploy. Check `/api/health` and `/api/foods?q=rice` on the deployed domain.
5. Ensure the schema and food import ran against the same Supabase project used by that deployment. Run the importer manually; do not run it for each serverless request.

## Current endpoints

- `POST /api/auth/signup` — creates standard user accounts only.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `GET /api/foods?q=rice&limit=30&offset=0`.
- `GET /api/health`.
- `POST /api/admin/users` and `POST /api/admin/assignments`.
- `GET /api/dietitian/clients` and `POST /api/dietitian/recommendations`.
- `GET/POST /api/my-data` and `GET /api/my-recommendations`.

## Migration status — read before retiring the old app

This is a Next.js/PostgreSQL foundation, **not yet a complete port of every original tracker feature**. The SQL schema includes users, sessions, foods, dietitian assignments, nutrition snapshots and recommendations. The new UI currently includes sign-in, sign-up, basic role landing pages, and food catalogue browsing. The legacy meal logger and weight charts are still served from the static tracker and persist browser keys locally, with account-scoped PostgreSQL snapshot sync in the deployed app. The sync endpoint requires `{ payload: ... }` and the deployed tracker now uses the authenticated session API. Browser LocalStorage import into the database, and full native Next.js admin/client-assignment/recommendation interfaces, remain incomplete.

The old `server.py` and `.nutritrack/auth.sqlite3` are not used by the Next.js deployment. Existing local user accounts and browser nutrition data are not automatically uploaded to Supabase. Keep backups until the data migration is implemented and verified.
