# Local development (Cursor sandbox / laptop)

Run and test AiBhive locally before opening a GitHub PR.

## Quick start

```bash
npm install
cp .env.example .env.local   # then edit with your keys
npm run dev:start            # starts frontend :3000 + backend :3001
npm run dev:check            # smoke test both servers
```

Open the app in your browser using Cursor’s **Ports** panel — forward port **3000** and open the URL.

| Service  | Port | URL |
|----------|------|-----|
| Frontend (Vite) | 3000 | http://127.0.0.1:3000 |
| Backend (Express) | 3001 | http://127.0.0.1:3001 |
| API from browser | — | `/api/*` proxied to :3001 by Vite |

## Environment variables

Create **`.env.local`** in the repo root (gitignored). The backend loads `.env.local` then `.env`.

| `FIRECRAWL_API_KEY` | Research Discovery — Deep web search | Must be on **Cloud Run** for production; also in `.env.local` for local dev |
| `SERPAPI_KEY` | Research Discovery — Quick factual search | Same as Firecrawl — company list queries need at least one of these |

### Cloud Run (production)

Discovery mode cannot return company names unless the **server** has search API keys. GitHub deploy does **not** copy keys from your laptop — set them on the Cloud Run service:

1. [Google Cloud Console](https://console.cloud.google.com/) → **Cloud Run** → your AiBhive service → **Edit & deploy new revision**
2. **Variables & secrets** → add:
   - `FIRECRAWL_API_KEY` = your Firecrawl key (exact name)
   - `SERPAPI_KEY` = your SerpAPI key (recommended for Discovery)
3. **Deploy** the new revision (saving alone without a new revision may not pick up env changes on some setups)

Verify after deploy:

```bash
curl -s https://aibhive.com/api/intel-gathering/cloud-status
# expect: "firecrawl": true, "serpapi": true, "discoveryReady": true
```

Or `GET /api/health` — `env.firecrawl` and `env.serpapi` should be `true`.

| Variable | Required for | Notes |
|----------|--------------|-------|
| `GEMINI_API_KEY` | OCR, PDF text, most AI features | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firestore, GCS, admin APIs | Path to a GCP service-account JSON with Firestore + Storage access |
| `XAI_API_KEY` or `GROK_API_KEY` | Homework, Intel chat (Grok) | From [x.ai](https://console.x.ai/) |
| `CARTESIA_API_KEY` | Pros Diagnose high-quality narration (with Grok AI) | From [Cartesia](https://cartesia.ai/) — **server only**, never commit |
| `CARTESIA_USD_PER_CHAR` | Cartesia TTS cost estimate (default `0.00005` ≈ $50/1M chars) | Used in Pros analytics + operation estimates |
| `ADMIN_EMAILS` | `/admin`, `/homework` login | Comma-separated Google emails |
| `STRIPE_SECRET_KEY` | Checkout / billing | Optional for most UI testing |

### GCP credentials (one-time)

1. In [Google Cloud Console](https://console.cloud.google.com/) → IAM → Service Accounts, create or use an account for project `gen-lang-client-0787280773`.
2. Grant **Cloud Datastore User** and **Storage Object Admin** (or narrower roles if you prefer).
3. Create a JSON key and save it outside the repo, e.g. `~/secrets/aibhive-gcp.json`.
4. In `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/aibhive-gcp.json
   ADMIN_EMAILS=you@gmail.com
   GEMINI_API_KEY=...
   XAI_API_KEY=...
   CARTESIA_API_KEY=...
   ```

Without GCP credentials the **frontend still loads**, but admin/homework APIs and Firestore-backed features will fail.

## npm scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Run frontend + backend (foreground, both logs in one terminal) |
| `npm run dev:start` | Start both in a **tmux** session (`aibhive-dev`) — keeps running in background |
| `npm run dev:attach` | Attach to tmux session to see logs |
| `npm run dev:stop` | Stop the tmux dev session |
| `npm run dev:check` | Hit `/api/health` and frontend; report missing env vars |
| `npm run build` | Production build (same check CI uses) |
| `npm run lint` | TypeScript check |

## What to test before a PR

1. **`npm run dev:check`** — both servers up, Firestore connected if you need backend features.
2. **Click through your change** in the browser on port 3000.
3. **`npm run build`** — must pass before merge.
4. For `/homework` or `/admin`: sign in with an email in `ADMIN_EMAILS`.

## Workflow with GitHub

**Test locally first, then PR.**

1. Work on a branch: `cursor/<name>-ee8d`
2. Run `npm run dev:start` and verify in the browser
3. Run `npm run build`
4. Commit and push when you’re happy
5. Open a PR to `main-fixed` — **do not auto-merge** until you’ve reviewed it in the sandbox or on the deployed preview

Cloud agents follow the same rule: local smoke test → build → PR → you merge when ready.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Backend not reachable` | Run `npm run dev:start` or `npm run dev` |
| `Could not load the default credentials` | Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` |
| Discovery returns only dork links, Firecrawl errors | Check `curl https://aibhive.com/api/intel-gathering/cloud-status` — if `firecrawl`/`serpapi` are false, add `FIRECRAWL_API_KEY` and `SERPAPI_KEY` on Cloud Run and deploy a new revision |
| `Firestore probe FAILED` | Check service account IAM on the named DB in `firebase-applet-config.json` |
| Google sign-in popup blocked | Allow popups for `localhost` / forwarded Cursor URL |
| Port 3000 in use | `npm run dev:stop` or kill the old process |

## Health endpoint

`GET http://127.0.0.1:3001/api/health` returns uptime, which API keys are set, and whether Firestore is reachable.
