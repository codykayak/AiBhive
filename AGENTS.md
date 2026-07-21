# AiBhive — Agent Instructions

## Local development first

Before pushing or opening a PR:

1. **Start the dev stack** — `npm run dev:start` (or `npm run dev`)
2. **Smoke test** — `npm run dev:check`
3. **Verify in browser** — forward port **3000** in Cursor and click through the change
4. **Build** — `npm run build` must pass

See [LOCAL_DEV.md](./LOCAL_DEV.md) for env vars, GCP credentials, and troubleshooting.

## Pull requests

**Auto-publish + auto-merge (default):** After local tests pass, commit, push, open the PR as ready for review (`draft: false`) to `main-fixed`, then **always squash-merge immediately** — do not wait for manual approval.

1. **Start a fresh branch** from latest `main-fixed` (see [Branch hygiene](#branch-hygiene) below).
2. **Commit and push** to `cursor/<descriptive-name>-c7f3`.
3. **Open PR** — `.github/workflows/auto-merge-cursor-prs.yml` syncs `main-fixed` into the branch, then squash-merges `cursor/*` PRs automatically.
4. **Merge command** (run right after opening the PR if the workflow has not run yet):

```bash
gh pr merge <number> --squash --delete-branch
```

Merge triggers deploy via `auto-deploy.yml` (Cloud Run) when `src/`, `server/`, `functions/`, etc. change.

## Branch hygiene

**One branch per PR. Never reuse a branch after squash-merge.**

Squash merge rewrites history on `main-fixed`. If you open PR #2 from the same `cursor/*` branch that was already squash-merged in PR #1, Git will almost always report conflicts — even when the code changes are small — because the branch still carries pre-squash commits that no longer exist on `main-fixed`.

Recent example: `cursor/opm-free-tier-posts-7050` was used for PRs #334, #339, #342, and #344, causing repeated conflicts in `OregonPlantMedicineHome.tsx`.

### Do this

```bash
git fetch origin main-fixed
./scripts/cursor-fresh-branch.sh my-feature-name
# … edit, test, commit …
git push -u origin HEAD
```

Or manually:

```bash
git fetch origin main-fixed
git checkout -b cursor/my-feature-c7f3 origin/main-fixed
```

### Never do this

- Reopen or push more work to a `cursor/*` branch whose PR was already squash-merged.
- Keep a long-lived feature branch across multiple PRs touching the same files (e.g. Living Knowledge / OPM home).

### If you already have conflicts

```bash
git fetch origin main-fixed
git checkout your-branch
git reset --hard origin/main-fixed
# re-apply your changes (cherry-pick or redo edits)
git push --force-with-lease
```

The auto-merge workflow also tries to merge `main-fixed` into open PR branches before merging. That fixes “branch is behind” cases but **cannot** fix branch-reuse conflicts — only a reset or fresh branch can.

## Branch naming

All agent branches: `cursor/<descriptive-name>-c7f3` (lowercase). **New branch for every PR** — see [Branch hygiene](./AGENTS.md#branch-hygiene).

**Live Research Lab:** https://aibhive.com/research-lab (legacy `/old-world-research` redirects).

## Cursor Cloud specific instructions

Dependencies are installed automatically by the Cloud Agent update script (`npm install` at the repo root plus `--prefix cody` and `--prefix autoposter/admin`). Standard commands live in `LOCAL_DEV.md` / `package.json` — this section only captures non-obvious caveats.

- **Services:** two dev processes — Vite frontend on `:3000` and Express backend on `:3001` (`/api/*` is proxied by Vite). Start both with `npm run dev:start`, which runs them in a **tmux** session named `aibhive-dev` (attach: `npm run dev:attach`, stop: `npm run dev:stop`, smoke test: `npm run dev:check`).
- **Lint is not clean:** `npm run lint` (`tsc --noEmit`) currently reports a large number of pre-existing TypeScript errors (~263) and exits non-zero on a fresh checkout. This is the repo's baseline — do not assume you broke it. Only worry about *new* errors that reference files you changed (compare the count/paths before and after).
- **Build:** `npm run build` builds three separate Vite apps (root, `cody`, `autoposter/admin`); the latter two require their own `node_modules` (installed by the update script). Build uses esbuild and does **not** typecheck, so it passes despite the lint errors.
- **No secrets = degraded but runnable:** without `GEMINI_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `XAI_API_KEY`, etc., the frontend and `/api/health` still work, but AI features and Firestore are disabled and the Firestore probe in `dev:check` times out — this warning is expected, not a failure. Add keys to a gitignored `.env.local` (see `LOCAL_DEV.md`) to exercise those features.
