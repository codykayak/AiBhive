# AiBhivePlants — Android APK

Native Android shell for [aibhive.com/plants](https://aibhive.com/plants) — Pacific Northwest plant ID, foraging field guide, holistic remedies, herbs, supplements, and community posts.

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
