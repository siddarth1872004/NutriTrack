# NutriTrack — Next.js + PostgreSQL deployment

The Vercel migration lives in `src/app` and uses Next.js App Router, Node.js route handlers, PostgreSQL, bcrypt password hashes, and opaque HttpOnly session cookies. The original static files and local Python/SQLite app are retained while the tracker UI is migrated feature by feature.

## 1. Create a hosted PostgreSQL database

Create a Neon PostgreSQL project (or another hosted PostgreSQL database supported by Vercel). Copy its connection string. Do not commit it.

Set `DATABASE_URL` locally in your shell or in Vercel Project Settings → Environment Variables. For a Neon connection, use its pooled URL for the app if provided.

## 2. Apply schema and import every food

From the repository root, with Node.js 20+ installed:

```sh
npm install
# Set DATABASE_URL in your shell first.
npm run db:import-foods
```

The import script applies `db/schema.sql`, loads the default export from `js/foods.js`, validates each required nutrition field, and upserts each entry into `foods` by its original object key (`source_key`). It preserves every original food object in `source_data` JSONB, including optional countable serving metadata. Running it again updates matching foods instead of duplicating them. The script wraps the import in a transaction and rolls back on validation or database errors.

You can apply the schema without importing food data by running the SQL in `db/schema.sql` using your provider's SQL editor.

## 3. Seed initial admin and dietitian accounts

No shared/default password is embedded in the public repository. Set a unique password for each account in your local terminal, then run the one-time seeder:

```sh
export DATABASE_URL='your-postgres-connection-string'
export INITIAL_ADMIN_USERNAME='admin'
export INITIAL_ADMIN_PASSWORD='choose-a-unique-password-at-least-12-characters'
export INITIAL_DIETITIAN_USERNAME='dietitian'
export INITIAL_DIETITIAN_PASSWORD='choose-another-unique-password-at-least-12-characters'
npm run db:seed-accounts
unset INITIAL_ADMIN_PASSWORD INITIAL_DIETITIAN_PASSWORD
```

PowerShell equivalent:

```powershell
$env:DATABASE_URL = 'your-postgres-connection-string'
$env:INITIAL_ADMIN_USERNAME = 'admin'
$env:INITIAL_ADMIN_PASSWORD = 'choose-a-unique-password-at-least-12-characters'
$env:INITIAL_DIETITIAN_USERNAME = 'dietitian'
$env:INITIAL_DIETITIAN_PASSWORD = 'choose-another-unique-password-at-least-12-characters'
npm run db:seed-accounts
Remove-Item Env:INITIAL_ADMIN_PASSWORD, Env:INITIAL_DIETITIAN_PASSWORD
```

The seeder hashes passwords with bcrypt and updates the supplied account passwords if the usernames already exist with the expected roles. It refuses to change a username assigned to a different role. Never place these passwords in Vercel environment variables for regular app runtime or in source control.

## 4. Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Set `DATABASE_URL` in Vercel's environment variables for Preview and Production.
3. Use the default Next.js build command: `npm run build`.
4. Deploy. The server-side health endpoint is `/api/health`; food search is `/api/foods?q=rice`.
5. Run schema and food import once against the same hosted database that the deployment uses. Do not run the importer during each serverless request.

## API routes currently included

- `POST /api/auth/signup` — creates a normal user only.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `GET /api/foods?q=rice&limit=30&offset=0`.
- `GET /api/health`.

## Migration status — important

This is the first deployable Next.js/PostgreSQL foundation, not a claim that every screen from the old tracker has already been ported. The SQL schema includes users, sessions, foods, dietitian assignments, nutrition snapshots and recommendations. The current Next.js UI includes sign-in, sign-up, a basic role-specific landing page and food catalogue browsing. The full meal logger, weight charts, existing browser LocalStorage migration, admin account management, client assignment controls and dietitian recommendation editor still need to be ported to the new API before the old local app can be retired.

The old `server.py` and `.nutritrack/auth.sqlite3` are not used by the Next.js deployment. Existing local user accounts and personal tracker data are not automatically uploaded to the hosted database.
