# NutriTrack

NutriTrack is a nutrition and weight tracker with three roles, each with its own workspace:

- **User**: tracks meals, water and weight, and reads dietitian recommendations.
- **Dietitian**: views assigned clients and writes recommendations.
- **Admin**: manages accounts, roles and dietitian assignments.

It runs as a Next.js application backed by **Supabase PostgreSQL**. It does not depend on Vercel and runs on any host with Node.js 22+.

## Quick start

```bash
cp .env.example .env.local     # then set DATABASE_URL to your Supabase URI
npm install
npm run db:import-foods        # creates the tables and loads the food catalogue
npm run db:seed-accounts       # one-time: see DEPLOYMENT.md for the environment variables
npm run build
npm start                      # http://localhost:3000
```

On Windows or macOS/Linux desktops, the launchers `Run-NutriTrack.bat` and `Run-NutriTrack.command` perform the install, build and start steps for you, provided `.env.local` exists.

Full database and deployment steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Features

- **Home and onboarding:** a landing page that adapts to your role, and a sign-up flow that asks for your main goal.
- **Daily tracker** (`/dashboard`): log foods by meal, watch calories and macros against your goals, track water and weight, review history, and import data from the older browser-only tracker. A checklist guides new users through their first steps.
- **Food catalogue** (`/foods`): search and filter by category, with per-serving details.
- **Recommendations** (`/recommendations`): notes from your dietitian plus balanced meal ideas.
- **Dietitian workspace** (`/dietitian`): assigned clients, each client's latest day, calories trend and weight, and recommendations.
- **Administration** (`/admin`): create accounts, change roles, enable or disable and delete accounts, reset passwords, and assign dietitians.
- **Account settings** (`/account`): change your own password.

## Testing

```bash
npm test                 # unit tests (Node 22.6+, no database needed)
npm run smoke            # end-to-end checks against a running server; see DEPLOYMENT.md
```

## Project layout

- `src/app`: Next.js pages and API routes (auth, admin, dietitian, foods, tracker data).
- `src/lib`: database connection, sessions and role checks.
- `public/`: static assets, including the legacy browser-first tracker (`index.html`) used by the tracker's data sync.
- `src/components/`: the shared site header, which adapts to the signed-in role.
- `db/schema.sql`: PostgreSQL schema.
- `scripts/`: food importer and account seeding.
- `js/foods.js`: the food catalogue imported into the database.
- `tests/unit/`: unit tests.

## Security

- Keep `DATABASE_URL` and all passwords out of git. `.env.local` is ignored.
- Use unique passwords of at least 12 characters for admin and dietitian accounts.
- Public sign-up creates standard user accounts only.
