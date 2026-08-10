#!/usr/bin/env bash
# Double-clickable / one-command runner for Mac & Linux.
# It installs the two required libraries, then runs everything.

cd "$(dirname "$0")"

echo "==> Installing dependencies (pandas, openpyxl)..."
pip3 install -r requirements.txt || pip install -r requirements.txt || true

cd src

echo
echo "==> STEP 1: Processing the client's summary file (17 machine types, 79 units)"
python3 intake_run.py ../data/client_listing_devices.xlsx || python intake_run.py ../data/client_listing_devices.xlsx

echo
echo "==> STEP 2: Full pipeline demo on sample data (listings + eBay CSV + feeds + research)"
python3 cli.py all ../data/sample_devices.xlsx --mock || python cli.py all ../data/sample_devices.xlsx --mock

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
