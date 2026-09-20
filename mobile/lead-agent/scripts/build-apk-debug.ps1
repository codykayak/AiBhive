# Windows APK build — use project-local temp (avoids Metro EPERM on AppData\Local\Temp).
$ErrorActionPreference = 'Stop'
$AppDir = Split-Path $PSScriptRoot -Parent
$Tmp = Join-Path $AppDir '.build-tmp'
$Metro = Join-Path $AppDir '.metro-cache'
New-Item -ItemType Directory -Force -Path $Tmp, $Metro | Out-Null
$env:TMP = $Tmp
$env:TEMP = $Tmp
$env:METRO_CACHE_DIR = $Metro

$PortableJdk = Join-Path (Resolve-Path (Join-Path $AppDir '..\..')).Path 'scripts\.jdk17-portable'
if (Test-Path (Join-Path $PortableJdk 'bin\java.exe')) {
  $env:JAVA_HOME = (Resolve-Path $PortableJdk).Path
} elseif (-not $env:JAVA_HOME) {
  $found = Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-17*-hotspot' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $env:JAVA_HOME = $found.FullName }
}

Push-Location $AppDir
try {
  node scripts/post-prebuild-android.mjs
  Push-Location android
  .\gradlew.bat assembleDebug --no-daemon
} finally {
  Pop-Location
  Pop-Location
}

Write-Host "APK: $AppDir\android\app\build\outputs\apk\debug\app-debug.apk"
