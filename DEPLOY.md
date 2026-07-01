# Deploying AiBhive (aibhive.com)

Production deploys run automatically on every push to **`main-fixed`** via GitHub Actions:

| Workflow | What it deploys |
|----------|-----------------|
| `Auto-deploy (web + server)` | Cloud Run — website + API (`/hive-apps`, server routes) |
| `Build Android APK` | Fresh signed APK → Firebase + `public/taylored-mobile.apk` |
| `EAS Update (JS OTA)` | JS-only mobile changes over the air |

## If deploys are not running

Check **Actions** on GitHub. If jobs fail immediately with:

> *recent account payments have failed or your spending limit needs to be increased*

1. Open [GitHub Billing](https://github.com/settings/billing) and fix payment / spending limit.
2. Re-run the failed workflows on `main-fixed`, or push an empty commit:
   ```bash
   git checkout main-fixed && git pull
   git commit --allow-empty -m "chore: trigger deploy after billing fix"
   git push origin main-fixed
   ```

Until Cloud Run redeploys, **the live site serves an older web bundle** (e.g. Hive Apps changes won't appear).

## APK updates without waiting for Cloud Run

The **correct download URL** (always redirects to the latest Firebase APK):

**https://aibhive.com/api/download/apk**

Do **not** rely on `https://aibhive.com/taylored-mobile.apk` until auto-deploy succeeds — that path can serve a stale file from the old Cloud Run container.

In the app: **Settings → Check for updates → Download update**.

Verify after install: badge should show **v1.7.3 (build 43)** or newer.

## Manual Cloud Run deploy (optional)

If GitHub Actions stays blocked but you have `gcloud` access:

```bash
npm ci && npm run build
gcloud run deploy YOUR_SERVICE --source . --region YOUR_REGION --project gen-lang-client-0787280773
```

Use the service name and region from repo secrets `CLOUD_RUN_SERVICE` / `CLOUD_RUN_REGION`.

**Research / Discovery** needs these env vars on the same Cloud Run service (exact names):

| Variable | Purpose |
|----------|---------|
| `FIRECRAWL_API_KEY` | Deep web search (Firecrawl) |
| `SERPAPI_KEY` | Quick factual search (SerpAPI) |

After adding keys, deploy a new revision and verify: `curl -s https://aibhive.com/api/intel-gathering/cloud-status`
