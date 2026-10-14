NutriTrack — one-click local setup
=================================

WINDOWS: Install Python 3.10+ from https://www.python.org/downloads/ if needed (enable Add Python to PATH). Clone/download this repository, then double-click Run-NutriTrack.bat. Your browser opens. On first launch create a username and password of at least 12 characters; the first account becomes the administrator. Later launches require sign-in.

LINUX: run chmod +x Run-NutriTrack.command && ./Run-NutriTrack.command, or python3 server.py.

MACOS: install Python 3 if necessary, then run Run-NutriTrack.command from Terminal. macOS may ask you to allow it.

ADMIN DASHBOARD: while signed in as an administrator, open http://127.0.0.1:<the-port-shown>/admin.html (use the actual local URL printed by the launcher). The dashboard can create users, dietitians and administrators; change account roles; disable/enable accounts; delete accounts; and assign each user to one active dietitian. User-role enforcement is performed by the server. You cannot remove or demote your own account or the last active administrator. Non-admin accounts cannot open the admin dashboard or its API. Dietitians sign in through the same login page and are redirected to their separate `/dietitian.html` workspace. They can only view users assigned by an admin and can save recommendations for those users. Users can read recommendations at `/recommendations.html`.

No pip packages, Node.js or database service are needed. The local server binds to 127.0.0.1 and tries the next port if 8765 is occupied. Ctrl+C stops it.

AUTHENTICATION: accounts are stored in .nutritrack/auth.sqlite3. Passwords use PBKDF2-HMAC-SHA256 with random salts; sessions use an HttpOnly, SameSite cookie, expire after 12 hours, and failed attempts are rate-limited. This is a local-machine login gate, not public internet authentication. Do not expose this server to a network.

DATA PRIVACY / LIMITATIONS: each user account's tracker data is partitioned in that browser's LocalStorage and a snapshot is synced to the local SQLite database about every five seconds while the tracker is open. The assigned dietitian can view that snapshot and write recommendations, which are stored in SQLite and shown to the user on the Dietitian notes page. Existing browser data is migrated to the first account that opens the tracker on that browser. Snapshots only update while the user is signed in and the tracker is open; this is a local classroom/demo prototype, not a clinical record system. The login gate does not encrypt browser storage or replace OS security. For public multi-user deployment, use a maintained production server, HTTPS, CSRF protections, secure session management, server-side authorization, backups and privacy controls.

FORGOT PASSWORD: stop the server and delete .nutritrack/auth.sqlite3 to reset local account setup. This removes all local login accounts but does not erase nutrition data in browser storage.
