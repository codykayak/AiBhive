#!/usr/bin/env bash
# Fail if this cursor/* branch was already merged (squash-merge hygiene).
set -euo pipefail

BRANCH="${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME:-${1:-}}"
CURRENT_IID="${CI_MERGE_REQUEST_IID:-${2:-}}"
API="${GITLAB_API_URL:-${CI_API_V4_URL:-https://gitlab.com/api/v4}}"
TOKEN="${GITLAB_TOKEN:-${CI_JOB_TOKEN:-}}"
PROJECT="${CI_PROJECT_ID:-${GITLAB_PROJECT_ID:-}}"

if [ -z "$BRANCH" ] || [ -z "$PROJECT" ] || [ -z "$TOKEN" ]; then
  echo "Usage: $0 <source-branch> <mr-iid>  (or run in GitLab MR pipeline with CI vars)"
  echo "Needs GITLAB_TOKEN or CI_JOB_TOKEN and CI_PROJECT_ID / GITLAB_PROJECT_ID."
  exit 1
fi

if [[ ! "$BRANCH" =~ ^cursor/ ]]; then
  echo "Not a cursor/* branch — skipping hygiene check."
  exit 0
fi

merged=$(curl -fsS \
  --header "PRIVATE-TOKEN: $TOKEN" \
  "$API/projects/$PROJECT/merge_requests?state=merged&source_branch=$BRANCH&per_page=20" \
  | python3 -c "
import json, sys, os
iid = os.environ.get('CURRENT_IID', '')
data = json.load(sys.stdin)
nums = [str(m['iid']) for m in data if str(m.get('iid')) != iid]
print(','.join(nums))
" CURRENT_IID="$CURRENT_IID")

if [ -n "$merged" ]; then
  echo "ERROR: Branch $BRANCH was already merged in MR(s): #$merged"
  echo "Create a fresh branch with ./scripts/cursor-fresh-branch.sh"
  exit 1
fi

echo "Branch $BRANCH has not been merged before — OK."
