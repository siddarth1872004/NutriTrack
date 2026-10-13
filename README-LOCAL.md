NutriTrack — one-click local setup
=================================

WINDOWS: Install Python 3.10+ from https://www.python.org/downloads/ if needed (enable Add Python to PATH). Clone/download this repository, then double-click Run-NutriTrack.bat. Your browser opens. On first launch create a username and password of at least 12 characters; later launches require sign-in.

LINUX: run chmod +x Run-NutriTrack.command && ./Run-NutriTrack.command, or python3 server.py.

MACOS: install Python 3 if necessary, then run Run-NutriTrack.command from Terminal. macOS may ask you to allow it.

No pip packages, Node.js or database service are needed. The local server binds to 127.0.0.1 and tries the next port if 8765 is occupied. Ctrl+C stops it.

AUTHENTICATION: the local account is stored in .nutritrack/auth.sqlite3. Passwords use PBKDF2-HMAC-SHA256 with random salts; sessions use an HttpOnly, SameSite cookie, expire after 12 hours, and failed attempts are rate-limited. This is a local-machine login gate, not public internet authentication. Do not expose this server to a network.

DATA PRIVACY: meal entries and profile data remain in this browser's LocalStorage, not in the auth database. The login gate does not encrypt browser storage or replace OS security. For public multi-user deployment use a maintained production server, HTTPS and server-side authorization.

FORGOT PASSWORD: stop the server and delete .nutritrack/auth.sqlite3 to reset the local login. This does not erase nutrition data in browser storage.
