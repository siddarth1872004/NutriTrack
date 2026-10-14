NutriTrack — local setup
========================

REQUIREMENTS
- Python 3.10 or newer.
- No pip packages, Node.js or external database service are required.
- The local server binds only to 127.0.0.1. Do not expose it to your network.

START
1. Run Run-NutriTrack.bat on Windows or Run-NutriTrack.command on Linux/macOS.
2. The launcher starts the local server and opens the browser. No administrator setup is required in the terminal.
3. On a fresh database, open /admin-setup (the login page also links to it), keep the suggested admin username admin, and choose a password of at least 12 characters.
4. The setup creates the admin account and, if the username is available, a demo dietitian account named dietitian. Its password is generated securely and shown once in the browser. Save it for testing; it is not displayed again.
5. If the existing admin password is not working, open /admin-setup, enter the existing active admin username, and set a new password. This recovery page is intended only for the local computer; do not expose NutriTrack to a network or share the recovery page.
6. Public sign-up creates normal user accounts only. Sign in as admin to create more users and assign clients to dietitians.

DEMO ACCOUNTS
- Admin username: admin by default (you choose the password during setup).
- Dietitian username: dietitian (a random password is shown once after setup).
- These are local demo accounts. Do not use demo data or credentials for a public deployment or real sensitive health data.

HTTP SERVER AND API CHECKS
- The server listens on 127.0.0.1 and defaults to port 8765. If occupied, it searches ports 8765–8794 and prints the actual URL. Always open the exact URL printed by the terminal.
- Keep the terminal window open. Stop the server with Ctrl+C before restarting it.
- Check server plus SQLite health at /health; expected JSON includes status=ok and database=ok.
- Open /api to inspect the available API route list. JSON APIs use Content-Type: application/json and session cookies are sent by browser requests on the same origin.
- Useful endpoints: GET /api/me, GET /api/admin/overview, POST /api/admin/users, POST /api/admin/assignments, GET /api/dietitian/clients, GET /api/dietitian/clients/{username}, POST /api/dietitian/recommendations, POST /api/my-data, and GET /api/my-recommendations.

DATA AND TROUBLESHOOTING
- The local SQLite database is stored at .nutritrack/auth.sqlite3. Do not delete this file to fix login problems; it contains accounts and related local records.
- The tracker stores browser data per account and syncs a snapshot to the local SQLite database while the tracker is open.
- If a port is busy, use the exact local URL printed at startup.
- Tests: python -m unittest discover -s tests -v.
