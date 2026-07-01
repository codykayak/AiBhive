# AiBhive — Cloud Agent Instructions

## Pull requests (default workflow)

When the user has not asked for a draft or manual review:

1. **Commit and push** every completed change to `cursor/<descriptive-name>-c577`.
2. **Open PRs as ready for review** (`draft: false`), base branch `main-fixed`.
3. **Auto-merge** after `npm run build` passes:
   ```bash
   gh pr merge <number> --squash --delete-branch
   ```
4. **Update the user** with what shipped and the PR link (merged or open if merge blocked).

Do not wait for the user to ask to push or merge unless they explicitly request a draft or review-only PR.

## Branch naming

All agent branches: `cursor/<descriptive-name>-c577` (lowercase).

## Cursor Cloud specific instructions

Dependencies for the root app, `cody`, and `autoposter/admin` are installed by the startup update script; you should not need to reinstall them.

### Services & how to run (core web product)
- `npm run dev` starts BOTH services in parallel: the Vite frontend on `:3000` and the Express backend on `:3001`. Always visit the app at **http://localhost:3000** — Vite proxies `/api/*` to the backend on `:3001` (see `vite.config.ts`), so hitting `:3000` exercises the full stack. Hitting `:3001` directly only serves the API.
- Standard commands live in root `package.json`: `npm run lint` (`tsc --noEmit`), `npm run build` (builds main SPA + `cody` + `autoposter/admin` into `dist/`), `npm start` (production: Express serves built `dist/` on `:8080`).

### Non-obvious caveats
- `npm run lint` currently reports **pre-existing** TypeScript errors (e.g. in `src/components/HomeAssistantWeb.tsx`, `src/components/hive-apps/*`, `src/pages/tools/ToolsHubPage.tsx`). These are not caused by environment setup. `npm run build` uses Vite (no type-check) and succeeds regardless.
- No secrets are provisioned by default. Without `GEMINI_API_KEY` (set in `.env.local`) AI features are feature-gated/degrade gracefully, and without Google Application Default Credentials the backend logs `[startup] Firestore probe FAILED` and Firestore-backed persistence (leads, Hive billing/tasks) will not work. Static marketing pages, navigation, and non-AI API endpoints (e.g. `/api/hive/plans`) all work without any secrets.
- Sub-projects (`cody`, `autoposter/admin`, `autoposter/functions`, `taylored-mobile`) each have their OWN `package-lock.json`/`node_modules`; the root `npm run build` builds `cody` and `autoposter/admin` but does not install their deps — install per-project when needed. `taylored-mobile` (Expo) is a separate mobile app, independent of the web dev loop.
