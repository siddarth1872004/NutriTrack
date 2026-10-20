# NutriTrack

NutriTrack is a nutrition and weight-tracking application. The repository is being migrated from a static HTML/JavaScript + local Python/SQLite setup to a **Next.js App Router application with a hosted PostgreSQL database**, suitable for Vercel.

## Vercel / Next.js setup

See **[README-VERCEL.md](README-VERCEL.md)** for the complete deployment guide, database schema, food import, and initial account seeding instructions.

### Quick start

1. Create a hosted PostgreSQL database (Neon is a suitable option).
2. Set `DATABASE_URL` locally.
3. Install dependencies with `npm install`.
4. Run `npm run db:import-foods`. This applies `db/schema.sql` and imports the full `js/foods.js` food catalogue into PostgreSQL.
5. Seed initial admin and dietitian accounts using the environment-driven `npm run db:seed-accounts` script as documented in README-VERCEL.md.
6. Run `npm run dev` locally, or import the repository into Vercel and deploy with its standard Next.js build.

## SQL food catalogue importer

The script at `scripts/import-foods.mjs` imports the default `FOOD_DB` export from `js/foods.js`. It validates each entry, stores numeric nutrition fields in typed PostgreSQL columns, preserves each full source object in a JSONB column, and uses the original JS key as a unique upsert key. You can safely run it more than once without duplicating the same foods.

```sh
npm install
export DATABASE_URL='your-postgres-connection-string'
npm run db:import-foods
```

## Current migration status

The Next.js foundation includes a PostgreSQL schema, secure password hashing, HttpOnly session cookies, sign-up/sign-in, food search, role-specific landing pages, admin user creation and dietitian assignment APIs, dietitian client/recommendation APIs, and user nutrition snapshot APIs.

**Not all old tracker features have been ported yet.** The original static pages and Python local server remain in the repository while the full meal logger, weight charts, LocalStorage import, and complete admin/dietitian interface are migrated. Existing local SQLite accounts and browser nutrition data are not automatically uploaded to the hosted database. Do not retire the local version until the remaining UI and data migration are complete.

## Security notes

- Do not commit database connection strings or passwords.
- Public sign-up can create only standard user accounts; privileged roles are provisioned separately.
- Use unique, strong admin and dietitian passwords. No shared demo password is hardcoded in the repository.
- Configure Vercel's `DATABASE_URL` environment variable for the correct deployment environment.
