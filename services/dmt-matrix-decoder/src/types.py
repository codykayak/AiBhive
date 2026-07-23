"""Typed models for structural DMT glyph analysis."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Point2D:
    x: float
    y: float

    def as_tuple(self) -> tuple[float, float]:
        return (self.x, self.y)

    def to_dict(self) -> dict[str, float]:
        return {"x": float(self.x), "y": float(self.y)}


@dataclass
class GraphEdge:
    source: int
    target: int
    length: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {"source": int(self.source), "target": int(self.target), "length": float(self.length)}


@dataclass
class StrokeGraph:
    """Nodes + edges representation of a glyph skeleton."""

    nodes: list[Point2D] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
        }


@dataclass
class StructuralFeatures:
    """Attribution features for structured JSON output."""

    symmetry_score: float
    junction_count: int
    stroke_complexity: float
    path_count: int
    total_path_length: float
    bbox_aspect: float
    radial_variance: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "symmetry_score": float(self.symmetry_score),
            "junction_count": int(self.junction_count),
            "stroke_complexity": float(self.stroke_complexity),
            "path_count": int(self.path_count),
            "total_path_length": float(self.total_path_length),
            "bbox_aspect": float(self.bbox_aspect),
            "radial_variance": float(self.radial_variance),
        }

    def as_vector(self) -> list[float]:
        return [
            float(self.symmetry_score),
            float(self.junction_count),
            float(self.stroke_complexity),
            float(self.path_count),
            float(self.total_path_length),
            float(self.bbox_aspect),
            float(self.radial_variance),
        ]


@dataclass
class NormalizedGlyph:
    """Vector-standardized glyph ready for matching and clustering."""

    symbol_id: str
    points: list[Point2D]  # resampled equidistant sequence, centered, scaled to [-1,1]
    paths: list[list[Point2D]]  # individual stroke paths
    graph: StrokeGraph
    features: StructuralFeatures
    point_count: int
    resample_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "symbolId": self.symbol_id,
            "pointCount": self.point_count,
            "resampleCount": self.resample_count,
            "points": [p.to_dict() for p in self.points],
            "paths": [[p.to_dict() for p in path] for path in self.paths],
            "graph": self.graph.to_dict(),
            "features": self.features.to_dict(),
        }

    def flat_points(self) -> list[float]:
        out: list[float] = []
        for p in self.points:
            out.extend([p.x, p.y])
        return out


@dataclass
class StructuralEmbedding:
    symbol_id: str
    provider: str
    model: str
    vector: list[float]
    attributions: dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "symbolId": self.symbol_id,
            "provider": self.provider,
            "model": self.model,
            "vector": self.vector,
            "attributions": self.attributions,
            "confidence": self.confidence,
        }


@dataclass
class TokenAssignment:
    symbol_id: str
    token_id: str  # e.g. GLYPH_0042
    cluster_id: int
    cluster_label: str
    umap_x: float = 0.0
    umap_y: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "symbol_id": self.symbol_id,
            "token_id": self.token_id,
            "cluster_id": int(self.cluster_id),
            "cluster_label": self.cluster_label,
            "umap_x": float(self.umap_x),
            "umap_y": float(self.umap_y),
        }


@dataclass
class StructuralMatch:
    symbol_id: str
    token_id: str
    confidence: float
    chamfer_distance: float
    feature_distance: float
    attributions: dict[str, Any]
    method: str = "structural"

    def to_dict(self) -> dict[str, Any]:
        return {
            "symbolId": self.symbol_id,
            "tokenId": self.token_id,
            "confidence": round(self.confidence, 4),
            "chamferDistance": round(self.chamfer_distance, 4),
            "featureDistance": round(self.feature_distance, 4),
            "attributions": self.attributions,
            "method": self.method,
        }


@dataclass
class SyntaxAnalysis:
    token_sequence: list[str]
    shannon_entropy: float
    bigram_matrix: dict[str, dict[str, float]]
    trigram_counts: dict[str, int]
    spatial_graph: dict[str, Any]
    ngram_order: int = 2

    def to_dict(self) -> dict[str, Any]:
        return {
            "tokenSequence": self.token_sequence,
            "shannonEntropy": round(self.shannon_entropy, 4),
            "bigramMatrix": self.bigram_matrix,
            "trigramCounts": self.trigram_counts,
            "spatialGraph": self.spatial_graph,
            "ngramOrder": self.ngram_order,
        }
