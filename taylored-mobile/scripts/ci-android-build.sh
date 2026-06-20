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
if ! grep -q '^android.lint.checkReleaseBuilds=' "$GRADLE_PROPS"; then
  printf '\nandroid.lint.checkReleaseBuilds=false\n' >> "$GRADLE_PROPS"
fi

cd android
sdkmanager "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" >/dev/null
yes | sdkmanager --licenses >/dev/null 2>&1 || true

cp ../credentials/android-release.keystore my-release-key.keystore

echo "==> Gradle assembleRelease (arm phones only, lint skipped)"
./gradlew assembleRelease --no-daemon --max-workers=1 \
  -x lintVitalAnalyzeRelease -x lintVitalReportRelease \
  -PreactNativeArchitectures=armeabi-v7a,arm64-v8a \
  -Pandroid.injected.signing.store.file="$(pwd)/my-release-key.keystore" \
  -Pandroid.injected.signing.store.password=taylored2026 \
  -Pandroid.injected.signing.key.alias=taylored-release \
  -Pandroid.injected.signing.key.password=taylored2026

echo "==> APK ready at android/app/build/outputs/apk/release/app-release.apk"
