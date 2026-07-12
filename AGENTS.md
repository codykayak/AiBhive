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

## Cursor Cloud specific instructions

Dependencies are installed automatically by the Cloud Agent update script (`npm install` at the repo root plus `--prefix cody` and `--prefix autoposter/admin`). Standard commands live in `LOCAL_DEV.md` / `package.json` — this section only captures non-obvious caveats.

- **Services:** two dev processes — Vite frontend on `:3000` and Express backend on `:3001` (`/api/*` is proxied by Vite). Start both with `npm run dev:start`, which runs them in a **tmux** session named `aibhive-dev` (attach: `npm run dev:attach`, stop: `npm run dev:stop`, smoke test: `npm run dev:check`).
- **Lint is not clean:** `npm run lint` (`tsc --noEmit`) currently reports a large number of pre-existing TypeScript errors (~263) and exits non-zero on a fresh checkout. This is the repo's baseline — do not assume you broke it. Only worry about *new* errors that reference files you changed (compare the count/paths before and after).
- **Build:** `npm run build` builds three separate Vite apps (root, `cody`, `autoposter/admin`); the latter two require their own `node_modules` (installed by the update script). Build uses esbuild and does **not** typecheck, so it passes despite the lint errors.
- **No secrets = degraded but runnable:** without `GEMINI_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `XAI_API_KEY`, etc., the frontend and `/api/health` still work, but AI features and Firestore are disabled and the Firestore probe in `dev:check` times out — this warning is expected, not a failure. Add keys to a gitignored `.env.local` (see `LOCAL_DEV.md`) to exercise those features.
