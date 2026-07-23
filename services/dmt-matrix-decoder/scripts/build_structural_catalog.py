"""Rebuild structural manifest from catalogue PNGs."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.pipeline import build_structural_catalog


def main() -> None:
    parser = argparse.ArgumentParser(description="Build structural glyph catalogue")
    parser.add_argument("--resample", type=int, default=64, help="Equidistant points per glyph")
    parser.add_argument("--vision", action="store_true", help="Use Gemini/Grok vision embeddings")
    parser.add_argument("--provider", default="auto", choices=["auto", "gemini", "grok"])
    args = parser.parse_args()

    manifest = build_structural_catalog(
        use_vision_embeddings=args.vision,
        embedding_provider=args.provider,
        resample=args.resample,
    )
    print(f"Structural catalogue built: {manifest['glyphCount']} glyphs")
    print(f"  Tokens: {len(manifest['tokens'])} assignments")
    print(f"  Clustering: {manifest['clustering']}")
    print(f"  Output: catalog/structural_manifest.json")


if __name__ == "__main__":
    main()
