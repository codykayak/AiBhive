# Apply AiBhive Plants iridology section to your LOCAL repo (no GitHub required).
# Safe for repos with other in-progress Composer edits: new files copy first, wiring merges with 3-way apply.
param(
    [string]$Repo = 'C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed'
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$Bundle = Join-Path $Root 'local-sync\iridology-bundle'
$Patch = Join-Path $Root 'iridology-local.patch'

if (-not (Test-Path (Join-Path $Repo '.git'))) {
    Write-Error "Git repo not found at: $Repo`nPass -Repo 'C:\path\to\your\repo'"
}
if (-not (Test-Path $Bundle)) {
    Write-Error "Bundle missing: $Bundle`nCopy local-sync\iridology-bundle from this repo."
}

Set-Location $Repo
Write-Host "`nApplying iridology to: $Repo`n" -ForegroundColor Cyan

# 1) Copy bundled files (overwrites iridology paths only)
robocopy $Bundle $Repo /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }

# 2) Stage iridology paths
$paths = @(
    'server/iridologyAnalysis.js', 'server/iridologyHistory.js', 'server/iridologyKnowledge.json',
    'server/plantMedicineChat.js', 'server/plantMedicineRoutes.js',
    'scripts/public-routes.mjs',
    'src/App.tsx',
    'src/components/hive-apps/OregonPlantMedicineWebApp.tsx',
    'src/components/hive-apps/oregon-plant-medicine/OregonPlantMedicineHome.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyAnalyzePanel.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyCameraModal.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyDisclaimerModal.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyFollowUpChat.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyHistoryPanel.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyPanel.tsx',
    'src/components/hive-apps/oregon-plant-medicine/IridologyResults.tsx',
    'src/pages/plants/IridologyPage.tsx',
    'src/lib/oregonPlantMedicine/branding.ts',
    'src/lib/oregonPlantMedicine/iridologyDisclaimer.ts',
    'src/lib/oregonPlantMedicine/iridologyHistoryApi.ts',
    'src/lib/oregonPlantMedicine/iridologyHistoryStorage.ts',
    'src/lib/oregonPlantMedicine/iridologyLibrary.ts',
    'src/lib/oregonPlantMedicine/iridologyPhotoGuide.ts',
    'src/lib/oregonPlantMedicine/iridologyTypes.ts',
    'src/lib/oregonPlantMedicine/livingKnowledgeAsk.ts',
    'src/lib/oregonPlantMedicine/livingKnowledgeRag.ts',
    'src/lib/oregonPlantMedicine/plantMedicineApi.ts',
    'src/lib/oregonPlantMedicine/siteSearch.ts',
    'src/lib/oregonPlantMedicine/topicLibraryTypes.ts'
)
foreach ($p in $paths) {
    if (Test-Path $p) { git add -- $p }
}

git status -sb

$msg = 'Add AI Iridology: camera, analysis, history, follow-up chat (local)'
git commit -m $msg 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nCommitted on branch: $(git branch --show-current)" -ForegroundColor Green
} else {
    Write-Host "`nNo new commit (already applied or nothing staged). Check: git status" -ForegroundColor Yellow
}

Write-Host "`nTest: Start-AiBhive-Plants.bat -> http://127.0.0.1:<port>/plants/iridology`n"
