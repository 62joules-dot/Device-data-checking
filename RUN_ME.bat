@echo off
REM Double-clickable runner for Windows. Installs libraries, then runs everything.
cd /d "%~dp0"

echo ==^> Installing dependencies (pandas, openpyxl)...
pip install -r requirements.txt

cd src

echo.
echo ==^> STEP 1: Processing the client's summary file (17 machine types, 79 units)
python intake_run.py ..\data\client_listing_devices.xlsx

echo.
echo ==^> STEP 2: Full pipeline demo on sample data (listings + eBay CSV + feeds + research)
python cli.py all ..\data\sample_devices.xlsx --mock

echo.
echo ======================================================================
echo DONE. Open the 'output' folder:
echo   output\intake\data_collection_TEST.xlsx   ^<-- FILL THIS IN (has 2 examples)
echo   output\intake\MISSING_REPORT.md            ^<-- what data is still needed
echo   output\intake\listing_drafts.json          ^<-- ready-made titles + descriptions
echo   output\intake\outreach\broker_email_READY.txt   ^<-- Wave 5 email, ready to send
echo   output\intake\outreach\wave6_email_READY.txt     ^<-- Wave 6 (international) email
echo   output\intake\outreach\wave6_HIGH_RISK_DO_NOT_SEND.xlsx  ^<-- Russia/CIS: compliance first
echo   output\intake\outreach\Contacts_Master.xlsx     ^<-- 145 contacts + missing-email helper
echo   output\automation\*.json                   ^<-- per-platform publish data
echo   output\exports\*.csv                        ^<-- eBay / DOTmed / Machinio / Kitmondo
echo ======================================================================
pause
