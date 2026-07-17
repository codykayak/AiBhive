# Emergency rollback: install `public/taylored-mobile.apk` — last verified build.

**Badge to verify:** top-right should show the version in `mobile-releases.json` (check `GET /api/mobile/releases` for the live shipped version).

See **UPDATE_MODEL.md** for the full dev/update workflow (native vs OTA, when to build).

## Build a new APK

Pick one — **do not run both** for the same release:

### Option A — Google Cloud Build (recommended; saves GitHub Actions minutes)

```bash
gcloud builds submit --config taylored-mobile/cloudbuild.yaml .
```

**Cloud Build compiles the APK and publishes to Firebase** (manifest + .gz mirror), so **Check for updates** should show the new version when the build finishes. For redundancy, also commit the APK to git:

1. Download `app-release.apk` from the Cloud Build run if needed, or copy from `public/taylored-mobile.apk` after a local publish.
2. From repo root:

```bash
bash scripts/publish-mobile-from-apk.sh /path/to/app-release.apk
git add public/taylored-mobile.apk public/mobile-releases.json
git commit -m "chore(mobile): publish APK + manifest [skip-apk]"
git push origin main-fixed
```

3. Confirm: `curl https://aibhive.com/api/mobile/releases` shows the new `shippedNativeVersion`.

Optional upload to your bucket during build:

```bash
gcloud builds submit --config taylored-mobile/cloudbuild.yaml . \
  --substitutions=_APK_GCS_BUCKET=your-project-apk-bucket
```

See **PLAY_STORE.md** for Play Console + EAS AAB steps.

### Option B — GitHub Actions (manual only)

GitHub → Actions → **Build Android APK** → **Run workflow**

### Option C — Local machine

```bash
cd taylored-mobile
npm install
bash scripts/ci-android-build.sh
cp android/app/build/outputs/apk/release/app-release.apk ../public/taylored-mobile.apk
cd ..
node scripts/write-mobile-release.mjs
node scripts/publish-apk-firebase.mjs   # optional Firebase .gz mirror
```

Builds use phone CPUs only (arm64) so CI finishes in ~30 min instead of hanging.

Required files:
- `assets/icon.png`
- `assets/splash-icon.png`
- `assets/android-icon-foreground.png`

After success, update `public/mobile-releases.json` and `public/taylored-mobile.apk`.

## Check for updates (in app)

Settings → App updates → Check for updates

Uses `https://aibhive.com/api/mobile/releases` to compare your installed version with the latest shipped APK.
