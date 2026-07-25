# AiBhivePlants — Android APK

Standalone Android app for **[aibhive.com/plants](https://aibhive.com/plants)** only — not the full AiBhive website.

## In-app scope (8 pages)

Home, Community, Plants & foraging, Herbs, Supplements, Holistic protocols, Hypnosis & energy, and Animal health — all under `/plants/*`.

## Icon

Launcher icon: [`icon.png`](./icon.png) (referenced in `app.json` for icon, splash, and adaptive icon).

## Local build

```bash
cd aibhive-plants
npm ci
bash scripts/ci-android-build.sh
```

Output: `public/aibhive-plants.apk` (served as **AiBhivePlants.apk**)

CI: GitHub Actions → **Build Plants APK** (runs on `main-fixed` when `aibhive-plants/**` changes).

## Download

- Web: https://aibhive.com/plants — **Get AiBhivePlants APK** button
- API: https://aibhive.com/api/download/plants-apk
- Short URL: https://aibhive.com/AiBhivePlants.apk

Google Play listing pending — direct APK install supported.
