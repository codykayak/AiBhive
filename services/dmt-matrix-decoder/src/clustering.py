"""UMAP + HDBSCAN clustering and canonical Token ID assignment."""
from __future__ import annotations

from typing import Any

import numpy as np

from .types import StructuralEmbedding, TokenAssignment

try:
    import hdbscan
    import umap
except ImportError:
    hdbscan = None  # type: ignore
    umap = None  # type: ignore


def _pad_vectors(embeddings: list[StructuralEmbedding]) -> np.ndarray:
    max_dim = max(len(e.vector) for e in embeddings) if embeddings else 16
    mat = np.zeros((len(embeddings), max_dim), dtype=np.float32)
    for i, emb in enumerate(embeddings):
        v = emb.vector[:max_dim]
        mat[i, : len(v)] = v
    return mat


def assign_tokens(
    embeddings: list[StructuralEmbedding],
    min_cluster_size: int = 2,
    n_neighbors: int = 5,
) -> tuple[list[TokenAssignment], dict[str, Any]]:
    """
    Cluster structural embeddings and assign GLYPH_XXXX token IDs.
    Falls back to per-symbol tokens when clustering libs unavailable or N too small.
    """
    if not embeddings:
        return [], {"method": "empty", "clusterCount": 0}

    symbol_ids = [e.symbol_id for e in embeddings]
    matrix = _pad_vectors(embeddings)

    # Small catalogue: skip UMAP/HDBSCAN, assign tokens by sorted symbol id
    if len(embeddings) < 4 or umap is None or hdbscan is None:
        assignments = [
            TokenAssignment(
                symbol_id=emb.symbol_id,
                token_id=f"GLYPH_{i + 1:04d}",
                cluster_id=i,
                cluster_label=f"singleton_{i}",
                umap_x=0.0,
                umap_y=0.0,
            )
            for i, emb in enumerate(embeddings)
        ]
        return assignments, {"method": "sequential_fallback", "clusterCount": len(embeddings)}

    n_neighbors = min(n_neighbors, len(embeddings) - 1)
    reducer = umap.UMAP(n_components=2, n_neighbors=max(2, n_neighbors), min_dist=0.1, metric="cosine", random_state=42)
    coords = reducer.fit_transform(matrix)

    clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, metric="euclidean")
    labels = clusterer.fit_predict(coords)

    # Noise points (-1) get individual clusters
    next_cluster = int(labels.max()) + 1
    for i, lbl in enumerate(labels):
        if lbl == -1:
            labels[i] = next_cluster
            next_cluster += 1

    # Order clusters by size for stable GLYPH IDs
    unique, counts = np.unique(labels, return_counts=True)
    cluster_order = {c: rank for rank, c in enumerate(unique[np.argsort(-counts)])}

    assignments: list[TokenAssignment] = []
    token_counter: dict[int, int] = {}

    for i, emb in enumerate(embeddings):
        cid = int(labels[i])
        rank = cluster_order[cid]
        token_counter[rank] = token_counter.get(rank, 0) + 1
        token_id = f"GLYPH_{rank + 1:04d}"
        assignments.append(
            TokenAssignment(
                symbol_id=emb.symbol_id,
                token_id=token_id,
                cluster_id=cid,
                cluster_label=f"cluster_{cid}",
                umap_x=float(coords[i, 0]),
                umap_y=float(coords[i, 1]),
            )
        )

    meta = {
        "method": "umap_hdbscan",
        "clusterCount": len(set(labels)),
        "noiseRelabeled": int((clusterer.labels_ == -1).sum()) if hasattr(clusterer, "labels_") else 0,
        "umapShape": list(coords.shape),
    }
    return assignments, meta
