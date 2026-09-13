# PowerShell-safe Cloud Build deploy (no comma-split --substitutions bug)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$Project = 'project-c223f844-6371-4c3f-a0c'

Write-Host "Upload report (optional): npm run repo:upload-report"
Write-Host "Submitting Cloud Build to $Project ..."

gcloud builds submit --config=cloudbuild.yaml --project=$Project --async .
