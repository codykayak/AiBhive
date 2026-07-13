# AiBhive — Agent Instructions

## Local development first

Before pushing or opening a PR:

1. **Start the dev stack** — `npm run dev:start` (or `npm run dev`)
2. **Smoke test** — `npm run dev:check`
3. **Verify in browser** — forward port **3000** in Cursor and click through the change
4. **Build** — `npm run build` must pass

See [LOCAL_DEV.md](./LOCAL_DEV.md) for env vars, GCP credentials, and troubleshooting.

## Pull requests

**Auto-publish (default):** After local tests pass, open the PR as ready for review (`draft: false`), base `main-fixed`, then **wait for user approval before squash-merge** — do not merge automatically unless the user explicitly asks.

1. **Commit and push** to `cursor/<descriptive-name>-c7f3`.
2. **Open PR** — triggers run on merge via `auto-deploy.yml` (Cloud Run) when `src/`, `server/`, `functions/`, etc. change.
3. **Merge** with squash + delete branch as soon as CI is green (or immediately if checks are still pending and the change is low-risk workflow/config).

```bash
gh pr merge <number> --squash --delete-branch
```

**Live Research Lab:** https://aibhive.com/research-lab (legacy `/old-world-research` redirects).

## Branch naming

All agent branches: `cursor/<descriptive-name>-c7f3` (lowercase).
