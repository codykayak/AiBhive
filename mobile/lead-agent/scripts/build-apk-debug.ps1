# Windows APK build — local only. Bundles latest JS into a phone-installable debug APK.
$ErrorActionPreference = 'Stop'
$AppDir = Split-Path $PSScriptRoot -Parent
$RepoRoot = (Resolve-Path (Join-Path $AppDir '..\..')).Path
$ApkOut = Join-Path $AppDir 'android\app\build\outputs\apk\debug\app-debug.apk'
$DesktopApk = Join-Path $env:USERPROFILE 'OneDrive\Desktop\AiBhive-Lead-Agent-NEW.apk'
if (-not (Test-Path (Split-Path $DesktopApk))) {
  $DesktopApk = Join-Path $env:USERPROFILE 'Desktop\AiBhive-Lead-Agent-NEW.apk'
}
if (-not (Test-Path (Split-Path $DesktopApk))) {
  $DesktopApk = Join-Path $AppDir 'AiBhive-Lead-Agent-NEW.apk'
}

$Tmp = Join-Path $AppDir '.build-tmp'
$Metro = Join-Path $AppDir '.metro-cache'
New-Item -ItemType Directory -Force -Path $Tmp, $Metro | Out-Null
$env:TMP = $Tmp
$env:TEMP = $Tmp
$env:METRO_CACHE_DIR = $Metro
$env:NODE_ENV = 'production'

$PortableJdk = Join-Path $RepoRoot 'scripts\.jdk17-portable'
if (Test-Path (Join-Path $PortableJdk 'bin\java.exe')) {
  $env:JAVA_HOME = (Resolve-Path $PortableJdk).Path
} else {
  $found = Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-17*-hotspot' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $env:JAVA_HOME = $found.FullName }
}
if (-not $env:JAVA_HOME) { throw 'JDK 17 required. Run once: winget install EclipseAdoptium.Temurin.17.JDK' }

Write-Host "JAVA_HOME=$($env:JAVA_HOME)"

# Phone-only ABI — faster build, smaller APK
$GradleProps = Join-Path $AppDir 'android\gradle.properties'
$props = Get-Content $GradleProps -Raw
if ($props -notmatch 'reactNativeArchitectures=arm64-v8a') {
  $props = $props -replace 'reactNativeArchitectures=.*', 'reactNativeArchitectures=arm64-v8a'
  Set-Content -Path $GradleProps -Value $props -NoNewline
}

Push-Location $AppDir
try {
  if (-not (Test-Path 'node_modules\xlsx')) { npm install }

  Write-Host 'Stopping old Gradle daemons…'
  Push-Location android
  .\gradlew.bat --stop 2>$null
  Pop-Location

  Write-Host 'Clearing locked native build caches…'
  Get-ChildItem -Path 'node_modules' -Recurse -Directory -Filter '.cxx' -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }

  node scripts/post-prebuild-android.mjs

  Push-Location android
  .\gradlew.bat clean assembleDebug --no-daemon --max-workers=2
  if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit $LASTEXITCODE" }
} finally {
  Pop-Location
}

if (-not (Test-Path $ApkOut)) { throw "APK missing: $ApkOut" }

Copy-Item $ApkOut $DesktopApk -Force
Write-Host ''
Write-Host '============================================================'
Write-Host "  NEW APK on Desktop: $DesktopApk"
Write-Host "  Size: $((Get-Item $DesktopApk).Length / 1MB) MB"
Write-Host '  Copy to phone and tap Install (allow unknown apps).'
Write-Host '  Leads tab must show: Choose CSV or Excel file'
Write-Host '============================================================'
