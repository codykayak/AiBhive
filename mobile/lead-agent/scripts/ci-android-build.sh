#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> npm install"
npm ci

echo "==> SMS native bridge + bundle JS in APK"
node scripts/post-prebuild-android.mjs

echo "==> Gradle assembleDebug"
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon

echo "==> APK:"
ls -lh app/build/outputs/apk/debug/app-debug.apk
