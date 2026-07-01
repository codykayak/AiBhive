# AiBhive — Agent Instructions

## Local development first

Before pushing or opening a PR:

1. **Start the dev stack** — `npm run dev:start` (or `npm run dev`)
2. **Smoke test** — `npm run dev:check`
3. **Verify in browser** — forward port **3000** in Cursor and click through the change
4. **Build** — `npm run build` must pass

See [LOCAL_DEV.md](./LOCAL_DEV.md) for env vars, GCP credentials, and troubleshooting.

## Pull requests

**Default: test locally, then open a PR — do not auto-merge.**

1. **Commit and push** completed work to `cursor/<descriptive-name>-ee8d`.
2. **Open PRs as ready for review** (`draft: false`), base branch `main-fixed`.
3. **Do not merge** unless the user explicitly asks. Leave the PR open for human review in the sandbox or on GitHub.
4. **Update the user** with what changed, how to test locally (`npm run dev:start`), and the PR link.

Only auto-merge when the user explicitly requests it:

```bash
gh pr merge <number> --squash --delete-branch
```

## Branch naming

All agent branches: `cursor/<descriptive-name>-ee8d` (lowercase).
