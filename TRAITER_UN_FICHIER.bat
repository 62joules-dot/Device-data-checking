@echo off
REM ============================================================
REM  TRAITER UN FICHIER — double-cliquez ce fichier.
REM  1) Mettez le fichier Excel du client dans le dossier MY_FILE
REM  2) Double-cliquez ce .bat
REM  3) Les annonces prêtes s'ouvrent dans le dossier MY_FILE\resultats
REM ============================================================
cd /d "%~dp0"

set "SRC="
for %%f in ("MY_FILE\*.xlsx") do set "SRC=%%f"

if "%SRC%"=="" (
  echo.
  echo   Aucun fichier .xlsx trouve dans le dossier MY_FILE.
  echo   Mettez le fichier Excel du client dans MY_FILE puis relancez.
  echo.
  pause
  exit /b
)

echo Traitement de : %SRC%
echo.
pip install -r requirements.txt >nul 2>&1

cd src
python cli.py build "..\%SRC%" --out "..\MY_FILE\resultats" 1>nul
python make_ready_to_post.py "..\MY_FILE\resultats"
cd ..

echo.
echo ============================================================
echo TERMINE. Ouvre le dossier MY_FILE\resultats :
echo   PRET_A_POSTER.html       ^<-- annonces a copier-coller
echo   listings_a_verifier.xlsx ^<-- tableau des annonces
echo   exports\ebay_file_exchange.csv ^<-- import eBay
echo ============================================================
start "" "MY_FILE\resultats"
pause
