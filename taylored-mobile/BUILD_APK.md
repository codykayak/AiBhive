# Taylored Mobile — when does a full APK rebuild happen?

Full APK builds take **~25–35 minutes** on GitHub Actions. To avoid burning minutes on every small push:

## APK builds run ONLY when:

1. **Manual:** GitHub → Actions → **Build Android APK** → **Run workflow**

Pushes to `main-fixed` **do not** auto-build anymore.

## Before asking for an APK build, batch:

- [ ] New icon in `assets/icon.png` + `android-icon-foreground.png`
- [ ] Version bump in `app.json` if you want a new badge
- [ ] Any mobile fixes you want in this install
- [ ] One commit or PR, then `[build-apk]` or manual workflow

## Install without waiting for CI

The last good APK may already be at `public/taylored-mobile.apk` on `main-fixed` (check file date/size).

## Required assets (build fails fast if missing)

- `taylored-mobile/assets/icon.png`
- `taylored-mobile/assets/splash-icon.png`
- `taylored-mobile/assets/android-icon-foreground.png`
