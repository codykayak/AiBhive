# NW Investor site deploy patches

These patches apply to **https://github.com/codykayak/realestate** `main` and power **https://realestate.aibhive.com**.

## One-click deploy (recommended)

1. In **AiBhive** repo → Settings → Secrets → Actions, add:
   - `REALESTATE_GITHUB_TOKEN` — GitHub PAT with **repo** access to `codykayak/realestate`
   - (Optional) `GCP_SA_KEY` — service account JSON for Cloud Run
   - (Optional) `GCP_PROJECT_ID` — default `realestate-map-23692`

2. Actions → **Deploy NW Investor Site** → **Run workflow**

3. After push, Cloud Build/Run should update realestate.aibhive.com (if already connected to `realestate` repo).

## Manual apply

```bash
git clone https://github.com/codykayak/realestate.git
cd realestate
git am /path/to/deploy-realestate-patches/*.patch
git push origin main
npm ci && npm run build
# deploy dist/ per your existing Cloud Run / hosting setup
```
