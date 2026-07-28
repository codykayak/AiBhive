#!/usr/bin/env bash
# Squash-merge the current GitLab MR (cursor agent workflow).
set -euo pipefail

API="${GITLAB_API_URL:-${CI_API_V4_URL:-https://gitlab.com/api/v4}}"
TOKEN="${GITLAB_TOKEN:-${CI_JOB_TOKEN:-}}"
PROJECT="${CI_PROJECT_ID:-${GITLAB_PROJECT_ID:-}}"
MR_IID="${CI_MERGE_REQUEST_IID:-${1:-}}"

if [ -z "$PROJECT" ] || [ -z "$TOKEN" ] || [ -z "$MR_IID" ]; then
  echo "Usage: $0 <mr-iid>"
  echo "Or run in GitLab MR pipeline (CI_MERGE_REQUEST_IID set)."
  exit 1
fi

echo "Merging MR !$MR_IID (squash, delete source branch)…"

curl -fsS --request PUT \
  --header "PRIVATE-TOKEN: $TOKEN" \
  "$API/projects/$PROJECT/merge_requests/$MR_IID/merge?squash=true&should_remove_source_branch=true" \
  | python3 -c "import json,sys; m=json.load(sys.stdin); print('Merged:', m.get('web_url', m))"
