# Taylored Mobile — Update model

Two tracks so we can keep developing without burning CI on every push.

## What users have today

| Layer | Version | How it updates |
|-------|---------|----------------|
| **Native app (APK)** | **v1.0.5** (stable install) | Manual download + install |
| **Source on `main-fixed`** | **v1.1.0** code | Not on phones until next APK build |
| **JS bundle (OTA)** | After next APK | EAS Update when `EXPO_TOKEN` is configured |

Badge check: top-right should show **v1.0.5** on the current stable install.

## Developer workflow

### 1. Day-to-day feature work (no APK)

- Merge JS/UI changes to `main-fixed` as usual.
- **Do not** run **Build Android APK** for every merge.
- Optional: EAS Update workflow publishes JS-only changes when `EXPO_TOKEN` is set (users need an APK built with `expo-updates` first).

### 2. When you need a new native install

Run **only when batched and ready**:

1. GitHub → Actions → **Build Android APK** → **Run workflow**
2. ~30 min (arm-only build)
3. CI commits `public/taylored-mobile.apk` + updates `public/mobile-releases.json`
4. Firebase mirror URL logged in the publish step
5. Share `https://aibhive.com/download.html` or the Firebase `.gz` link

### 3. Release manifest

`public/mobile-releases.json` is the source of truth for in-app “Check for updates”:

- `shippedNativeVersion` — version baked into the committed APK
- `downloadUrl` / `firebaseGzUrl` — install links
- Updated automatically by CI after each APK deploy

Server endpoint: `GET /api/mobile/releases`

### 4. In-app update check

Settings → **App updates** → **Check for updates**

- **Native behind** → offers download link
- **OTA pending** → “Restart to apply” (after EAS is wired)
- **Current** → no action needed

## Next milestone: v1.1.0 APK

When you approve one manual CI build:

1. Source already at v1.1.0 in `app.json`
2. Build embeds `expo-updates` for future JS-only pushes
3. Users install once; later UI fixes can ship via OTA

## Required secrets (optional layers)

| Secret | Purpose |
|--------|---------|
| `EXPO_TOKEN` | EAS Update (JS OTA) on push to `main-fixed` |
| Cloud Run env | Hive Magic server (`GEMINI_API_KEY`, etc.) |

## Files

- `taylored-mobile/BUILD_APK.md` — emergency rollback + manual build
- `scripts/write-mobile-release.mjs` — bump manifest after deploy
- `taylored-mobile/src/lib/appUpdates.ts` — client update logic
- `.github/workflows/build-apk.yml` — manual APK only
- `.github/workflows/eas-update.yml` — optional JS OTA
