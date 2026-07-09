# AiBhive — Agent Instructions

## Local development first

Before pushing or opening a PR:

1. **Start the dev stack** — `npm run dev:start` (or `npm run dev`)
2. **Smoke test** — `npm run dev:check`
3. **Verify in browser** — forward port **3000** in Cursor and click through the change
4. **Build** — `npm run build` must pass

See [LOCAL_DEV.md](./LOCAL_DEV.md) for env vars, GCP credentials, and troubleshooting.

## Pull requests

**When the user asks to auto-publish:** merge PRs to `main-fixed` after tests pass — Cloud Run auto-deploy runs on merge.

**Default:** test locally, open PR as ready for review (`draft: false`), base `main-fixed`.

1. **Commit and push** to `cursor/<descriptive-name>-c9be`.
2. **Open PR** — triggers will run on merge via `auto-deploy.yml` (Cloud Run) when `src/`, `server/`, `functions/`, etc. change.
3. **Merge** when the user requests auto-publish or explicit merge.

```bash
gh pr merge <number> --squash --delete-branch
```

**Live Research Lab:** https://aibhive.com/research-lab (legacy `/old-world-research` redirects).

## Branch naming

All agent branches: `cursor/<descriptive-name>-ee8d` (lowercase).
