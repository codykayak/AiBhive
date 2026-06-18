#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Checking required assets"
for f in assets/icon.png assets/splash-icon.png assets/android-icon-foreground.png; do
  if [[ ! -f "$f" ]]; then
    echo "MISSING: $f (APK build cannot continue)"
    exit 1
  fi
  echo "OK: $f"
done

echo "==> Expo prebuild (android)"
npx expo prebuild -p android --no-install

echo "==> Limit to phone CPU architectures (skip x86 emulator libs)"
sed -i 's/reactNativeArchitectures=.*/reactNativeArchitectures=armeabi-v7a,arm64-v8a/' android/gradle.properties

cd android
sdkmanager "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" >/dev/null
yes | sdkmanager --licenses >/dev/null 2>&1 || true

cp ../credentials/android-release.keystore my-release-key.keystore

echo "==> Gradle assembleRelease (arm phones only)"
./gradlew assembleRelease --no-daemon --max-workers=2 \
  -PreactNativeArchitectures=armeabi-v7a,arm64-v8a \
  -Pandroid.injected.signing.store.file="$(pwd)/my-release-key.keystore" \
  -Pandroid.injected.signing.store.password=taylored2026 \
  -Pandroid.injected.signing.key.alias=taylored-release \
  -Pandroid.injected.signing.key.password=taylored2026

echo "==> APK ready at android/app/build/outputs/apk/release/app-release.apk"
