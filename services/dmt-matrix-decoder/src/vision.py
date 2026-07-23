"""Gemini / Grok vision analysis for laser diffraction matrix photos."""
from __future__ import annotations

import base64
import json
import re

import requests

from .config import GEMINI_API_KEY, GEMINI_VISION_MODEL, GROK_BASE_URL, GROK_VISION_MODEL, XAI_API_KEY

VISION_PROMPT = """You are the DMT Matrix Decoder — a pioneer AI system analyzing photos of 650nm laser diffraction patterns and reported DMT visual glyphs.

Study the image and return ONLY valid JSON (no markdown) with this schema:
{
  "summary": "1-2 sentence overview of the matrix / pattern",
  "matrixStructure": "grid|scattered|linear|mandala|unknown",
  "laserArtifacts": ["list of non-symbol laser/diffraction artifacts you see"],
  "symbols": [
    {
      "label": "short name for the glyph",
      "description": "what it looks like",
      "catalogGuess": "best matching id from known catalogue if any, else null",
      "confidence": 0.0-1.0,
      "x": 0.0-1.0 normalized left,
      "y": 0.0-1.0 normalized top,
      "width": 0.0-1.0 normalized width,
      "height": 0.0-1.0 normalized height
    }
  ],
  "decodeNotes": "hypothesis about what the sequence might encode",
  "researchFlags": ["anomalies or high-confidence observations worth logging"]
}

Known catalogue ids (if visible): symbol_001, symbol_002, symbol_003, symbol_004, hex_lattice, mandala_8, binary_bars, katakana_grid, dna_spiral, triangle_nested, circle_concentric, chevron_stack, wave_interference, diamond_lattice, arrow_radial, bracket_pair, infinity_loop, star_pentagram, eye_motif, ladder_rungs, portal_arch, cube_wireframe, flower_6, zigzag_lightning.

Be conservative with confidence. Separate true glyphs from laser speckle, bloom, and camera noise."""


def _extract_json(text: str) -> dict:
    if not text:
        return {}
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.I)
    body = fenced.group(1) if fenced else text
    start = body.find("{")
    if start < 0:
        return {"raw": text}
    slice_ = body[start:]
    try:
        return json.loads(slice_)
    except json.JSONDecodeError:
        end = slice_.rfind("}")
        if end > 0:
            try:
                return json.loads(slice_[: end + 1])
            except json.JSONDecodeError:
                pass
    return {"raw": text}


def analyze_with_gemini(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_VISION_MODEL,
        contents=[
            {"role": "user", "parts": [
                {"text": VISION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode("ascii")}},
            ]},
        ],
        config={"temperature": 0.2, "response_mime_type": "application/json"},
    )
    text = (response.text or "").strip()
    parsed = _extract_json(text)
    parsed["provider"] = "gemini"
    parsed["model"] = GEMINI_VISION_MODEL
    return parsed


def analyze_with_grok(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    if not XAI_API_KEY:
        raise RuntimeError("XAI_API_KEY not configured")
    b64 = base64.b64encode(image_bytes).decode("ascii")
    payload = {
        "model": GROK_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": VISION_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                ],
            }
        ],
        "temperature": 0.2,
        "max_tokens": 4096,
    }
    res = requests.post(
        f"{GROK_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    data = res.json()
    if not res.ok:
        raise RuntimeError(data.get("error", {}).get("message") or f"Grok vision error {res.status_code}")
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    parsed = _extract_json(text)
    parsed["provider"] = "grok"
    parsed["model"] = GROK_VISION_MODEL
    return parsed


def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg", provider: str = "auto") -> dict:
    provider = (provider or "auto").lower()
    if provider == "grok":
        return analyze_with_grok(image_bytes, mime_type)
    if provider == "gemini":
        return analyze_with_gemini(image_bytes, mime_type)

    # auto: Gemini first, Grok fallback
    if GEMINI_API_KEY:
        try:
            return analyze_with_gemini(image_bytes, mime_type)
        except Exception as gemini_err:
            if XAI_API_KEY:
                out = analyze_with_grok(image_bytes, mime_type)
                out["geminiFallbackReason"] = str(gemini_err)
                return out
            raise
    if XAI_API_KEY:
        return analyze_with_grok(image_bytes, mime_type)
    raise RuntimeError("No vision API key configured (GEMINI_API_KEY or XAI_API_KEY)")
