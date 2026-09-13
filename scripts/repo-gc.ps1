# PowerShell — remove stuck git pack garbage and repack (run when pushes hang)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

Write-Host "Removing tmp_pack_* garbage..."
Get-ChildItem .git\objects\pack\tmp_pack_* -ErrorAction SilentlyContinue | Remove-Item -Force

Write-Host "Running git gc --prune=now..."
git gc --prune=now

Write-Host ""
git count-objects -vH
