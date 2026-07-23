"""Structural embeddings via Gemini/Grok vision + feature-vector fallback."""
from __future__ import annotations

import base64
import json
import re
from pathlib import Path

import numpy as np

from .config import GEMINI_API_KEY, GEMINI_VISION_MODEL, GROK_BASE_URL, GROK_VISION_MODEL, XAI_API_KEY
from .types import NormalizedGlyph, StructuralEmbedding

STRUCTURAL_PROMPT = """Analyze this normalized DMT laser glyph as a STRUCTURAL symbol (not raster pixels).

Return ONLY valid JSON:
{
  "embedding": [list of 16 floats between -1 and 1 capturing structural topology],
  "confidence": 0.0-1.0,
  "attributions": {
    "symmetry": 0.0-1.0,
    "junctionCount": integer,
    "strokeComplexity": 0.0-1.0,
    "radialOrder": 0.0-1.0,
    "angularVariance": 0.0-1.0,
    "topologyClass": "linear|radial|grid|loop|compound|unknown"
  }
}

Focus on stroke topology, junctions, symmetry axes, and spatial graph structure."""


def _extract_json(text: str) -> dict:
    if not text:
        return {}
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.I)
    body = fenced.group(1) if fenced else text
    start = body.find("{")
    if start < 0:
        return {}
    try:
        return json.loads(body[start:])
    except json.JSONDecodeError:
        end = body.rfind("}")
        if end > start:
            try:
                return json.loads(body[start : end + 1])
            except json.JSONDecodeError:
                pass
    return {}


def feature_fallback_embedding(glyph: NormalizedGlyph) -> StructuralEmbedding:
    """Deterministic embedding from normalized points + structural features."""
    pts = np.array([[p.x, p.y] for p in glyph.points], dtype=np.float32)
    # Subsample to 8 summary statistics + 7 feature dims + 1 path count = 16
    if len(pts) >= 8:
        idx = np.linspace(0, len(pts) - 1, 8, dtype=int)
        summary = pts[idx].flatten()
    else:
        summary = np.zeros(16, dtype=np.float32)
        summary[: len(pts.flatten())] = pts.flatten()

    feat = np.array(glyph.features.as_vector(), dtype=np.float32)
    # Pad/truncate to 16 dims
    vec = np.zeros(16, dtype=np.float32)
    vec[:8] = summary[:8]
    vec[8:15] = feat[:7]
    vec[15] = float(glyph.features.path_count) / 10.0
    # L2 normalize
    norm = np.linalg.norm(vec)
    if norm > 1e-6:
        vec = vec / norm

    return StructuralEmbedding(
        symbol_id=glyph.symbol_id,
        provider="feature_fallback",
        model="structural-v1",
        vector=vec.tolist(),
        attributions={
            **glyph.features.to_dict(),
            "topologyClass": _topology_class(glyph),
        },
        confidence=0.75,
    )


def _topology_class(glyph: NormalizedGlyph) -> str:
    f = glyph.features
    if f.junction_count >= 4:
        return "grid"
    if f.symmetry_score > 0.85 and f.radial_variance > 0.01:
        return "radial"
    if f.stroke_complexity > 2.5:
        return "compound"
    if f.path_count <= 2 and f.junction_count <= 1:
        return "linear"
    if f.total_path_length > 80 and f.symmetry_score > 0.7:
        return "loop"
    return "unknown"


def embed_glyph_from_png(png_path: Path, glyph: NormalizedGlyph, provider: str = "auto") -> StructuralEmbedding:
    """Generate multimodal embedding; falls back to feature vector."""
    image_bytes = png_path.read_bytes()
    mime = "image/png"

    if provider in ("auto", "gemini") and GEMINI_API_KEY:
        try:
            return _gemini_embed(png_path, glyph, image_bytes, mime)
        except Exception:
            if provider == "gemini":
                raise

    if provider in ("auto", "grok") and XAI_API_KEY:
        try:
            return _grok_embed(png_path, glyph, image_bytes, mime)
        except Exception:
            if provider == "grok":
                raise

    return feature_fallback_embedding(glyph)


def _gemini_embed(png_path: Path, glyph: NormalizedGlyph, image_bytes: bytes, mime: str) -> StructuralEmbedding:
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_VISION_MODEL,
        contents=[
            {
                "role": "user",
                "parts": [
                    {"text": STRUCTURAL_PROMPT},
                    {"inline_data": {"mime_type": mime, "data": base64.b64encode(image_bytes).decode("ascii")}},
                ],
            }
        ],
        config={"temperature": 0.1, "response_mime_type": "application/json"},
    )
    parsed = _extract_json(response.text or "")
    vec = parsed.get("embedding") or []
    if len(vec) < 8:
        base = feature_fallback_embedding(glyph)
        vec = base.vector
    return StructuralEmbedding(
        symbol_id=glyph.symbol_id,
        provider="gemini",
        model=GEMINI_VISION_MODEL,
        vector=[float(v) for v in vec[:32]],
        attributions=parsed.get("attributions") or glyph.features.to_dict(),
        confidence=float(parsed.get("confidence") or 0.85),
    )


def _grok_embed(png_path: Path, glyph: NormalizedGlyph, image_bytes: bytes, mime: str) -> StructuralEmbedding:
    import requests

    b64 = base64.b64encode(image_bytes).decode("ascii")
    payload = {
        "model": GROK_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": STRUCTURAL_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                ],
            }
        ],
        "temperature": 0.1,
        "max_tokens": 2048,
    }
    res = requests.post(
        f"{GROK_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=90,
    )
    data = res.json()
    if not res.ok:
        raise RuntimeError(data.get("error", {}).get("message") or f"Grok error {res.status_code}")
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    parsed = _extract_json(text)
    vec = parsed.get("embedding") or []
    if len(vec) < 8:
        base = feature_fallback_embedding(glyph)
        vec = base.vector
    return StructuralEmbedding(
        symbol_id=glyph.symbol_id,
        provider="grok",
        model=GROK_VISION_MODEL,
        vector=[float(v) for v in vec[:32]],
        attributions=parsed.get("attributions") or glyph.features.to_dict(),
        confidence=float(parsed.get("confidence") or 0.85),
    )
