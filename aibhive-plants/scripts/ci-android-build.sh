#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Plants app URL"
export EXPO_PUBLIC_PLANTS_URL="${EXPO_PUBLIC_PLANTS_URL:-https://aibhive.com/plants?mobile=1}"
echo "EXPO_PUBLIC_PLANTS_URL=$EXPO_PUBLIC_PLANTS_URL"

echo "==> App icon"
for f in icon.png; do
  if [[ ! -f "$f" ]]; then
    echo "MISSING: $f"
    exit 1
  fi
  echo "OK: $f"
done

mkdir -p credentials
if [[ ! -f credentials/android-release.keystore ]]; then
  cp ../taylored-mobile/credentials/android-release.keystore credentials/android-release.keystore
fi

echo "==> Expo prebuild (android)"
npx expo prebuild -p android --no-install

echo "==> Limit to phone CPU architectures"
sed -i 's/reactNativeArchitectures=.*/reactNativeArchitectures=armeabi-v7a,arm64-v8a/' android/gradle.properties

GRADLE_PROPS=android/gradle.properties
if grep -q '^org.gradle.jvmargs=' "$GRADLE_PROPS"; then
  sed -i 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m/' "$GRADLE_PROPS"
else
  printf '\norg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m\n' >> "$GRADLE_PROPS"
fi
if grep -q '^android.lint.checkReleaseBuilds=' "$GRADLE_PROPS"; then
  sed -i 's/^android.lint.checkReleaseBuilds=.*/android.lint.checkReleaseBuilds=false/' "$GRADLE_PROPS"
else
  printf '\nandroid.lint.checkReleaseBuilds=false\n' >> "$GRADLE_PROPS"
fi

APP_BUILD_GRADLE=android/app/build.gradle
if [[ -f "$APP_BUILD_GRADLE" ]] && ! grep -q 'checkReleaseBuilds false' "$APP_BUILD_GRADLE"; then
  sed -i '/^android {/a\    lint {\n        checkReleaseBuilds false\n        abortOnError false\n    }' "$APP_BUILD_GRADLE"
fi

node scripts/patch-release-signing.mjs

cd android
sdkmanager "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" >/dev/null
yes | sdkmanager --licenses >/dev/null 2>&1 || true

cp ../credentials/android-release.keystore my-release-key.keystore

echo "==> Gradle assembleRelease"
./gradlew :app:assembleRelease --no-daemon --max-workers=1 \
  -PreactNativeArchitectures=armeabi-v7a,arm64-v8a \
  -Pandroid.injected.signing.store.file="$(pwd)/my-release-key.keystore" \
  -Pandroid.injected.signing.store.password=taylored2026 \
  -Pandroid.injected.signing.key.alias=taylored-release \
  -Pandroid.injected.signing.key.password=taylored2026

APK_OUT="app/build/outputs/apk/release/app-release.apk"
PUBLIC_APK="../../public/aibhive-plants.apk"
mkdir -p "$(dirname "$PUBLIC_APK")"
cp "$APK_OUT" "$PUBLIC_APK"
echo "==> Plants APK ready at public/aibhive-plants.apk"

# Free runner disk before upload / publish steps
rm -rf app/build android/.gradle ../node_modules/.cache 2>/dev/null || true
