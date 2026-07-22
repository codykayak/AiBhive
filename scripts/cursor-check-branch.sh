#!/usr/bin/env bash
# Verify the current branch is safe to open as a PR (not reused after squash-merge).
# Usage: ./scripts/cursor-check-branch.sh
set -euo pipefail

BRANCH="${1:-$(git branch --show-current)}"

if [[ ! "$BRANCH" =~ ^cursor/ ]]; then
  echo "Not a cursor/* branch ($BRANCH) — skipping hygiene check."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found; cannot check for prior merged PRs on $BRANCH"
  exit 0
fi

prior=$(gh pr list --head "$BRANCH" --state merged --json number -q 'map(.number) | join(", #")' 2>/dev/null || true)

if [ -n "$prior" ]; then
  echo "ERROR: Branch $BRANCH was already merged in PR(s): #$prior"
  echo ""
  echo "Create a fresh branch (never reuse after squash-merge):"
  echo "  ./scripts/cursor-fresh-branch.sh my-feature-name"
  exit 1
fi

if ! git fetch origin main-fixed --quiet 2>/dev/null; then
  echo "Could not fetch origin/main-fixed — sync manually before opening a PR."
  exit 0
fi

if ! git merge-base --is-ancestor origin/main-fixed HEAD 2>/dev/null; then
  echo "WARNING: Branch is behind origin/main-fixed. Sync before push:"
  echo "  git fetch origin main-fixed && git merge origin/main-fixed"
fi

echo "OK: $BRANCH is a fresh cursor branch."
