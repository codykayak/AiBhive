# DMT Matrix Decoder — Cloud Run Worker

Python image classifier + Gemini/Grok vision for decoding 650nm laser diffraction glyph matrices. Uses the DMT Code Visual Symbol Catalogue (100×100 PNG archetypes, CC-BY-4.0).

## Deploy

```bash
cd services/dmt-matrix-decoder
python scripts/build_catalog.py   # generates/updates catalog PNGs + manifest

gcloud builds submit --tag gcr.io/PROJECT_ID/dmt-matrix-decoder
gcloud run deploy dmt-matrix-decoder \
  --image gcr.io/PROJECT_ID/dmt-matrix-decoder \
  --region us-central1 \
  --set-env-vars DMT_DECODER_WORKER_SECRET=your-secret \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,XAI_API_KEY=XAI_API_KEY:latest \
  --memory 1Gi \
  --cpu 1 \
  --no-allow-unauthenticated
```

Set on the main AiBhive Cloud Run service:

```
DMT_DECODER_URL=https://dmt-matrix-decoder-….run.app
DMT_DECODER_WORKER_SECRET=your-secret
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health + symbol count |
| GET | `/catalog` | Full glyph manifest |
| POST | `/classify` | CV-only detection (requires secret header) |
| POST | `/decode` | CV + vision fusion (requires secret header) |

### POST `/decode` body

```json
{
  "imageBase64": "<base64>",
  "mimeType": "image/jpeg",
  "useVision": true,
  "visionProvider": "auto"
}
```

Header: `x-dmt-decoder-secret: <DMT_DECODER_WORKER_SECRET>`

## Importing the full dmtcode.com PNG catalogue

Drop 100×100 PNG files into `catalog/symbols/` (filename = symbol id, e.g. `symbol_001.png`), then run:

```bash
python scripts/build_catalog.py
```

Or from the repo root:

```bash
node scripts/sync-dmt-symbol-catalogue.mjs --from /path/to/png/folder
```

## Architecture

```
Mobile web UI → Express /api/research-lab/dmt-matrix/decode
              → Cloud Run Python worker (/decode)
              → Firestore dmt_matrix_sessions
```

CV layer: OpenCV template matching + cosine similarity on normalized 100×100 vectors.
Vision layer: Gemini 2.5 Flash (auto-fallback to Grok vision).
