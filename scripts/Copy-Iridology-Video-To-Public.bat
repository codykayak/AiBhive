@echo off
setlocal EnableExtensions
REM One-click: copy your iridology video into the web folder so git can deploy it to aibhive.com

set "SRC=C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed\aibhive-plants\ai-iridology-aibhive.mp4"
set "DEST=C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed\public\oregon-plant-medicine\ai-iridology-aibhive.mp4"

if not exist "%SRC%" (
  echo.
  echo NOT FOUND:
  echo   %SRC%
  echo.
  echo Put ai-iridology-aibhive.mp4 in your aibhive-plants folder, then run this again.
  pause
  exit /b 1
)

if not exist "%~dp0..\public\oregon-plant-medicine" mkdir "%~dp0..\public\oregon-plant-medicine"
copy /Y "%SRC%" "%DEST%"
if errorlevel 1 (
  echo Copy failed.
  pause
  exit /b 1
)

echo.
echo SUCCESS — copied to:
echo   public\oregon-plant-medicine\ai-iridology-aibhive.mp4
echo.
echo NEXT in Cursor ^(no CMD needed^):
echo   Tell the agent: "commit and push ai-iridology-aibhive.mp4"
echo.
echo That deploys the video to https://aibhive.com/plants/iridology
pause
