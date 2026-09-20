# Build Lead Agent APK and install on a USB-connected Android phone (or copy to Desktop).
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$AppDir = Join-Path $Root 'mobile\lead-agent'
$ApkRel = 'android\app\build\outputs\apk\debug\app-debug.apk'

function Find-Jdk17 {
  $candidates = @(
    (Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-17*-hotspot' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1),
    (Get-ChildItem 'C:\Program Files\Microsoft\jdk-17*' -ErrorAction SilentlyContinue | Select-Object -First 1),
    (Get-ChildItem 'C:\Program Files\Java\jdk-17*' -ErrorAction SilentlyContinue | Select-Object -First 1)
  ) | Where-Object { $_ }
  if ($candidates) { return $candidates.FullName }
  return $null
}

$jdk = Find-Jdk17
if (-not $jdk) {
  Write-Host ''
  Write-Host 'JDK 17 not found. Install once (Windows x64):'
  Write-Host '  winget install EclipseAdoptium.Temurin.17.JDK'
  Write-Host 'Or: https://adoptium.net/temurin/releases/?version=17'
  Write-Host ''
  Write-Host 'Then run this script again.'
  Write-Host ''
  Write-Host 'Until then, on your PHONE open Chrome and go to:'
  Write-Host '  https://aibhive.com/api/download/lead-agent'
  Write-Host '(after the Lead Agent APK build has run on GitHub)'
  exit 1
}

$env:JAVA_HOME = $jdk
Write-Host "Using JAVA_HOME=$jdk"

Push-Location $AppDir
try {
  if (-not (Test-Path 'node_modules')) { npm install }
  npm run build:apk:debug
} finally {
  Pop-Location
}

$apk = Join-Path $AppDir $ApkRel
if (-not (Test-Path $apk)) { throw "Build finished but APK missing: $apk" }

$desktop = Join-Path $env:USERPROFILE 'Desktop\AiBhive-Lead-Agent.apk'
Copy-Item $apk $desktop -Force
Write-Host ''
Write-Host "APK copied to: $desktop"
Write-Host ''

$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($adb) {
  $devices = & adb devices | Select-String 'device$'
  if ($devices) {
    Write-Host 'Installing on phone (USB debugging on)...'
    & adb install -r $apk
    Write-Host 'Installed. Open "AiBhive Lead Agent" on your phone.'
    exit 0
  }
  Write-Host 'Phone not detected via adb. Enable USB debugging, or copy the Desktop APK to the phone.'
} else {
  Write-Host 'adb not in PATH — copy Desktop APK to phone (USB / Drive / email) and tap to install.'
}

Write-Host ''
Write-Host 'Or on the phone (no PC): Chrome -> https://aibhive.com/api/download/lead-agent'
Write-Host ''
