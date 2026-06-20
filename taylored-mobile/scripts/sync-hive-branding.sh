#!/usr/bin/env bash
# Sync AiBhive beehive logo into Expo / Android launcher assets.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/aibhive-logo.png
for f in icon.png splash-icon.png android-icon-foreground.png; do
  cp "$SRC" "assets/$f"
  echo "OK: assets/$f"
done
# Smaller favicon for web tab
if command -v convert >/dev/null 2>&1; then
  convert "$SRC" -resize 64x64 assets/favicon.png
  echo "OK: assets/favicon.png (resized)"
else
  cp "$SRC" assets/favicon.png
  echo "OK: assets/favicon.png (copy)"
fi
