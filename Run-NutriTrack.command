#!/bin/sh
# Installs, builds and starts NutriTrack against the database in .env.local.
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo 'Node.js 22 or newer is required: https://nodejs.org/'; read -r _; exit 1; }
[ -f .env.local ] || { echo 'Create .env.local from .env.example and set DATABASE_URL first (see DEPLOYMENT.md).'; read -r _; exit 1; }
npm install && npm run build && npm start
read -r _
