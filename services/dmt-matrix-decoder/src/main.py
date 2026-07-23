"""Flask entrypoint for DMT Matrix Decoder Cloud Run worker."""
from __future__ import annotations

import base64
import os
import sys
from functools import wraps

from flask import Flask, jsonify, request

# Allow `python src/main.py` and gunicorn `src.main:app`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.classifier import GlyphClassifier
from src.config import WORKER_SECRET
from src.vision import analyze_image

app = Flask(__name__)
_classifier: GlyphClassifier | None = None


def get_classifier() -> GlyphClassifier:
    global _classifier
    if _classifier is None:
        _classifier = GlyphClassifier()
    return _classifier


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
        return jsonify({
            "ok": True,
            "service": "dmt-matrix-decoder",
            "symbolCount": len(clf.templates),
        })
    except Exception as err:
        return jsonify({"ok": False, "error": str(err)}), 500


@app.get("/catalog")
def catalog():
    clf = get_classifier()
    return jsonify(clf.catalog())


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
    """Full pipeline: CV classifier + optional vision LLM."""
    payload = request.get_json(silent=True) or {}
    image_b64 = payload.get("imageBase64") or payload.get("image")
    if not image_b64:
        return jsonify({"error": "imageBase64 required"}), 400

    mime_type = payload.get("mimeType") or "image/jpeg"
    use_vision = payload.get("useVision", True)
    vision_provider = payload.get("visionProvider", "auto")

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        return jsonify({"error": "Invalid base64 image"}), 400

    clf = get_classifier()
    cv_detections = [d.to_dict() for d in clf.classify_bytes(image_bytes)]

    vision_result = None
    vision_error = None
    if use_vision:
        try:
            vision_result = analyze_image(image_bytes, mime_type=mime_type, provider=vision_provider)
        except Exception as err:
            vision_error = str(err)

    merged = _merge_detections(cv_detections, vision_result, image_bytes)

    return jsonify({
        "cvDetections": cv_detections,
        "vision": vision_result,
        "visionError": vision_error,
        "merged": merged,
        "symbolCount": len(clf.templates),
    })


def _merge_detections(cv: list[dict], vision: dict | None, image_bytes: bytes) -> list[dict]:
    """Fuse CV template hits with vision LLM symbol positions."""
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    merged: list[dict] = []
    seen: set[str] = set()

    for det in cv:
        key = f"{det['symbolId']}:{det['x']}:{det['y']}"
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
            "normalized": {"x": nx, "y": ny, "width": nw, "height": nh},
        })

    merged.sort(key=lambda d: d.get("confidence", 0), reverse=True)
    return merged


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
