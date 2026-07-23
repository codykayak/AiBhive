"""Structural matching: compare normalized vector glyphs via chamfer + feature distance."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from .types import GraphEdge, NormalizedGlyph, Point2D, StrokeGraph, StructuralFeatures, StructuralMatch, TokenAssignment
from .vectorize import vectorize_bytes

CATALOG_STRUCTURAL_PATH = Path(__file__).resolve().parents[1] / "catalog" / "structural_manifest.json"


def _glyph_from_dict(entry: dict) -> NormalizedGlyph:
    pts = [Point2D(p["x"], p["y"]) for p in entry.get("points", [])]
    paths = [[Point2D(p["x"], p["y"]) for p in path] for path in entry.get("paths", [])]
    feat_raw = entry.get("features", {})
    features = StructuralFeatures(
        symmetry_score=float(feat_raw.get("symmetry_score", 0.5)),
        junction_count=int(feat_raw.get("junction_count", 0)),
        stroke_complexity=float(feat_raw.get("stroke_complexity", 0.0)),
        path_count=int(feat_raw.get("path_count", 1)),
        total_path_length=float(feat_raw.get("total_path_length", 0.0)),
        bbox_aspect=float(feat_raw.get("bbox_aspect", 1.0)),
        radial_variance=float(feat_raw.get("radial_variance", 0.0)),
    )
    graph_raw = entry.get("graph", {})
    graph = StrokeGraph(
        nodes=[Point2D(n["x"], n["y"]) for n in graph_raw.get("nodes", [])],
        edges=[GraphEdge(**e) for e in graph_raw.get("edges", []) if "source" in e and "target" in e],
    )
    return NormalizedGlyph(
        symbol_id=entry["symbolId"],
        points=pts,
        paths=paths,
        graph=graph,
        features=features,
        point_count=int(entry.get("pointCount", len(pts))),
        resample_count=int(entry.get("resampleCount", 64)),
    )


class StructuralCatalog:
    def __init__(self, manifest_path: Path | None = None) -> None:
        self.path = manifest_path or CATALOG_STRUCTURAL_PATH
        self.glyphs: dict[str, NormalizedGlyph] = {}
        self.tokens: dict[str, TokenAssignment] = {}
        self.manifest: dict = {}
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        self.manifest = json.loads(self.path.read_text(encoding="utf-8"))
        for entry in self.manifest.get("glyphs", []):
            glyph = _glyph_from_dict(entry)
            self.glyphs[glyph.symbol_id] = glyph
        for tok in self.manifest.get("tokens", []):
            sid = tok.get("symbol_id") or tok.get("symbolId")
            self.tokens[sid] = TokenAssignment(
                symbol_id=sid,
                token_id=tok["token_id"],
                cluster_id=int(tok.get("cluster_id", 0)),
                cluster_label=str(tok.get("cluster_label", "")),
                umap_x=float(tok.get("umap_x", 0.0)),
                umap_y=float(tok.get("umap_y", 0.0)),
            )

    def reload(self) -> None:
        self.glyphs.clear()
        self.tokens.clear()
        self._load()

    def match_glyph(self, query: NormalizedGlyph, top_k: int = 5) -> list[StructuralMatch]:
        if not self.glyphs:
            return []
        q_pts = np.array([[p.x, p.y] for p in query.points], dtype=np.float32)
        q_feat = np.array(query.features.as_vector(), dtype=np.float32)

        matches: list[StructuralMatch] = []
        for sid, ref in self.glyphs.items():
            r_pts = np.array([[p.x, p.y] for p in ref.points], dtype=np.float32)
            chamfer = _symmetric_chamfer(q_pts, r_pts)
            r_feat = np.array(ref.features.as_vector(), dtype=np.float32)
            feat_dist = float(np.linalg.norm(q_feat - r_feat))
            confidence = 1.0 / (1.0 + chamfer + 0.1 * feat_dist)
            token = self.tokens.get(sid)
            matches.append(
                StructuralMatch(
                    symbol_id=sid,
                    token_id=token.token_id if token else "GLYPH_UNKNOWN",
                    confidence=confidence,
                    chamfer_distance=chamfer,
                    feature_distance=feat_dist,
                    attributions={
                        **query.features.to_dict(),
                        "matchedFeatures": ref.features.to_dict(),
                    },
                )
            )
        matches.sort(key=lambda m: m.confidence, reverse=True)
        return matches[:top_k]

    def match_bytes(self, image_bytes: bytes, top_k: int = 5) -> list[StructuralMatch]:
        query = vectorize_bytes(image_bytes)
        return self.match_glyph(query, top_k=top_k)


def _symmetric_chamfer(a: np.ndarray, b: np.ndarray) -> float:
    if len(a) == 0 or len(b) == 0:
        return 999.0
    return (_directed_chamfer(a, b) + _directed_chamfer(b, a)) / 2.0


def _directed_chamfer(src: np.ndarray, dst: np.ndarray) -> float:
    total = 0.0
    for p in src:
        dists = np.sqrt(((dst - p) ** 2).sum(axis=1))
        total += float(dists.min())
    return total / len(src)
