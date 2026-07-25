# AiBhivePlants — Android APK

Standalone Android app for **[aibhive.com/plants](https://aibhive.com/plants)** only — not the full AiBhive website.

## In-app scope (8 pages)

Home, Community, Plants & foraging, Herbs, Supplements, Holistic protocols, Hypnosis & energy, and Animal health — all under `/plants/*`.

## Icon

Launcher icon: [`icon.png`](./icon.png) — **1024×1024 PNG** (Expo / Android adaptive icon).

If GitHub rejects a large upload, commit the raw file as `icon-source.png` and run:

```bash
cd aibhive-plants
python3 -m pip install pillow
python3 -c "from PIL import Image; ..."  # or: node scripts/normalize-icon.mjs icon-source.png
```

The repo includes `icon-source.png` as the master honeycomb artwork; CI validates `icon.png` is a real PNG before building.

## Local build

```bash
cd aibhive-plants
npm ci
bash scripts/ci-android-build.sh
```

Output: `public/aibhive-plants.apk` (served as **AiBhivePlants.apk**)

CI: GitHub Actions → **Build Plants APK** (runs on `main-fixed` when `aibhive-plants/**` changes).

**If GitHub Actions billing blocks CI**, build on Google Cloud Build instead:

```bash
gcloud builds submit --config aibhive-plants/cloudbuild.yaml .
```

Then commit `public/aibhive-plants.apk` and `public/plants-mobile-releases.json` to `main-fixed`, or rely on the Firebase mirror updated by the build script.

## Download

- Web: https://aibhive.com/plants — **Get AiBhivePlants APK** button
- API: https://aibhive.com/api/download/plants-apk
- Short URL: https://aibhive.com/AiBhivePlants.apk

Google Play listing pending — direct APK install supported.
