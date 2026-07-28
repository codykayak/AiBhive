# GitLab setup for AiBhive + Cursor Cloud Agents

Use this when the repo lives on **GitLab** instead of GitHub. It covers CI secrets, MR auto-merge for `cursor/*` branches, and how to point Cursor Cloud at GitLab.

## 1. Mirror / move the repo

If you cloned from GitHub:

```bash
# Add GitLab as a remote (replace with your project URL)
git remote add gitlab https://gitlab.com/YOUR_GROUP/AiBhive.git

# Push all branches
git fetch origin
git push gitlab --all
git push gitlab --tags
```

**Cursor Cloud environment** (dashboard → your environment → Repositories):

- Add the **GitLab** repo URL (`https://gitlab.com/YOUR_GROUP/AiBhive`).
- Set **default branch** to `main-fixed`.
- If GitHub is broken, remove or disable the GitHub repo entry so agents push to GitLab only.

**Local / agent git remote** (optional — make GitLab `origin`):

```bash
git remote set-url origin https://gitlab.com/YOUR_GROUP/AiBhive.git
# or: git remote rename origin github && git remote add origin <gitlab-url>
```

## 2. CI/CD variables (GitLab secrets)

GitLab: **Settings → CI/CD → Variables** (expand **Variables**).

Add each variable below. For secrets: **Mask variable** + **Protect variable** (recommended if `main-fixed` is protected).

| Variable | Required for | Notes |
|----------|--------------|--------|
| `GITLAB_TOKEN` | MR auto-merge from local scripts | Project access token: `api`, `write_repository`, Maintainer. **Not needed in CI** if `CI_JOB_TOKEN` has enough rights. |
| `GCP_SA_KEY` | Cloud Run deploy | GCP service account JSON **or** base64-encoded JSON. Mask + protect. |
| `CLOUD_RUN_SERVICE` | Cloud Run deploy | e.g. `aibhive` |
| `CLOUD_RUN_REGION` | Cloud Run deploy | e.g. `us-central1` |
| `GCP_PROJECT_ID` | DMT decoder / GCR | Optional unless you run decoder deploy on GitLab |
| `EXPO_TOKEN` | EAS OTA | Expo access token; optional |
| `HIVE_DEPLOY_TOKEN` | APK commit-back jobs | Project token with `write_repository` if you port APK workflows |

### Create `GITLAB_TOKEN` (project access token)

1. **Settings → Access tokens** (Project access tokens).
2. Name: `cursor-ci-merge`.
3. Role: **Maintainer**.
4. Scopes: `api`, `read_repository`, `write_repository`.
5. Copy token → paste into **CI/CD variable** `GITLAB_TOKEN` (masked).

Agents running **outside** GitLab CI can use the same token:

```bash
export GITLAB_TOKEN='glpat-...'
export GITLAB_PROJECT_ID='12345678'   # Project ID from GitLab project overview
```

### Create `GCP_SA_KEY`

1. GCP → IAM → Service account with **Cloud Run Admin** + **Service Account User** + **Storage** (if needed).
2. Create JSON key.
3. Either paste JSON into variable, or `base64 -w0 key.json` and store as base64 (pipeline supports both).

**GitHub equivalent mapping**

