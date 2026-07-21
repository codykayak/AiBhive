#!/usr/bin/env bash
# Start a new cursor/* branch from the latest main-fixed.
# Usage: ./scripts/cursor-fresh-branch.sh descriptive-name
#
# One branch per PR — never reuse a branch after its PR is squash-merged.
set -euo pipefail

NAME="${1:?Usage: $0 descriptive-name (e.g. opm-search-centering)}"
SUFFIX="${CURSOR_BRANCH_SUFFIX:-c7f3}"
BRANCH="cursor/$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | tr ' _/' '-')-${SUFFIX}"

git fetch origin main-fixed
git checkout -B "$BRANCH" origin/main-fixed

echo ""
echo "Ready on fresh branch: $BRANCH (from origin/main-fixed)"
echo "Open a PR to main-fixed when done. Do not reuse this branch after merge."
