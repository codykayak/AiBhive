# DMT Matrix Decoder — Cloud Run Worker

Python image classifier + **structural vector analysis** + Gemini/Grok vision for decoding 650nm laser diffraction glyph matrices.

## Architecture (v2 — Structural)

```
PNG catalogue (100×100)
    ↓ vectorize.py          — contour → equidistant points → normalize [-1,1] + stroke graph
    ↓ embeddings.py         — Gemini/Grok structural embeddings (feature fallback)
    ↓ clustering.py         — UMAP + HDBSCAN → GLYPH_XXXX token IDs
    ↓ structural_manifest.json

Upload photo
    ↓ structural_match.py   — chamfer distance on normalized vectors
    ↓ classifier.py         — legacy raster template match (fallback)
    ↓ vision.py             — structured JSON with attributions
    ↓ syntax.py             — entropy, bigram matrix, spatial graph
```

## Core modules

| Module | Role |
|--------|------|
| `src/types.py` | Typed dataclasses (NormalizedGlyph, TokenAssignment, SyntaxAnalysis) |
| `src/vectorize.py` | Vector standardization pipeline |
| `src/embeddings.py` | Multimodal structural embeddings |
| `src/clustering.py` | UMAP + HDBSCAN token assignment |
| `src/structural_match.py` | Chamfer-distance structural classifier |
| `src/syntax.py` | Shannon entropy, n-grams, 2D spatial graphs |
| `src/pipeline.py` | Build orchestration |
| `scripts/build_structural_catalog.py` | CLI to rebuild structural manifest |

## Sync catalogue from dmtcode.com

The PNG ZIP on [dmtcode.com/registry](https://dmtcode.com/registry) is listed as **Coming Soon**.
Live 100×100 glyphs are available via the public Supabase `registry_glyphs` table (embedded base64 PNGs).

```bash
# From repo root — fetches registry + rebuilds raster + structural manifests
npm run sync:dmt-catalog

# Or inside the worker directory
python3 scripts/fetch_dmtcode_registry.py
python3 scripts/build_catalog.py
python3 scripts/build_structural_catalog.py
```

Also available: [data.json](https://dmtcode.com/data.json), registry CSV/JSON downloads (SPA), and
[Zenodo 10.5281/zenodo.17816520](https://doi.org/10.5281/zenodo.17816520) (metadata JSON only).

## Build structural catalogue

```bash
cd services/dmt-matrix-decoder
pip install -r requirements.txt
python3 scripts/build_catalog.py
python3 scripts/build_structural_catalog.py
# Optional: Gemini/Grok vision embeddings
python3 scripts/build_structural_catalog.py --vision --provider gemini
```

Output: `catalog/structural_manifest.json` + per-glyph `catalog/structural/*.vector.json`

## Deploy

Pushes to `main-fixed` under `services/dmt-matrix-decoder/` trigger `.github/workflows/deploy-dmt-matrix-decoder.yml`.
Uses the same GCP Workload Identity secrets as the main AiBhive Cloud Run service.

Manual deploy:

```bash
cd services/dmt-matrix-decoder
PROJECT=gen-lang-client-0787280773
gcloud builds submit --tag gcr.io/$PROJECT/dmt-matrix-decoder --project $PROJECT
gcloud run deploy dmt-matrix-decoder \
  --image gcr.io/$PROJECT/dmt-matrix-decoder \
  --region us-central1 \
  --project $PROJECT \
  --memory 1Gi \
  --timeout 120 \
  --set-env-vars DMT_DECODER_WORKER_SECRET=your-secret \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,XAI_API_KEY=XAI_API_KEY:latest \
  --allow-unauthenticated
```

### Wire main AiBhive Cloud Run service

Add to the **main** Cloud Run service (Express on aibhive.com):

| Variable | Value |
|----------|--------|
| `DMT_DECODER_URL` | Worker URL, e.g. `https://dmt-matrix-decoder-xxxxx-uc.a.run.app` |
| `DMT_DECODER_WORKER_SECRET` | Same secret as the worker |

`GEMINI_API_KEY` and `XAI_API_KEY` / `GROK_API_KEY` should already exist on the main service (vision fallback).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health + raster + structural counts |
| GET | `/catalog` | Raster PNG manifest |
| GET | `/structural/catalog` | Full structural manifest + tokens |
| POST | `/structural/match` | Structural-only match |
| POST | `/structural/analyze-sequence` | Syntax analysis on token sequence |
| POST | `/decode` | Structural + raster + vision fusion |

### POST `/structural/analyze-sequence`

```json
{
  "tokens": ["GLYPH_0001", "GLYPH_0003", "GLYPH_0001"],
  "positions": [{"x": 0.1, "y": 0.2, "width": 0.1, "height": 0.1}]
}
```

Returns Shannon entropy, bigram transition matrix, trigram counts, and 2D spatial relationship graph.
