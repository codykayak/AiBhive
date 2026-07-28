#!/usr/bin/env bash
# Sync main-fixed into the current MR source branch (GitLab CI or local).
set -euo pipefail

MAIN_BRANCH="${MAIN_BRANCH:-main-fixed}"
SOURCE_BRANCH="${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME:-${SOURCE_BRANCH:-$(git branch --show-current)}}"
REMOTE="${GIT_REMOTE:-origin}"

if [ -z "$SOURCE_BRANCH" ]; then
  echo "SOURCE_BRANCH or CI_MERGE_REQUEST_SOURCE_BRANCH_NAME required."
  exit 1
fi

git config user.name "${GITLAB_USER_NAME:-gitlab-ci}"
git config user.email "${GITLAB_USER_EMAIL:-gitlab-ci@localhost}"

git fetch "$REMOTE" "$MAIN_BRANCH"
git checkout "$SOURCE_BRANCH"

if git merge-base --is-ancestor "$REMOTE/$MAIN_BRANCH" HEAD; then
  echo "Branch already includes $MAIN_BRANCH."
  exit 0
fi

if git merge "$REMOTE/$MAIN_BRANCH" --no-edit -m "chore: sync $MAIN_BRANCH into $SOURCE_BRANCH"; then
  git push "$REMOTE" "HEAD:$SOURCE_BRANCH"
  echo "Synced and pushed $MAIN_BRANCH into $SOURCE_BRANCH."
else
  git merge --abort || true
  echo "Merge conflict while syncing $MAIN_BRANCH — manual fix required."
  exit 1
fi
