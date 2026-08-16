@echo off
setlocal EnableExtensions
REM Copy ai-iridology-aibhive video from aibhive-plants into public for web deploy.
set "SRC=%~dp0..\aibhive-plants"
set "DEST=%~dp0..\public\oregon-plant-medicine"

if not exist "%DEST%" mkdir "%DEST%"

for %%E in (webm mp4) do (
  if exist "%SRC%\ai-iridology-aibhive.%%E" (
    copy /Y "%SRC%\ai-iridology-aibhive.%%E" "%DEST%\" >nul
    echo Copied ai-iridology-aibhive.%%E
  ) else (
    echo Missing: %SRC%\ai-iridology-aibhive.%%E
  )
)

echo Done. Video URLs: /oregon-plant-medicine/ai-iridology-aibhive.webm and .mp4
pause
