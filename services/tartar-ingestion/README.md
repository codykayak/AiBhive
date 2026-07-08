# Tartar Ingestion — Cloud Run Worker

Heavy archive ingestion for **Old Tartar Research**. Firebase Callable functions queue jobs; this service processes them at scale.

## Deploy

```bash
cd services/tartar-ingestion
gcloud builds submit --tag gcr.io/PROJECT_ID/tartar-ingestion
gcloud run deploy tartar-ingestion \
  --image gcr.io/PROJECT_ID/tartar-ingestion \
  --region us-central1 \
  --set-env-vars TARTAR_WORKER_SECRET=your-secret \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,GROK_API_KEY=GROK_API_KEY:latest,KIMI_API_KEY=KIMI_API_KEY:latest \
  --no-allow-unauthenticated
```

## Endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/ingest` | `{ uid, jobId }` | Run one ingestion job |
| POST | `/poll` | — | Future: batch queued jobs |

## Auth

Set header `x-tartar-worker-secret` to match `TARTAR_WORKER_SECRET`.

## Architecture

```
Client → tartarStartIngestion (Cloud Function) → Firestore job doc
Cloud Scheduler / manual → Cloud Run /ingest → pipeline.runIngestionJob
```

Source adapters live in `functions/lib/tartar/ingestion/` and are shared with Cloud Functions.
