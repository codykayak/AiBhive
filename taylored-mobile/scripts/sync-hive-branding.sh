#!/usr/bin/env bash
# Sync AiBhive beehive logo + background from repo source into Expo / Android assets.
#
# IMPORTANT: Replace assets/aibhive-logo.png (1024×1024 PNG) — NOT icon.png alone.
# Every APK build copies aibhive-logo.png → icon.png, splash-icon.png, android-icon-foreground.png.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd ../.. && pwd)"

SRC_LOGO=assets/aibhive-logo.png
if [[ -f "$ROOT/src/aibhive_background.png" ]]; then
  cp "$ROOT/src/aibhive_background.png" assets/aibhive-background.png
  echo "OK: assets/aibhive-background.png (from src/)"
fi

if [[ ! -f "$SRC_LOGO" ]]; then
  echo "MISSING: $SRC_LOGO"
  exit 1
fi

for f in icon.png splash-icon.png android-icon-foreground.png; do
  cp "$SRC_LOGO" "assets/$f"
  echo "OK: assets/$f"
done
# Smaller favicon for web tab
if command -v convert >/dev/null 2>&1; then
  convert "$SRC_LOGO" -resize 64x64 assets/favicon.png
  echo "OK: assets/favicon.png (resized)"
else
  cp "$SRC_LOGO" assets/favicon.png
  echo "OK: assets/favicon.png (copy)"
fi
