@echo off
setlocal EnableExtensions
REM Apply AiBhive Plants iridology section to your LOCAL repo (no GitHub required).
REM Default repo path — edit if yours differs:
set "REPO=C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed"
set "BUNDLE=%~dp0..\local-sync\iridology-bundle"

if not exist "%REPO%\.git" (
  echo ERROR: Git repo not found at:
  echo   %REPO%
  echo Edit REPO at the top of this script.
  exit /b 1
)

if not exist "%BUNDLE%" (
  echo ERROR: Bundle folder missing:
  echo   %BUNDLE%
  echo Copy the whole repo including local-sync\iridology-bundle from Cursor/cloud workspace.
  exit /b 1
)

echo.
echo Applying iridology files to: %REPO%
echo.

cd /d "%REPO%"

REM Copy all bundled source files into repo (preserves paths)
xcopy /E /Y /I "%BUNDLE%\*" "%REPO%\" >nul
if errorlevel 1 (
  echo xcopy failed.
  exit /b 1
)

git add server/iridologyAnalysis.js server/iridologyHistory.js server/iridologyKnowledge.json server/plantMedicineChat.js server/plantMedicineRoutes.js scripts/public-routes.mjs src/App.tsx src/components/hive-apps/OregonPlantMedicineWebApp.tsx src/components/hive-apps/oregon-plant-medicine/Iridology*.tsx src/lib/oregonPlantMedicine/iridology*.ts src/lib/oregonPlantMedicine/branding.ts src/lib/oregonPlantMedicine/livingKnowledgeAsk.ts src/lib/oregonPlantMedicine/livingKnowledgeRag.ts src/lib/oregonPlantMedicine/plantMedicineApi.ts src/lib/oregonPlantMedicine/siteSearch.ts src/lib/oregonPlantMedicine/topicLibraryTypes.ts src/pages/plants/IridologyPage.tsx src/components/hive-apps/oregon-plant-medicine/OregonPlantMedicineHome.tsx 2>nul

git status -sb

git commit -m "Add AI Iridology: camera, analysis, history, follow-up chat (local)" 2>nul
if errorlevel 1 (
  echo.
  echo Nothing new to commit, or commit failed. Run: git status
) else (
  echo.
  echo Done. Iridology section committed locally on branch:
  git branch --show-current
)

echo.
echo Test: Start-AiBhive-Plants.bat then open /plants/iridology
pause
