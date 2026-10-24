# Build Lead Agent APK locally, publish to Firebase, verify download — do NOT use GitHub Actions for APK.
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host ''
Write-Host '=== Lead Agent: LOCAL build + Firebase publish + verify ===' -ForegroundColor Cyan
Write-Host ''

& (Join-Path $Root 'scripts\install-lead-agent-phone.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apkSrc = Join-Path $Root 'mobile\lead-agent\android\app\build\outputs\apk\debug\app-debug.apk'
$apkPub = Join-Path $Root 'public\lead-agent.apk'
if (-not (Test-Path $apkSrc)) { throw "APK missing after build: $apkSrc" }
Copy-Item $apkSrc $apkPub -Force
Write-Host "Staged $apkPub" -ForegroundColor Green

Write-Host ''
Write-Host 'Publishing to Firebase...' -ForegroundColor Cyan
node (Join-Path $Root 'scripts\publish-lead-agent-apk-firebase.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Verifying local APK file...' -ForegroundColor Cyan
$env:LEAD_AGENT_VERIFY_LOCAL = '1'
node (Join-Path $Root 'scripts\verify-lead-agent-apk.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Verifying live download (after manifest on Firebase)...' -ForegroundColor Cyan
Start-Sleep -Seconds 3
$env:LEAD_AGENT_VERIFY_LOCAL = '0'
node (Join-Path $Root 'scripts\verify-lead-agent-apk.mjs')
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Live verify failed — manifest may need a minute. Retry: npm run lead-agent:verify-apk' -ForegroundColor Yellow
  exit 1
}

Write-Host ''
Write-Host 'SUCCESS. Install on phone: https://aibhive.com/api/download/lead-agent' -ForegroundColor Green
Write-Host 'Commit public/lead-agent-releases.json (and app version files) then push main-fixed for web deploy only.' -ForegroundColor Green
Write-Host ''
