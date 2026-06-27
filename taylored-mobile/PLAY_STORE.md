# Google Play Store — AiBhive checklist

Use this when moving from sideload beta to Play Store internal testing and production.

## Why Cloud Build instead of GitHub Actions?

APK builds take ~30–45 minutes. **Google Cloud Build** runs them on GCP machines so you do not burn GitHub Actions minutes. **Cloud Run** hosts the website/API; it is not meant for long Gradle builds — use Cloud Build (see `cloudbuild.yaml`).

## Before first upload

| Item | Status / action |
|------|-----------------|
| Privacy policy URL | `https://aibhive.com/privacy-policy.html` |
| Package name | `com.tayloredmobile.app` (do not change after first upload) |
| Signing key | `credentials/android-release.keystore` — **back up**; Play App Signing can enroll this key |
| Version | `app.json` → `version` + `android.versionCode` (must increase each upload) |
| AAB for Play | `eas build --platform android --profile production` (buildType: app-bundle) |
| APK for sideload | `scripts/ci-android-build.sh` or Cloud Build |
| ASO listing copy | `store/android/en-US/` — title, short + full description (keyword-optimized) |

## App Store Optimization (ASO)

Listing files live in `taylored-mobile/store/android/en-US/` for EAS metadata upload:

```bash
cd taylored-mobile
eas metadata:push --platform android
```

**Primary keywords (woven into full description):**
AI app builder, no-code app maker, custom app creator, productivity, job tracker, resume builder, business tools, habit tracker, workflow app, AI assistant

**Title (30 chars max for Play — use brand + primary keyword):**
`AiBhive — AI App Builder & Job Tools`

**Short description (80 chars max):**
`Build custom apps in plain English. AI app builder, job tracker, resume helper & research tools.`

**Category:** Productivity  
**Tags / content rating:** Everyone (no mature content)  
**Contact:** support@aibhive.com

**ASO tips:**
1. Front-load the title with "AI App Builder" — highest-intent search term for this product.
2. Repeat natural keyword variants in the first 2 lines of the full description (Google indexes this heavily).
3. Use feature bullets with verbs users search: "Build", "Track", "Export", "Resume".
4. Include "no coding" and "plain English" — common long-tail queries.
5. Upload 4–6 screenshots showing: home chat, Build tab, finished app, Apps list, Export options, Job tracker.
6. Feature graphic: amber hive logo + "Build apps in plain English" tagline on dark background.

## Play Console setup

1. [Google Play Console](https://play.google.com/console) → Create app → **AiBhive**
2. **App content** → Privacy policy → `https://aibhive.com/privacy-policy.html`
3. **App content** → Data safety — declare: account info, user-generated content, payments (Stripe), optional AI processing
4. **Testing** → Internal testing → upload first **AAB** from EAS production profile
5. Add tester emails (your Samsung / DeX accounts)

## EAS production build (AAB)

```bash
cd taylored-mobile
# One-time: eas init (real projectId replaces placeholder in app.json extra.eas.projectId)
eas build --platform android --profile production
eas submit --platform android --profile production   # uploads to internal track
eas metadata:push --platform android                 # push ASO listing copy
```

Secrets in EAS / local `.env`:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (Play Console → OAuth + SHA-1 from upload key)

Set `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` for Play/beta builds with Google sign-in.

## Google Sign-In (beta autopilot)

1. Firebase Console → Authentication → Google → enable
2. Play Console → App integrity → App signing → copy **SHA-1** (upload + app signing certs)
3. Google Cloud Console → APIs → Credentials → Android OAuth client with package `com.tayloredmobile.app` + SHA-1
4. Web client ID → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
5. Rebuild APK/AAB with auth enabled

Until then, sideload builds keep auth off (`GOOGLE_AUTH_ENABLED` defaults false).

## v1.7.6 Play readiness notes

| Change | Why |
|--------|-----|
| Chat suggestions hide after first message | Cleaner composer once user starts chatting |
| 30% Hive credit markup | Lower token pricing for users |
| Build-complete upsell + User Guide | Grok offers Hive vs stand-alone export; guide ships with every app |
| ASO store listing files | `store/android/en-US/` for Play search optimization |

| Permission | Why |
|------------|-----|
| `READ_CALENDAR` / `WRITE_CALENDAR` | Optional job follow-up reminders (user taps "Add to calendar") |
| `POST_NOTIFICATIONS` | Daily motivation + build-ready dings (custom hive chime) |

**Data safety additions:** App activity (screens visited, job counts) stored on-device for proactive suggestions; optional Grok 3 brief via Hive credits. Toggles in Settings → Daily Hive assistant.

**Pre-submit smoke test:**
1. Home chat — suggestions disappear after first message
2. Build completes → User Guide button + export upsell appear
3. Mark job **Submitted** → calendar prompt appears
4. Settings → enable daily notification → verify permission prompt
5. `eas build --platform android --profile production` → upload AAB to Internal testing

## Sideload beta (current)

Share `https://aibhive.com/download.html` — badge should match `mobile-releases.json` → `shippedNativeVersion`.
