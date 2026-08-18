#!/usr/bin/env bash
# Deploy AiBhive web + server to Cloud Run.
# Auth (any one): GOOGLE_APPLICATION_CREDENTIALS file, GCP_SA_KEY env, or gcloud auth login on host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SERVICE="${CLOUD_RUN_SERVICE:-aibhive}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
PROJECT="${GCP_PROJECT_ID:-gen-lang-client-0787280773}"

if ! command -v gcloud >/dev/null 2>&1; then
  curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir="$HOME"
  export PATH="$HOME/google-cloud-sdk/bin:$PATH"
fi

if [[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" && -f "${GOOGLE_APPLICATION_CREDENTIALS}" ]]; then
  gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS" --quiet
elif [[ -n "${GCP_SA_KEY:-}" ]]; then
  KEY_FILE="$(mktemp)"
  trap 'rm -f "$KEY_FILE"' EXIT
  if echo "$GCP_SA_KEY" | base64 -d > "$KEY_FILE" 2>/dev/null && python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$KEY_FILE" 2>/dev/null; then
    :
  else
    printf '%s' "$GCP_SA_KEY" > "$KEY_FILE"
  fi
  gcloud auth activate-service-account --key-file="$KEY_FILE" --quiet
elif ! gcloud auth print-access-token >/dev/null 2>&1; then
  echo "ERROR: No GCP credentials. gcloud auth login on this machine, or set GCP_SA_KEY / GOOGLE_APPLICATION_CREDENTIALS."
  exit 1
fi

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

echo "Deploy complete."