| GitHub secret | GitLab variable |
|---------------|-----------------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` + `GCP_SERVICE_ACCOUNT` | `GCP_SA_KEY` (simpler on GitLab) |
| `CLOUD_RUN_SERVICE` | `CLOUD_RUN_SERVICE` |
| `CLOUD_RUN_REGION` | `CLOUD_RUN_REGION` |
| `EXPO_TOKEN` | `EXPO_TOKEN` |
| `HIVE_DEPLOY_TOKEN` | `HIVE_DEPLOY_TOKEN` |
| `GITHUB_TOKEN` (auto) | `CI_JOB_TOKEN` (auto in pipelines) |

## 3. Protected branch + approvals

**Settings → Repository → Protected branches**

For `main-fixed`:

| Setting | Recommendation |
|---------|----------------|
| Allowed to merge | Maintainers + **Project access token** bot |
| Allowed to push | Maintainers only |
| Require approval | 0 for full auto-merge, or 1 if you want human gate |

**If you require approvals** but still want agent auto-merge:

- **Settings → Merge requests → Approval rules** → add rule for `main-fixed`.
- Under **Users who can approve**, include your own account.
- For the bot: either set **Approvals required: 0** for Maintainers, or add a rule **“Allowed to merge”** that includes the token owner / bot user.

**Enable pipeline merge** (optional):

- **Settings → Merge requests** → enable **Pipelines must succeed**.
- Cursor MRs run `cursor_auto_merge` after sync — merge happens when that pipeline passes.

## 4. Enable runners

**Settings → CI/CD → Runners**

- GitLab.com: enable **shared runners** (or register your own).
- Without a runner, MR pipelines never run → auto-merge never fires.

## 5. Cursor agent MR workflow (GitLab)

Branch naming (same hygiene as GitHub):

```bash
git fetch origin main-fixed
./scripts/cursor-fresh-branch.sh my-feature-name
# edits, test, commit
git push -u origin HEAD
```

Open merge request:

### Option A — `glab` CLI (best for agents)

```bash
# One-time: glab auth login --hostname gitlab.com
glab mr create --target-branch main-fixed --fill --yes
glab mr merge --squash --yes --remove-source-branch
```

### Option B — GitLab API

```bash
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --data "source_branch=$(git branch --show-current)" \
  --data "target_branch=main-fixed" \
  --data "title=Your MR title" \
  "https://gitlab.com/api/v4/projects/$GITLAB_PROJECT_ID/merge_requests"
```

### Option C — GitLab CI auto-merge

Push branch → open MR in UI (or via API) → pipeline runs:

1. `cursor_branch_hygiene` — blocks reused `cursor/*` names  
2. `cursor_sync_main_fixed` — merges `main-fixed` into your branch  
3. `cursor_auto_merge` — squash-merges MR  

Manual merge from agent (after pipeline sync):

```bash
./scripts/gitlab-merge-mr.sh <mr-iid>
```

## 6. Cursor Cloud + GitLab (agent secrets)

In your **Cursor Cloud environment** (not just GitLab CI):

| Secret / env | Purpose |
|--------------|---------|
| `GITLAB_TOKEN` | `glab`, API MR create/merge |
| `GITLAB_HOST` | `gitlab.com` or your self-managed URL |
| `GITLAB_PROJECT_ID` | Numeric project ID |

If Cursor only exposes **GitHub** PR tools today, agents should use **git push + glab** or the API scripts above on GitLab. The repo’s `ManagePullRequest` integration is GitHub-oriented; GitLab MRs use `glab` / `scripts/gitlab-*.sh`.

**Smoke test after setup:**

```bash
export GITLAB_TOKEN='...'
export GITLAB_PROJECT_ID='...'
glab auth status
git fetch origin main-fixed
./scripts/cursor-fresh-branch.sh gitlab-smoke-test
echo "# smoke" >> GITLAB.md && git add GITLAB.md && git commit -m "chore: gitlab smoke test"
git push -u origin HEAD
glab mr create --target-branch main-fixed --title "chore: gitlab smoke test" --yes
# Watch pipeline on GitLab → MR should auto-merge if rules allow
```

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| Pipeline stuck / no jobs | Enable shared runners |
| `403` on merge | Token needs Maintainer + `api` + `write_repository` |
| Approval required | Lower approval count or approve MR / allow bot to merge |
| Sync conflict | `git fetch origin main-fixed && git reset --hard origin/main-fixed` → new branch (`cursor-fresh-branch.sh`) |
| Deploy skipped | Set `GCP_SA_KEY`, `CLOUD_RUN_SERVICE`, `CLOUD_RUN_REGION` |
| Agent still pushes to GitHub | Change environment repo URL to GitLab; update `origin` remote |

## 8. Related files

- `.gitlab-ci.yml` — pipelines (hygiene, sync, merge, deploy)
- `scripts/gitlab-auto-merge-mr.sh` — local all-in-one merge helper
- `scripts/gitlab-sync-mr.sh` — sync `main-fixed` into MR branch
- `scripts/gitlab-merge-mr.sh` — squash merge via API
- `AGENTS.md` — branch hygiene (applies to GitLab too)
