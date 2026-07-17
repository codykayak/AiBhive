#!/usr/bin/env bash
# Publish a built APK so in-app "Check for updates" and download.html work.
# Usage:
#   bash scripts/publish-mobile-from-apk.sh path/to/app-release.apk
#   bash scripts/publish-mobile-from-apk.sh   # uses public/taylored-mobile.apk
set -euo pipefail
cd "$(dirname "$0")/.."

APK="${1:-public/taylored-mobile.apk}"
if [[ ! -f "$APK" ]]; then
  echo "APK not found: $APK"
  echo "Build first: cd taylored-mobile && bash scripts/ci-android-build.sh"
  exit 1
fi

mkdir -p public
cp "$APK" public/taylored-mobile.apk
echo "==> Copied APK ($(du -h public/taylored-mobile.apk | cut -f1))"

node scripts/write-mobile-release.mjs
echo "==> Wrote public/mobile-releases.json"

if [[ ! -d node_modules ]]; then
  npm ci
fi

echo "==> Uploading .gz mirror to Firebase…"
OUTPUT_FILE="$(mktemp)"
node scripts/publish-apk-firebase.mjs | tee "$OUTPUT_FILE"
GZ_URL=$(grep '^FIREBASE_GZ_URL=' "$OUTPUT_FILE" | head -n1 | cut -d= -f2-)
rm -f "$OUTPUT_FILE"

if [[ -n "$GZ_URL" ]]; then
  node scripts/write-mobile-release.mjs --firebase-gz-url "$GZ_URL"
fi

node scripts/publish-mobile-manifest-storage.mjs

echo ""
echo "Done. Next steps:"
echo "  1. git add public/taylored-mobile.apk public/mobile-releases.json"
echo "  2. git commit -m 'chore(mobile): publish v$(node -p \"require('./taylored-mobile/app.json').expo.version\") APK [skip-apk]'"
echo "  3. git push origin main-fixed   (triggers Cloud Run deploy via auto-deploy)"
echo "  4. Verify: curl https://aibhive.com/api/mobile/releases"
