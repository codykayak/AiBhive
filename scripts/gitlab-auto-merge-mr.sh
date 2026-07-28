#!/usr/bin/env bash
# Full auto-merge flow for cursor/* → main-fixed on GitLab.
set -euo pipefail

SOURCE="${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME:-}"
if [[ ! "$SOURCE" =~ ^cursor/ ]]; then
  echo "Source branch must match cursor/* — got: $SOURCE"
  exit 0
fi

./scripts/gitlab-branch-hygiene.sh

if ./scripts/gitlab-sync-mr.sh; then
  ./scripts/gitlab-merge-mr.sh
else
  echo "Sync failed — not merging."
  exit 1
fi
