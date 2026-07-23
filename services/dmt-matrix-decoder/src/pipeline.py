"""Orchestrate vectorization → embeddings → clustering → structural manifest."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .clustering import assign_tokens
from .embeddings import embed_glyph_from_png, feature_fallback_embedding
from .types import NormalizedGlyph, StructuralEmbedding, TokenAssignment
from .vectorize import vectorize_png

CATALOG_DIR = Path(__file__).resolve().parents[1] / "catalog"
SYMBOLS_DIR = CATALOG_DIR / "symbols"
STRUCTURAL_DIR = CATALOG_DIR / "structural"
STRUCTURAL_MANIFEST = CATALOG_DIR / "structural_manifest.json"


def build_structural_catalog(
    use_vision_embeddings: bool = False,
    embedding_provider: str = "auto",
    resample: int = 64,
) -> dict:
    """
    Full structural pipeline:
    1. Vectorize all PNG glyphs
    2. Generate embeddings (feature fallback or Gemini/Grok)
    3. Cluster + assign GLYPH_XXXX token IDs
    4. Write structural_manifest.json
    """
    STRUCTURAL_DIR.mkdir(parents=True, exist_ok=True)
    glyphs: list[NormalizedGlyph] = []
    embeddings: list[StructuralEmbedding] = []

    png_files = sorted(SYMBOLS_DIR.glob("*.png"))
    if not png_files:
        raise FileNotFoundError(f"No PNG glyphs in {SYMBOLS_DIR}")

    for png in png_files:
        glyph = vectorize_png(png, symbol_id=png.stem, resample=resample)
        glyphs.append(glyph)

        # Save per-glyph vector JSON
        vec_path = STRUCTURAL_DIR / f"{png.stem}.vector.json"
        vec_path.write_text(json.dumps(glyph.to_dict(), indent=2), encoding="utf-8")

        if use_vision_embeddings:
            emb = embed_glyph_from_png(png, glyph, provider=embedding_provider)
        else:
            emb = feature_fallback_embedding(glyph)
        embeddings.append(emb)

    tokens, cluster_meta = assign_tokens(embeddings)

    manifest = {
        "version": "2.0.0",
        "pipeline": "structural",
        "dateModified": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "resampleCount": resample,
        "glyphCount": len(glyphs),
        "embeddingProvider": embeddings[0].provider if embeddings else "none",
        "clustering": cluster_meta,
        "glyphs": [g.to_dict() for g in glyphs],
        "embeddings": [e.to_dict() for e in embeddings],
        "tokens": [t.to_dict() for t in tokens],
        "tokenIndex": {t.symbol_id: t.token_id for t in tokens},
    }

    STRUCTURAL_MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def load_structural_manifest() -> dict:
    if not STRUCTURAL_MANIFEST.exists():
        return {}
    return json.loads(STRUCTURAL_MANIFEST.read_text(encoding="utf-8"))
