"""Vector standardization: PNG glyphs → normalized paths + stroke graphs."""
from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from .types import GraphEdge, NormalizedGlyph, Point2D, StrokeGraph, StructuralFeatures

DEFAULT_RESAMPLE = 64
EPSILON_RATIO = 0.01


def _load_binary_mask(path: Path, size: int = 100) -> np.ndarray:
    img = Image.open(path).convert("L")
    arr = np.array(img.resize((size, size), Image.Resampling.LANCZOS))
    # Dark background + bright strokes (catalogue convention)
    _, mask = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if mask.mean() > 127:
        mask = 255 - mask
    return mask


def _arc_length_resample(pts: np.ndarray, n: int) -> np.ndarray:
    """Resample polyline to n equidistant points."""
    if len(pts) < 2:
        return np.tile(pts[0] if len(pts) else [0, 0], (n, 1)).astype(np.float32)

    seg_lens = np.sqrt(((pts[1:] - pts[:-1]) ** 2).sum(axis=1))
    total = float(seg_lens.sum())
    if total < 1e-6:
        return np.tile(pts[0], (n, 1)).astype(np.float32)

    cum = np.concatenate([[0.0], np.cumsum(seg_lens)])
    targets = np.linspace(0, total, n, endpoint=False)
    out = np.zeros((n, 2), dtype=np.float32)
    j = 0
    for i, t in enumerate(targets):
        while j < len(seg_lens) - 1 and cum[j + 1] < t:
            j += 1
        seg_len = seg_lens[j] if seg_lens[j] > 1e-6 else 1e-6
        alpha = (t - cum[j]) / seg_len
        out[i] = pts[j] * (1 - alpha) + pts[j + 1] * alpha
    return out


def _normalize_points(pts: np.ndarray) -> np.ndarray:
    """Center to origin and scale to unit bounding box mapped to [-1, 1]."""
    if len(pts) == 0:
        return pts
    centered = pts - pts.mean(axis=0)
    min_xy = centered.min(axis=0)
    max_xy = centered.max(axis=0)
    span = max(float(max_xy.max() - min_xy.min()), 1e-6)
    scaled = (centered / span) * 2.0
    return scaled.astype(np.float32)


