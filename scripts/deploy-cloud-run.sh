#!/usr/bin/env bash
# Deploy AiBhive web + server to Cloud Run from Cloud Agent or local shell.
# Requires env vars: GCP_SA_KEY (JSON or base64), CLOUD_RUN_SERVICE, CLOUD_RUN_REGION
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SERVICE="${CLOUD_RUN_SERVICE:-aibhive}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
PROJECT="${GCP_PROJECT_ID:-gen-lang-client-0787280773}"

if [[ -z "${GCP_SA_KEY:-}" ]]; then
  echo "ERROR: GCP_SA_KEY is not set."
  echo "Add your GCP service-account JSON to Cursor Cloud environment secrets as GCP_SA_KEY,"
  echo "plus CLOUD_RUN_SERVICE and CLOUD_RUN_REGION, then re-run: npm run deploy:cloud-run"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Installing Google Cloud SDK..."
  curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir="$HOME"
  export PATH="$HOME/google-cloud-sdk/bin:$PATH"
fi

KEY_FILE="$(mktemp)"
trap 'rm -f "$KEY_FILE"' EXIT

if echo "$GCP_SA_KEY" | base64 -d > "$KEY_FILE" 2>/dev/null && python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$KEY_FILE" 2>/dev/null; then
  :
else
  printf '%s' "$GCP_SA_KEY" > "$KEY_FILE"
fi

gcloud auth activate-service-account --key-file="$KEY_FILE" --quiet
gcloud config set project "$PROJECT" --quiet

echo "Building production bundle..."
npm ci
npm run build

echo "Deploying $SERVICE to Cloud Run ($REGION, $PROJECT)..."
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --project "$PROJECT" \
  --quiet

echo "Deploy complete. Verify: curl -s https://aibhive.com/plants | head"
