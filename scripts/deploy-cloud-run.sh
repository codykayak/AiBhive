#!/usr/bin/env bash
# EMERGENCY ONLY — same as deploy-cloud-build.ps1 but direct Cloud Run source deploy.
# Routine: npm run ship
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${ALLOW_LOCAL_GCP_DEPLOY:-}" ]]; then
  echo ""
  echo "BLOCKED: Local gcloud run deploy --source uploads a tarball from this machine."
  echo "  Routine: npm run ship"
  echo "  Emergency: ALLOW_LOCAL_GCP_DEPLOY=1 $0"
  echo ""
  exit 1
fi

node scripts/gcp-upload-guard.mjs

SERVICE="${CLOUD_RUN_SERVICE:-aibhive}"
REGION="${CLOUD_RUN_REGION:-us-west1}"
PROJECT="${GCP_PROJECT_ID:-project-c223f844-6371-4c3f-a0c}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud not installed"
  exit 1
fi

gcloud config set project "$PROJECT" --quiet
npm ci
npm run build
gcloud run deploy "$SERVICE" --source . --region "$REGION" --project "$PROJECT" --quiet
echo "Deploy complete."
