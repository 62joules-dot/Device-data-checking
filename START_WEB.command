#!/usr/bin/env bash
# Start the MedList HTML interface.
cd "$(dirname "$0")"
ROOT="$(pwd)"
set -e

PY=python3
command -v python3 >/dev/null 2>&1 || PY=python

if [ ! -d "$ROOT/.venv" ]; then
  echo "==> Creating .venv..."
  "$PY" -m venv "$ROOT/.venv"
fi

"$ROOT/.venv/bin/pip" install -q -r "$ROOT/requirements.txt"

echo "==> MedList UI → http://127.0.0.1:5050"
echo "    Press Ctrl+C to stop."
exec "$ROOT/.venv/bin/python" "$ROOT/web/app.py"
