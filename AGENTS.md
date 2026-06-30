# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
AiBhive monorepo. The core developer-facing product is the **root web app**: a Vite + React 19 frontend with an Express backend (`server/index.js`). Satellite apps live in subfolders: `cody/` (separate Vite app, also the Hive web-build publish target), `autoposter/admin/` (admin Vite UI), `taylored-mobile/` (Expo/React Native), and `intel-gathering/` (standalone Python scraper).

### Running the core app (dev)
- `npm run dev` runs both servers in parallel: frontend on `:3000` (`vite`) and backend on `:3001` (`node server/index.js`). See `package.json` scripts.
- The Vite dev server proxies `/api/*` → `http://localhost:3001` (see `vite.config.ts`), so the frontend and backend are wired together automatically. Open `http://localhost:3000`.

### Non-obvious caveats
- **The app boots and runs with no secrets.** Missing env vars (`GEMINI_API_KEY`, Stripe, Firebase/GCP credentials, etc.) do NOT crash the backend; features degrade gracefully.
- On startup without GCP credentials you will see `[startup] Firestore probe FAILED: Could not load the default credentials` and a `MetadataLookupWarning`. **This is expected, not a failure** — the server keeps running. Features that read/write Firestore (leads, checkout, admin, Hive tasks) return errors/empty until real credentials are provided.
- The only startup-fatal dependency is the committed `firebase-applet-config.json` file (read synchronously at boot).
- The "Cody" assistant chatbot has a keyword fallback when `GEMINI_API_KEY` is absent, so it still replies (`source: "fallback"`). Note keyword matching is substring-based (e.g. "aib**hi**ve" matches the "hi" greeting rule).
- An in-process AutoPoster scheduler auto-starts with the backend; disable with `DISABLE_AUTOPOSTER_SCHEDULER=true`.

### Lint / test / build
- Lint: `npm run lint` (this is just `tsc --noEmit` type-checking; there is no ESLint config).
- Tests: **there is no automated test suite** anywhere in the repo.
- Build: `npm run build` builds the root app, then `cody`, then `autoposter/admin` via `--prefix`. It therefore requires deps installed in `cody/` and `autoposter/admin/` (the startup update script handles this).

### Satellites (optional, out of core scope)
- `cody/`: `npm run dev` (also `:3000` — would collide with root frontend if run together).
- `autoposter/admin/`: `npm run dev` (needs the root backend on `:3001` for its `/api/autoposter` calls).
- `taylored-mobile/`: Expo app (`npm start`); requires Expo tooling/emulator. See its own `AGENTS.md`.
- `intel-gathering/`: Python scraper; `pip install -r requirements.txt` then run the script.
