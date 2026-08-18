@echo off
setlocal EnableExtensions
REM One-click deploy aibhive.com to Google Cloud Run (same as your usual gcloud deploy).
REM Requires: gcloud CLI logged in on this PC (gcloud auth login).
set "REPO=C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed"
set "SERVICE=aibhive"
set "REGION=us-central1"
set "PROJECT=gen-lang-client-0787280773"

if not exist "%REPO%\.git" (
  echo ERROR: Repo not found at %REPO%
  echo Edit REPO at the top of this script.
  exit /b 1
)

where gcloud >nul 2>&1
if errorlevel 1 (
  echo ERROR: gcloud not found. Install Google Cloud SDK, then run: gcloud auth login
  exit /b 1
)

cd /d "%REPO%"
echo.
echo Pulling latest main-fixed...
git fetch origin main-fixed
git checkout main-fixed
git pull origin main-fixed

echo.
echo Building...
call npm ci
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1

echo.
echo Deploying to Cloud Run (%SERVICE%, %REGION%, %PROJECT%)...
gcloud run deploy %SERVICE% --source . --region %REGION% --project %PROJECT% --quiet
if errorlevel 1 exit /b 1

echo.
echo Done. Hard-refresh https://aibhive.com/plants and open the Plants tab.
pause
