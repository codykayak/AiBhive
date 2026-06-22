# Google Play Store — Taylored Mobile checklist

Use this when you are ready to move from sideload beta to Play Store internal testing.

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

## Play Console setup

1. [Google Play Console](https://play.google.com/console) → Create app → **Taylored** (or AiBhive)
2. **App content** → Privacy policy → `https://aibhive.com/privacy-policy.html`
3. **App content** → Data safety — declare: account info, user-generated content, payments (Stripe), optional AI processing
4. **Testing** → Internal testing → upload first **AAB** from EAS production profile
5. Add tester emails (your Samsung / DeX accounts)

## EAS production build (AAB)

```bash
cd taylored-mobile
# One-time: eas init (real projectId replaces placeholder in app.json extra.eas.projectId)
eas build --platform android --profile production
eas submit --platform android --profile production   # optional: uploads to internal track
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

## Store listing copy (starter)

- **Short description:** Describe apps in plain English. Hive Magic estimates, builds, and notifies you.
- **Full description:** Taylored Mobile is your pocket AI factory — job research, custom mini-apps, and Hive Magic builds powered by AiBhive.
- **Category:** Productivity
- **Contact:** support@aibhive.com

## Build APK on GCP (sideload / beta)

From repo root (requires `gcloud` and Cloud Build API):

```bash
gcloud builds submit --config taylored-mobile/cloudbuild.yaml .
```

Optional: set `_DEPLOY_TO_REPO=true` substitution only if a follow-up step with git credentials is configured (default uploads APK to GCS only).

After build, download APK from the Cloud Build artifacts bucket or run the local publish script if you copied the APK to `public/taylored-mobile.apk`.

## Sideload beta (current)

Share `https://aibhive.com/download.html` — badge should match `mobile-releases.json` → `shippedNativeVersion`.
