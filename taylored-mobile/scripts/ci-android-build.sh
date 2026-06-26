#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Sync AiBhive logo into launcher assets"
bash scripts/sync-hive-branding.sh

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

echo "==> CI Gradle tuning (memory + skip release lint OOM)"
GRADLE_PROPS=android/gradle.properties
# Prebuild may end gradle.properties without a trailing newline — fix before appending.
sed -i 's/expo\.inlineModules\.watchedDirectories=\[\].*/expo.inlineModules.watchedDirectories=[]/' "$GRADLE_PROPS"
if grep -q '^org.gradle.jvmargs=' "$GRADLE_PROPS"; then
  sed -i 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m/' "$GRADLE_PROPS"
else
  printf '\norg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m\n' >> "$GRADLE_PROPS"
fi
# Lint vital tasks fail on CI when sibling lint report tasks are skipped — disable entirely.
if grep -q '^android.lint.checkReleaseBuilds=' "$GRADLE_PROPS"; then
  sed -i 's/^android.lint.checkReleaseBuilds=.*/android.lint.checkReleaseBuilds=false/' "$GRADLE_PROPS"
else
  printf '\nandroid.lint.checkReleaseBuilds=false\n' >> "$GRADLE_PROPS"
fi

APP_BUILD_GRADLE=android/app/build.gradle
if [[ -f "$APP_BUILD_GRADLE" ]] && ! grep -q 'checkReleaseBuilds false' "$APP_BUILD_GRADLE"; then
  # Insert a lint block inside `android {` so release APK builds never block on lint.
  sed -i '/^android {/a\    lint {\n        checkReleaseBuilds false\n        abortOnError false\n    }' "$APP_BUILD_GRADLE"
fi

echo "==> Wire release keystore (prebuild defaults to debug signing)"
node scripts/patch-release-signing.mjs

cd android
sdkmanager "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" >/dev/null
yes | sdkmanager --licenses >/dev/null 2>&1 || true

cp ../credentials/android-release.keystore my-release-key.keystore

echo "==> Gradle assembleRelease (arm phones only, lint disabled)"
./gradlew :app:assembleRelease --no-daemon --max-workers=1 \
  -PreactNativeArchitectures=armeabi-v7a,arm64-v8a \
  -Pandroid.injected.signing.store.file="$(pwd)/my-release-key.keystore" \
  -Pandroid.injected.signing.store.password=taylored2026 \
  -Pandroid.injected.signing.key.alias=taylored-release \
  -Pandroid.injected.signing.key.password=taylored2026

APK_OUT="app/build/outputs/apk/release/app-release.apk"
PUBLIC_APK="../../public/taylored-mobile.apk"
cp "$APK_OUT" "$PUBLIC_APK"
echo "==> APK ready at android/$APK_OUT (copied to public/taylored-mobile.apk)"
node ../scripts/verify-built-apk.mjs "$APK_OUT"
