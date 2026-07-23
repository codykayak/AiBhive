"""Syntactic analysis: entropy, n-grams, spatial relationship graphs."""
from __future__ import annotations

import math
from collections import Counter, defaultdict
from typing import Any

from .types import SyntaxAnalysis


def shannon_entropy(tokens: list[str]) -> float:
    if not tokens:
        return 0.0
    counts = Counter(tokens)
    n = len(tokens)
    entropy = 0.0
    for c in counts.values():
        p = c / n
        entropy -= p * math.log2(p)
    return entropy


def bigram_transition_matrix(tokens: list[str]) -> dict[str, dict[str, float]]:
    """Row-normalized bigram transition probabilities."""
    if len(tokens) < 2:
        return {}
    counts: dict[str, Counter] = defaultdict(Counter)
    for a, b in zip(tokens, tokens[1:]):
        counts[a][b] += 1
    matrix: dict[str, dict[str, float]] = {}
    for src, dst_counts in counts.items():
        total = sum(dst_counts.values())
        matrix[src] = {dst: round(c / total, 4) for dst, c in dst_counts.items()}
    return matrix


def ngram_counts(tokens: list[str], n: int = 3) -> dict[str, int]:
    if len(tokens) < n:
        return {}
    grams = [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]
    return {"|".join(g): c for g, c in Counter(grams).items()}


def spatial_relationship_graph(
    tokens: list[str],
    positions: list[dict[str, float]],
    proximity_threshold: float = 0.25,
) -> dict[str, Any]:
    """
    Build a 2D spatial graph from token positions (normalized 0-1 coords).
    Nodes = tokens; edges = proximity + directional relations.
    """
    nodes = []
    for i, (tok, pos) in enumerate(zip(tokens, positions)):
        nodes.append({
            "id": f"n{i}",
            "tokenId": tok,
            "x": float(pos.get("x", 0)),
            "y": float(pos.get("y", 0)),
            "width": float(pos.get("width", 0.1)),
            "height": float(pos.get("height", 0.1)),
        })

    edges = []
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            a, b = nodes[i], nodes[j]
            dx = b["x"] - a["x"]
            dy = b["y"] - a["y"]
            dist = math.hypot(dx, dy)
            if dist <= proximity_threshold:
                relation = _spatial_relation(dx, dy)
                edges.append({
                    "source": a["id"],
                    "target": b["id"],
                    "distance": round(dist, 4),
                    "relation": relation,
                    "weight": round(1.0 - dist / max(proximity_threshold, 1e-6), 4),
                })

    return {
        "nodes": nodes,
        "edges": edges,
        "nodeCount": len(nodes),
        "edgeCount": len(edges),
        "layoutType": _infer_layout_type(nodes, edges),
    }


def _spatial_relation(dx: float, dy: float) -> str:
    if abs(dx) < 0.05 and abs(dy) < 0.05:
        return "overlap"
    if abs(dx) > abs(dy):
        return "right_of" if dx > 0 else "left_of"
    return "below" if dy > 0 else "above"


def _infer_layout_type(nodes: list[dict], edges: list[dict]) -> str:
    if len(nodes) <= 1:
        return "singleton"
    xs = [n["x"] for n in nodes]
    ys = [n["y"] for n in nodes]
    x_var = max(xs) - min(xs)
    y_var = max(ys) - min(ys)
    avg_degree = (2 * len(edges)) / max(len(nodes), 1)
    if avg_degree >= 2.5:
        return "grid"
    if x_var > 0.5 and y_var < 0.2:
        return "linear_horizontal"
    if y_var > 0.5 and x_var < 0.2:
        return "linear_vertical"
    if x_var > 0.3 and y_var > 0.3:
        return "scattered"
    return "clustered"


def analyze_sequence(
    tokens: list[str],
    positions: list[dict[str, float]] | None = None,
    ngram_order: int = 3,
) -> SyntaxAnalysis:
    """Full syntactic analysis of a token sequence from a laser matrix photo."""
    positions = positions or [{"x": i / max(len(tokens), 1), "y": 0.5, "width": 0.1, "height": 0.1} for i in range(len(tokens))]
    return SyntaxAnalysis(
        token_sequence=tokens,
        shannon_entropy=shannon_entropy(tokens),
        bigram_matrix=bigram_transition_matrix(tokens),
        trigram_counts=ngram_counts(tokens, n=ngram_order),
        spatial_graph=spatial_relationship_graph(tokens, positions),
        ngram_order=ngram_order,
    )