def _extract_paths(mask: np.ndarray) -> list[np.ndarray]:
    contours, _ = cv2.findContours(mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    paths: list[np.ndarray] = []
    for cnt in contours:
        if len(cnt) < 4:
            continue
        peri = cv2.arcLength(cnt, False)
        approx = cv2.approxPolyDP(cnt, EPSILON_RATIO * peri, False)
        pts = approx.reshape(-1, 2).astype(np.float32)
        if len(pts) >= 2:
            paths.append(pts)
    if not paths:
        ys, xs = np.where(mask > 0)
        if len(xs) > 4:
            order = np.argsort(xs + ys * mask.shape[1])
            paths.append(np.column_stack([xs[order], ys[order]]).astype(np.float32))
    return paths


def _build_graph(paths: list[np.ndarray], resample_per_path: int) -> StrokeGraph:
    nodes: list[Point2D] = []
    edges: list[GraphEdge] = []
    node_index = 0

    for path in paths:
        resampled = _arc_length_resample(path, max(8, resample_per_path // max(len(paths), 1)))
        start_idx = node_index
        for pt in resampled:
            nodes.append(Point2D(float(pt[0]), float(pt[1])))
            node_index += 1
        for i in range(start_idx, node_index - 1):
            a = nodes[i]
            b = nodes[i + 1]
            length = math.hypot(b.x - a.x, b.y - a.y)
            edges.append(GraphEdge(source=i, target=i + 1, length=length))
    return StrokeGraph(nodes=nodes, edges=edges)


def _compute_features(paths: list[np.ndarray], mask: np.ndarray, graph: StrokeGraph) -> StructuralFeatures:
    h, w = mask.shape
    total_len = sum(float(cv2.arcLength(p.reshape(-1, 1, 2), False)) for p in paths)
    path_count = max(len(paths), 1)
    bbox_aspect = w / max(h, 1)

    # Symmetry: compare left vs right half pixel mass
    mid = w // 2
    left = mask[:, :mid].astype(np.float32)
    right = np.fliplr(mask[:, mid:]).astype(np.float32)
    min_w = min(left.shape[1], right.shape[1])
    if min_w > 0:
        l = left[:, :min_w].sum()
        r = right[:, :min_w].sum()
        symmetry = 1.0 - abs(l - r) / max(l + r, 1.0)
    else:
        symmetry = 0.5

    # Junction estimate: count path endpoints that are near other path endpoints
    junction_count = 0
    endpoints: list[tuple[float, float]] = []
    for path in paths:
        if len(path) >= 2:
            endpoints.append((float(path[0][0]), float(path[0][1])))
            endpoints.append((float(path[-1][0]), float(path[-1][1])))
    thresh = max(3.0, min(h, w) * 0.08)
    for i, a in enumerate(endpoints):
        for b in endpoints[i + 1 :]:
            if math.hypot(a[0] - b[0], a[1] - b[1]) < thresh:
                junction_count += 1

    stroke_complexity = total_len / max(math.hypot(w, h), 1.0)

    # Radial variance of resampled nodes
    if graph.nodes:
        cx = sum(n.x for n in graph.nodes) / len(graph.nodes)
        cy = sum(n.y for n in graph.nodes) / len(graph.nodes)
        radii = [math.hypot(n.x - cx, n.y - cy) for n in graph.nodes]
        radial_variance = float(np.var(radii)) if radii else 0.0
    else:
        radial_variance = 0.0

    return StructuralFeatures(
        symmetry_score=round(symmetry, 4),
        junction_count=junction_count,
        stroke_complexity=round(stroke_complexity, 4),
        path_count=path_count,
        total_path_length=round(total_len, 4),
        bbox_aspect=round(bbox_aspect, 4),
        radial_variance=round(radial_variance, 4),
    )


def vectorize_png(path: Path, symbol_id: str | None = None, resample: int = DEFAULT_RESAMPLE) -> NormalizedGlyph:
    """Convert a 100×100 PNG glyph to a normalized vector representation."""
    sid = symbol_id or path.stem
    mask = _load_binary_mask(path)
    raw_paths = _extract_paths(mask)

    normalized_paths: list[list[Point2D]] = []
    all_pts: list[np.ndarray] = []
    per_path = max(8, resample // max(len(raw_paths), 1))

    for path in raw_paths:
        resampled = _arc_length_resample(path, per_path)
        norm = _normalize_points(resampled)
        normalized_paths.append([Point2D(float(p[0]), float(p[1])) for p in norm])
        all_pts.append(norm)

    if all_pts:
        combined = np.vstack(all_pts)
        master = _arc_length_resample(combined, resample)
        master_norm = _normalize_points(master)
        points = [Point2D(float(p[0]), float(p[1])) for p in master_norm]
    else:
        points = [Point2D(0.0, 0.0)] * resample

    graph = _build_graph(raw_paths, resample)
    # Re-normalize graph nodes to same space as points
    if graph.nodes:
        g_arr = np.array([[n.x, n.y] for n in graph.nodes], dtype=np.float32)
        g_norm = _normalize_points(g_arr)
        graph = StrokeGraph(
            nodes=[Point2D(float(p[0]), float(p[1])) for p in g_norm],
            edges=graph.edges,
        )

    features = _compute_features(raw_paths, mask, graph)

    return NormalizedGlyph(
        symbol_id=sid,
        points=points,
        paths=normalized_paths,
        graph=graph,
        features=features,
        point_count=len(points),
        resample_count=resample,
    )


def vectorize_bytes(image_bytes: bytes, symbol_id: str = "query", resample: int = DEFAULT_RESAMPLE) -> NormalizedGlyph:
    """Vectorize an uploaded image region (bytes)."""
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if bgr is None:
        raise ValueError("Could not decode image")
    tmp = Path("/tmp/_dmt_query.png")
    cv2.imwrite(str(tmp), bgr)
    return vectorize_png(tmp, symbol_id=symbol_id, resample=resample)
