# Emergency rollback: install `public/taylored-mobile.apk` — last CI-verified **v1.0.5** build.

**Badge to verify:** top-right should show **v1.0.5**

Source on `main-fixed` may be ahead (v1.1.0 code). The committed APK is the stable install until the next manual CI build succeeds.

See **UPDATE_MODEL.md** for the full dev/update workflow (native vs OTA, when to build).

## Build a new APK (manual only)

GitHub → Actions → **Build Android APK** → **Run workflow**

Builds use phone CPUs only (arm64) so CI finishes in ~30 min instead of hanging.

Required files:
- `assets/icon.png`
- `assets/splash-icon.png`
- `assets/android-icon-foreground.png`

After success, CI updates `public/mobile-releases.json` and `public/taylored-mobile.apk`.

## Check for updates (in app)

Settings → App updates → Check for updates

Uses `https://aibhive.com/api/mobile/releases` to compare your installed version with the latest shipped APK.
