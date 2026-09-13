# Git & deploy — keep uploads tiny

## The rule (routine work)

| Action | Command | Size / time |
|--------|---------|-------------|
| **Ship aibhive.com** | `npm run ship` | Git push **KB–MB** → auto PR → auto merge → deploy **~10 min** |
| **Emergency deploy** | `.\scripts\deploy-cloud-build.ps1` | ~350 MB upload + build (avoid) |
| **APKs / videos / ebooks** | **Firebase / GCS** | Never git |

**Do not** use `gcloud builds submit` for routine changes. Agents were doing that because an old Cursor rule said “don’t git push” — that bypassed `main-fixed` and broke production.

## Routine ship (every feature)

```powershell
cd C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed
./scripts/cursor-fresh-branch.sh my-feature   # once per PR
# edit, npm run build
git add <only your files>
git commit -m "…"
npm run ship
```

GitHub Actions (automatic):

1. `open-cursor-pr.yml` — opens PR to `main-fixed`
2. `auto-merge-cursor-prs.yml` — squash-merges `cursor/*` PRs
3. `auto-deploy.yml` — builds + deploys Cloud Run **`aibhive`** in **`us-west1`**

Watch: https://github.com/codykayak/AiBhive/actions

## Before ship

```powershell
npm run repo:upload-report   # optional sanity check
npm run repo:install-hooks   # block commits > 8 MB
```

## What must never be committed

- `greenteam/`, `.worktrees/`, nested `aibhive-main-fixed/`
- `public/*.apk` (Firebase URLs in `public/diagnose-mobile-releases.json`)
- `src/**/*.mp4` (use `public/` URLs)
- Files **> 8 MB**

## Emergency local Cloud Build

Project: **`project-c223f844-6371-4c3f-a0c`** · Service: **`aibhive`** · Region: **`us-west1`**

```powershell
.\scripts\deploy-cloud-build.ps1
```

`.gcloudignore` excludes lab trees, APKs, and heavy mobile paths. **`aibhive-diagnose/lib`** is included (required by Vite `@diagnose`).

## If git push still takes hours

Old history may contain large blobs (~2 GB pack). New `.gitignore` stops **new** bloat only.

```powershell
npm run repo:gc
```

See `AGENTS.md` for branch hygiene (never reuse `cursor/*` after merge).
