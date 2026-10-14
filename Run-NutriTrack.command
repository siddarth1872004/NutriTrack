#!/bin/sh
cd "$(dirname "$0")"
command -v python3 >/dev/null 2>&1 || { echo 'Python 3 is required.'; read -r _; exit 1; }
python3 server.py --ensure-admin || exit $?
python3 server.py
