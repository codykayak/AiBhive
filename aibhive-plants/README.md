# Living Knowledge Plants — Android APK

WebView shell that loads **https://aibhive.com/plants** for field use offline-capable browsing (via the live site).

## Build

```bash
cd aibhive-plants
npm install
bash scripts/ci-android-build.sh
```

Output: `public/aibhive-plants.apk`

CI: GitHub Actions → **Build Plants APK** (runs on `main-fixed` when `aibhive-plants/**` changes).

## Download

- Web: bottom bar on [/plants](https://aibhive.com/plants) → **Download Android APK**
- API: `https://aibhive.com/api/download/plants-apk`

Google Play listing is pending; the site offers direct APK install until approval.
