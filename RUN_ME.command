#!/usr/bin/env bash
# Double-clickable / one-command runner for Mac & Linux.
# Creates a local .venv, installs deps, then runs everything.

cd "$(dirname "$0")"
ROOT="$(pwd)"
set -e

PY=python3
command -v python3 >/dev/null 2>&1 || PY=python

if [ ! -d "$ROOT/.venv" ]; then
  echo "==> Creating local virtualenv (.venv)..."
  "$PY" -m venv "$ROOT/.venv"
fi

PIP="$ROOT/.venv/bin/pip"
PYTHON="$ROOT/.venv/bin/python"

echo "==> Installing dependencies (pandas, openpyxl)..."
"$PIP" install -r "$ROOT/requirements.txt"

cd "$ROOT/src"

echo
echo "==> STEP 1: Processing the client's summary file (17 machine types, 79 units)"
"$PYTHON" intake_run.py ../data/client_listing_devices.xlsx

echo
echo "==> STEP 2: Full pipeline demo on sample data (listings + eBay CSV + feeds + research)"
"$PYTHON" cli.py all ../data/sample_devices.xlsx --mock

echo
echo "======================================================================"
echo "DONE. Open the 'output' folder next to this file:"
echo "  output/intake/data_collection_TEST.xlsx  <-- FILL THIS IN (has 2 examples)"
echo "  output/intake/MISSING_REPORT.md          <-- what data is still needed"
echo "  output/intake/listing_drafts.json        <-- ready-made titles + descriptions"
echo "  output/intake/outreach/broker_email_READY.txt   <-- Wave 5 email, ready to send"
echo "  output/intake/outreach/wave6_email_READY.txt     <-- Wave 6 (international) email"
echo "  output/intake/outreach/wave6_HIGH_RISK_DO_NOT_SEND.xlsx  <-- Russia/CIS: compliance first"
echo "  output/intake/outreach/Contacts_Master.xlsx     <-- 145 contacts + missing-email helper"
echo "  output/automation/*.json                 <-- per-platform publish data"
echo "  output/exports/*.csv/.tsv                <-- eBay / DOTmed / Machinio / Kitmondo"
echo "======================================================================"
