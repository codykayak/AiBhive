# Git & deploy — keep uploads tiny

## The rule

| Action | Tool | Typical size |
|--------|------|----------------|
| **Ship aibhive.com** | Cloud Build → Cloud Run | See `npm run repo:upload-report` (target **< 200 MB**) |
| **Save code on GitHub** | `git push` on a **small branch** | Usually **KB–few MB** per commit |
| **Videos, APKs, ebooks** | **Google Cloud Storage** | Not git |

Do **not** use `git push` as the production deploy path.

## Before every deploy or push

```powershell
cd C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed
npm run repo:upload-report
```

This prints Git pack size and estimated Cloud Build tarball size.

## Deploy to production

Project: **`project-c223f844-6371-4c3f-a0c`** · Service: **`aibhive`**

```powershell
gcloud builds submit --config=cloudbuild.yaml `
  --project=project-c223f844-6371-4c3f-a0c `
  --substitutions=_PROJECT=project-c223f844-6371-4c3f-a0c,_SERVICE=aibhive,_REGION=us-central1 `
  --async .
```

`.gcloudignore` excludes `greenteam/`, `.worktrees/`, nested `aibhive-main-fixed/`, lab trees, and duplicate `src/**/*.mp4`.

## One-time setup on each machine

```powershell
npm run repo:install-hooks   # block commits > 8 MB
npm run repo:gc              # remove stuck tmp_pack_* garbage
```

## If git push still takes hours

Your **history** may contain old large blobs (~2 GB pack). New `.gitignore` stops **new** bloat; it does not shrink history.

One-time history shrink (destructive — coordinate before force-push):

1. Install [git-filter-repo](https://github.com/newren/git-filter-repo)
2. Backup the repo
3. Remove paths: `greenteam/`, `**/*.epub`, `steward/desktop/release*`
4. `git push --force-with-lease origin main-fixed`

## What must never be committed again

- `greenteam/` (ebooks, pentest lab, crapi, pentagi)
- `.worktrees/`
- Nested `aibhive-main-fixed/` duplicate tree
- `src/**/*.mp4` (use `public/` only)
- Desktop release binaries under `steward/desktop/release*`
- Files **> 8 MB** (pre-commit hook blocks these)
