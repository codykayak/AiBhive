# Git & deploy — keep uploads tiny

## The rule (routine work)

| Action | Command | What actually uploads |
|--------|---------|------------------------|
| **Ship aibhive.com** | `npm run ship` | **Git only (KB–MB)** → PR → merge → GitHub Actions deploy **~10 min** |
| **Check upload size** | `npm run gcp:upload-check` | Local estimate using `.gcloudignore` |
| **Emergency deploy** | `ALLOW_LOCAL_GCP_DEPLOY=1` + `.\scripts\deploy-cloud-build.ps1` | **PC tarball → GCS** (avoid; stalls on Windows) |
| **APKs / videos / ebooks** | **Firebase / GCS** | Never git |

**Do not** use `gcloud builds submit`, `npm run deploy:gcp`, or `npm run deploy:cloud-run` for routine changes. Agents were misled by an old line in `repo-upload-report.mjs` that said the opposite — that caused **hour-long tarball uploads** and retry loops.

### Why the “tarball hell” happens

1. **`gcloud builds submit .`** zips your **entire working tree** (minus `.gcloudignore`) and uploads it to `gs://…_cloudbuild/source/…tgz` from your PC.
2. **`--async`** returns before upload finishes → agents think deploy started and **retry**, making it worse.
3. **Android Gradle / `node_modules` / mobile trees** in the zip break or balloon size (Windows path errors, 180MB+ uploads).
4. **Routine path never uses that tarball**: GitHub Actions checks out the repo on Linux, builds, and `deploy-cloudrun` pushes from the runner — source shows as `github.com/…@commit`, not a stuck local `.tgz`.

**Fix:** `npm run ship` only. Emergency scripts now **refuse** unless `ALLOW_LOCAL_GCP_DEPLOY=1` and run `gcp-upload-guard.mjs` first.

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
