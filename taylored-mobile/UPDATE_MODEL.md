# Taylored Mobile — Update model

Two tracks so we can keep developing without burning CI on every push.

## What users install

| Layer | How it updates |
|-------|----------------|
| **Native app (APK)** | Manual download from `aibhive.com/download.html` or in-app check |
| **JS bundle (OTA)** | EAS Update when `EXPO_TOKEN` is configured (manual workflow) |

Badge check: top-right version should match `public/mobile-releases.json` → `shippedNativeVersion`.

## Developer workflow

### 1. Day-to-day feature work (no APK)

- Merge JS/UI changes to `main-fixed` as usual.
- **Do not** rebuild APK for every merge.
- Optional: run **EAS Update** workflow manually when `EXPO_TOKEN` is set.

### 2. When you need a new native install

Run **only when batched and ready**:

1. **GCP Cloud Build** (preferred when GitHub Actions billing is blocked): `gcloud builds submit --config taylored-mobile/cloudbuild.yaml .`
2. Or GitHub → Actions → **Build Android APK** (auto on `main-fixed` pushes to `taylored-mobile/**`, or manual dispatch)
3. Or local: `taylored-mobile/scripts/ci-android-build.sh`
4. ~30 min (arm-only build)
5. Publish: `public/taylored-mobile.apk` + `node scripts/write-mobile-release.mjs` + `node scripts/publish-apk-firebase.mjs` + `node scripts/publish-mobile-manifest-storage.mjs`
6. Share `https://aibhive.com/download.html`

**Important:** Bumping `taylored-mobile/app.json` alone does **not** change what users see in **Check for updates**. The release manifest (`public/mobile-releases.json` + Firebase mirror) only updates after a new APK is built and published. If the manifest still shows v1.6.1 while `app.json` is v1.6.3, the APK workflow did not complete — check GitHub Actions billing or use GCP Cloud Build.

### 3. Release manifest

`public/mobile-releases.json` is the source of truth for in-app “Check for updates”:

- `shippedNativeVersion` — version baked into the committed APK
- `downloadUrl` / `firebaseGzUrl` — install links
- Updated by deploy scripts after each APK publish

Server endpoint: `GET /api/mobile/releases`

### 4. In-app update check

Settings → **App updates** → **Check for updates**

- **Native behind** → offers download link
- **OTA pending** → “Restart to apply” (after EAS is wired)
- **Current** → no action needed

## Play Store path

See **PLAY_STORE.md** — privacy policy, EAS AAB, internal testing track.

## Google Sign-In (beta)

Build with `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` and OAuth client IDs when Play SHA-1 is configured. Sideload builds default to auth off.

## Required secrets (optional layers)

| Secret | Purpose |
|--------|---------|
| `EXPO_TOKEN` | EAS Update (JS OTA), manual workflow |
| `EXPO_PUBLIC_GOOGLE_*` | Google sign-in for beta / Play |
| Cloud Run env | Hive Magic server (`GEMINI_API_KEY`, `CURSOR_API_KEY`, etc.) |

## Files

- `taylored-mobile/BUILD_APK.md` — build options (GCP, GitHub, local)
- `taylored-mobile/PLAY_STORE.md` — Play Console checklist
- `taylored-mobile/cloudbuild.yaml` — GCP APK build
- `scripts/write-mobile-release.mjs` — bump manifest after deploy
- `taylored-mobile/src/lib/appUpdates.ts` — client update logic
- `.github/workflows/build-apk.yml` — manual GitHub APK (fallback)
- `.github/workflows/eas-update.yml` — manual JS OTA
