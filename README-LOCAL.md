NutriTrack — local setup
========================

REQUIREMENTS
- Python 3.10 or newer.
- No pip packages, Node.js or external database service are required.
- The local server binds only to 127.0.0.1. Do not expose it to your network.

FIRST RUN
1. Run `Run-NutriTrack.bat` on Windows or `Run-NutriTrack.command` on Linux/macOS.
2. On the first run, the launcher opens a separate administrator-bootstrap prompt in the terminal. Create the admin username and password there. This is NOT public sign-up.
3. The launcher then starts NutriTrack and opens the browser.
4. For later launches, the existing admin is detected and the server starts without asking to create it again.

You can also run `python server.py --ensure-admin` to create the first administrator only when one does not already exist. `python server.py --create-admin` explicitly fails if an administrator already exists. Account passwords must be 12–256 characters.

ACCOUNT ROLES AND SIGN-UP
- **Administrator:** created only by the one-time terminal bootstrap. Admins manage accounts, roles, and dietitian assignments from `/admin.html`.
- **User:** public sign-up at `/signup` always creates a normal user account. It never grants administrator or dietitian permissions. Users can log food, set goals, view history/reports, and read dietitian notes at `/recommendations.html`.
- **Dietitian:** can only be created/promoted by an administrator. Dietitians sign in at `/login` and are redirected to `/dietitian.html`. They can view only active users assigned to them and can post recommendations for those assigned users.
- Each active user can have one assigned dietitian. Admins can assign, replace, or remove that assignment. Role/assignment permissions are checked by the server, not just by hiding pages.

DATA ISOLATION AND SYNC
- Browser nutrition keys are partitioned by account username for both user and admin sessions. Switching accounts in the same browser restores that account's own namespace instead of reusing the previous account's active data.
- User nutrition snapshots are sent to the local server while that user has the tracker open. Dietitians can read the last synced snapshot for users assigned to them. Recommendations are stored locally and shown to the relevant user.
- Existing unscoped browser data is migrated only for a user account when no account-specific data already exists in that browser. It is not copied into an admin account or another account once account namespaces exist.
- The sync is a local demo feature, not real-time collaboration. The tracker must be open and signed in for new nutrition changes to sync.

ADMIN DASHBOARD
Open `/admin.html` while signed in as admin. You can create accounts, change roles, enable/disable/delete accounts, and assign users to dietitians. The server prevents non-admins from using admin APIs and prevents dietitians from reading unassigned users. You cannot remove/demote your own admin account or remove the last active admin.

AUTHENTICATION
Passwords are stored as PBKDF2-HMAC-SHA256 hashes with random salts. Sessions use an HttpOnly, SameSite cookie and expire after 12 hours; failed sign-in attempts are rate-limited. Accounts and dietitian recommendations are stored in `.nutritrack/auth.sqlite3`. Do not delete that file unless you intend to remove local accounts and recommendations.

IMPORTANT LIMITATIONS
This is a local classroom/demo prototype, not a production medical-record platform. Nutrition snapshots sync from the browser into a local SQLite file; there is no hosted multi-device database service. Browser LocalStorage is not encrypted, and this login gate does not replace OS security. Before public deployment, use HTTPS, CSRF protection, secure server-side sessions, a maintained production server, robust authorization, data export/deletion policies, backups, and appropriate privacy controls.

TROUBLESHOOTING
- If the launcher asks you to create an administrator even though one should exist, check that you are running the same repository folder and that `.nutritrack/auth.sqlite3` is present.
- If you have an old installation where the first account was automatically made admin, that existing account remains admin for compatibility. New sign-ups are always normal users.
- Stop the server with Ctrl+C in the terminal.
