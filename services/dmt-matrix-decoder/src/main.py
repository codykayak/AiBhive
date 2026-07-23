"""Flask entrypoint for DMT Matrix Decoder Cloud Run worker."""
from __future__ import annotations

import base64
import os
import sys
from functools import wraps

from flask import Flask, jsonify, request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.classifier import GlyphClassifier
from src.config import WORKER_SECRET
from src.pipeline import load_structural_manifest
from src.structural_match import StructuralCatalog
from src.syntax import analyze_sequence
from src.vectorize import vectorize_bytes, vectorize_png
from src.vision import analyze_image

app = Flask(__name__)
_classifier: GlyphClassifier | None = None
_structural: StructuralCatalog | None = None


def get_classifier() -> GlyphClassifier:
    global _classifier
    if _classifier is None:
        _classifier = GlyphClassifier()
    return _classifier


def get_structural() -> StructuralCatalog:
    global _structural
    if _structural is None:
        _structural = StructuralCatalog()
    return _structural


def require_secret(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if WORKER_SECRET:
            header = request.headers.get("x-dmt-decoder-secret", "")
            if header != WORKER_SECRET:
                return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return wrapper


@app.get("/health")
def health():
    try:
        clf = get_classifier()
        struct = get_structural()
        return jsonify({
            "ok": True,
            "service": "dmt-matrix-decoder",
            "symbolCount": len(clf.templates),
            "structuralGlyphCount": len(struct.glyphs),
            "pipeline": "structural+v1_raster",
        })
    except Exception as err:
        return jsonify({"ok": False, "error": str(err)}), 500


@app.get("/catalog")
def catalog():
    clf = get_classifier()
    return jsonify(clf.catalog())


@app.get("/structural/catalog")
def structural_catalog():
    manifest = load_structural_manifest()
    if not manifest:
        return jsonify({"error": "Structural manifest not built. Run build_structural_catalog.py"}), 404
    return jsonify(manifest)


@app.post("/structural/match")
@require_secret
def structural_match():
    payload = request.get_json(silent=True) or {}
    image_b64 = payload.get("imageBase64") or payload.get("image")
    top_k = int(payload.get("topK") or 5)
    if not image_b64:
        return jsonify({"error": "imageBase64 required"}), 400
    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        return jsonify({"error": "Invalid base64 image"}), 400

    struct = get_structural()
    if not struct.glyphs:
        return jsonify({"error": "Structural catalogue empty"}), 503

    query = vectorize_bytes(image_bytes)
    matches = [m.to_dict() for m in struct.match_glyph(query, top_k=top_k)]
    return jsonify({
        "query": query.to_dict(),
        "matches": matches,
        "count": len(matches),
    })


@app.post("/structural/analyze-sequence")
@require_secret
def structural_analyze_sequence():
    """Syntactic analysis on a token sequence + 2D positions from a laser photo."""
    payload = request.get_json(silent=True) or {}
    tokens = payload.get("tokens") or payload.get("tokenIds") or []
    positions = payload.get("positions") or []
    if not tokens:
        return jsonify({"error": "tokens array required"}), 400

    analysis = analyze_sequence(tokens, positions)
    return jsonify(analysis.to_dict())


@app.post("/classify")
@require_secret
def classify():
    payload = request.get_json(silent=True) or {}
    image_b64 = payload.get("imageBase64") or payload.get("image")
    if not image_b64:
        return jsonify({"error": "imageBase64 required"}), 400
    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        return jsonify({"error": "Invalid base64 image"}), 400

    clf = get_classifier()
    detections = [d.to_dict() for d in clf.classify_bytes(image_bytes)]
    return jsonify({"detections": detections, "count": len(detections)})


@app.post("/decode")
@require_secret
def decode():
    """Full pipeline: structural match + raster CV + optional vision LLM."""
    payload = request.get_json(silent=True) or {}
    image_b64 = payload.get("imageBase64") or payload.get("image")
    if not image_b64:
        return jsonify({"error": "imageBase64 required"}), 400

    mime_type = payload.get("mimeType") or "image/jpeg"
    use_vision = payload.get("useVision", True)
    use_structural = payload.get("useStructural", True)
    vision_provider = payload.get("visionProvider", "auto")

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        return jsonify({"error": "Invalid base64 image"}), 400

    clf = get_classifier()
    cv_detections = [d.to_dict() for d in clf.classify_bytes(image_bytes)]

    structural_matches: list[dict] = []
    structural_error = None
    if use_structural:
        try:
            struct = get_structural()
            if struct.glyphs:
                query = vectorize_bytes(image_bytes)
                structural_matches = [m.to_dict() for m in struct.match_glyph(query, top_k=8)]
            else:
                structural_error = "Structural catalogue not built"
        except Exception as err:
            structural_error = str(err)

    vision_result = None
    vision_error = None
    if use_vision:
        try:
            vision_result = analyze_image(image_bytes, mime_type=mime_type, provider=vision_provider)
        except Exception as err:
            vision_error = str(err)

    merged = _merge_detections(cv_detections, vision_result, image_bytes, structural_matches)
    syntax = None
    if merged:
        tokens = [d.get("tokenId") or d.get("symbolId", "UNK") for d in merged]
        positions = [d.get("normalized") or {} for d in merged]
        syntax = analyze_sequence(tokens, positions).to_dict()

    return jsonify({
        "cvDetections": cv_detections,
        "structuralMatches": structural_matches,
        "structuralError": structural_error,
        "vision": vision_result,
        "visionError": vision_error,
        "merged": merged,
        "syntax": syntax,
        "symbolCount": len(clf.templates),
    })


def _merge_detections(
    cv: list[dict],
    vision: dict | None,
    image_bytes: bytes,
    structural: list[dict],
) -> list[dict]:
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    merged: list[dict] = []
    seen: set[str] = set()

    # Structural matches first (higher research priority)
    for det in structural:
        key = f"struct:{det['symbolId']}"
        if key in seen:
            continue
        seen.add(key)
        merged.append({
            "symbolId": det["symbolId"],
            "tokenId": det.get("tokenId"),
            "name": det["symbolId"],
            "confidence": det["confidence"],
            "x": 0,
            "y": 0,
            "width": w,
            "height": h,
            "method": "structural",
            "source": "structural",
            "attributions": det.get("attributions", {}),
            "normalized": {"x": 0, "y": 0, "width": 1, "height": 1},
        })

    for det in cv:
        key = f"{det['symbolId']}:{det['x']}:{det['y']}"
        if key in seen:
            continue
        seen.add(key)
        merged.append({
            **det,
            "source": "classifier",
            "normalized": {
                "x": det["x"] / w,
                "y": det["y"] / h,
                "width": det["width"] / w,
                "height": det["height"] / h,
            },
        })

    for sym in (vision or {}).get("symbols") or []:
        sid = sym.get("catalogGuess") or sym.get("label") or "unknown"
        nx = float(sym.get("x") or 0)
        ny = float(sym.get("y") or 0)
        nw = float(sym.get("width") or 0.1)
        nh = float(sym.get("height") or 0.1)
        px = int(nx * w)
        py = int(ny * h)
        key = f"vision:{sid}:{px}:{py}"
        if key in seen:
            continue
        seen.add(key)
        merged.append({
            "symbolId": sid,
            "name": sym.get("label") or sid,
            "description": sym.get("description"),
            "confidence": float(sym.get("confidence") or 0.5),
            "x": px,
            "y": py,
            "width": max(8, int(nw * w)),
            "height": max(8, int(nh * h)),
            "method": "vision",
            "source": "vision",
            "attributions": sym.get("attributions") or {},
            "normalized": {"x": nx, "y": ny, "width": nw, "height": nh},
        })

    merged.sort(key=lambda d: d.get("confidence", 0), reverse=True)
    return merged


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
