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

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/dmt-matrix-decoder
gcloud run deploy dmt-matrix-decoder \
  --image gcr.io/PROJECT_ID/dmt-matrix-decoder \
  --region us-central1 \
  --set-env-vars DMT_DECODER_WORKER_SECRET=your-secret \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,XAI_API_KEY=XAI_API_KEY:latest \
  --memory 1Gi --no-allow-unauthenticated
```

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
