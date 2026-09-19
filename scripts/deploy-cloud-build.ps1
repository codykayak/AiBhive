# EMERGENCY ONLY — local gcloud tarball upload (slow on Windows, easy to hang).
# Routine deploy: npm run ship  →  GitHub Actions  →  Cloud Run (us-west1, service aibhive)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$Project = 'project-c223f844-6371-4c3f-a0c'

if (-not $env:ALLOW_LOCAL_GCP_DEPLOY) {
  Write-Host ""
  Write-Host "BLOCKED: Local gcloud builds submit uploads a huge tarball from your PC."
  Write-Host "It often stalls for hours on Windows and bypasses main-fixed."
  Write-Host ""
  Write-Host "  Routine:  npm run ship     (git push only — GitHub deploys in ~10 min)"
  Write-Host "  Check:    npm run gcp:upload-check"
  Write-Host ""
  Write-Host "  Emergency only (GitHub down):"
  Write-Host '    $env:ALLOW_LOCAL_GCP_DEPLOY="1"; .\scripts\deploy-cloud-build.ps1'
  Write-Host ""
  exit 1
}

Write-Host "Emergency local Cloud Build → $Project (us-west1 via cloudbuild.yaml) ..."
node scripts/gcp-upload-guard.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Sync submit (no --async): wait until Cloud Build is queued or fails — avoids agent retry loops.
gcloud builds submit --config=cloudbuild.yaml --project=$Project .
