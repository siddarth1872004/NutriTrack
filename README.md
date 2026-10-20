# NutriTrack

NutriTrack is a nutrition and weight-tracking application migrating from static HTML/JavaScript and a local Python/SQLite setup to **Next.js App Router on Vercel with Supabase PostgreSQL**.

## Quick start

1. Create a Supabase project and copy its PostgreSQL connection URI.
2. Set `DATABASE_URL` in your local shell (server-side only).
3. Run `npm install`.
4. Run `npm run db:import-foods`. It applies `db/schema.sql` and imports the complete `js/foods.js` catalogue.
5. Seed your admin and dietitian accounts with `npm run db:seed-accounts`, following [README-VERCEL.md](README-VERCEL.md).
6. Run `npm run dev` locally, or deploy the repository through Vercel with `DATABASE_URL` configured.

## Food importer

`scripts/import-foods.mjs` imports the default `FOOD_DB` export from `js/foods.js`. It validates required fields, stores nutrition values in typed SQL columns, preserves the full source record in JSONB, and uses the original JS key as a unique upsert key. Re-running it won't duplicate matching foods.

## Migration status

The new foundation includes PostgreSQL schema, bcrypt password hashing, HttpOnly session cookies, authentication routes, food search, basic role landing pages, and API endpoints for admin, dietitian, recommendations, and user snapshots.

**Not every old tracker feature has been migrated yet.** Meal logging, weight charts, LocalStorage import, and complete admin/dietitian interfaces still need to be ported. Existing local SQLite accounts and browser data are not automatically uploaded. Keep the old local app and backups until the migration is complete.

## Security

- Never commit Supabase connection strings or passwords.
- Keep `DATABASE_URL` server-side; never name it `NEXT_PUBLIC_DATABASE_URL`.
- Use unique strong passwords for admin and dietitian accounts.
- Public sign-up creates standard user accounts only.
