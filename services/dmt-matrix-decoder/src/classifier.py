"""Template-matching glyph classifier for 100×100 DMT laser symbols."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from .config import MANIFEST_PATH, MATCH_THRESHOLD, MAX_DETECTIONS, SYMBOLS_DIR


@dataclass
class GlyphTemplate:
    symbol_id: str
    name: str
    description: str
    tags: list[str]
    vector: np.ndarray  # flattened normalized grayscale
    template: np.ndarray  # 100x100 uint8 for matchTemplate


@dataclass
class Detection:
    symbol_id: str
    name: str
    confidence: float
    x: int
    y: int
    width: int
    height: int
    method: str

    def to_dict(self) -> dict:
        return {
            "symbolId": self.symbol_id,
            "name": self.name,
            "confidence": round(float(self.confidence), 4),
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "method": self.method,
        }


class GlyphClassifier:
    def __init__(self) -> None:
        self.templates: list[GlyphTemplate] = []
        self.manifest: dict = {}
        self._load_catalog()

    def _load_catalog(self) -> None:
        if not MANIFEST_PATH.exists():
            raise FileNotFoundError(f"Catalogue manifest missing: {MANIFEST_PATH}")
        self.manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        meta_by_id = {s["id"]: s for s in self.manifest.get("symbols", [])}

        for path in sorted(SYMBOLS_DIR.glob("*.png")):
            sid = path.stem
            meta = meta_by_id.get(sid, {})
            gray = self._load_gray(path)
            vec = gray.astype(np.float32).flatten()
            vec = (vec - vec.mean()) / (vec.std() + 1e-6)
            self.templates.append(
                GlyphTemplate(
                    symbol_id=sid,
                    name=meta.get("name", sid),
                    description=meta.get("description", ""),
                    tags=meta.get("tags", []),
                    vector=vec,
                    template=gray,
                )
            )

    @staticmethod
    def _load_gray(path: Path) -> np.ndarray:
        img = Image.open(path).convert("L")
        arr = np.array(img.resize((100, 100), Image.Resampling.LANCZOS))
        return arr

    @staticmethod
    def _decode_image(image_bytes: bytes) -> np.ndarray:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("Could not decode image bytes")
        return bgr

    def classify_bytes(self, image_bytes: bytes) -> list[Detection]:
        bgr = self._decode_image(image_bytes)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        detections: list[Detection] = []
        detections.extend(self._sliding_match(gray))
        detections.extend(self._region_match(gray))
        detections.extend(self._global_best(gray))

        # Non-max suppression on overlapping boxes
        merged = self._nms(detections)
        merged.sort(key=lambda d: d.confidence, reverse=True)
        return merged[:MAX_DETECTIONS]

    def _sliding_match(self, gray: np.ndarray) -> list[Detection]:
        out: list[Detection] = []
        h, w = gray.shape
        scales = [0.5, 0.75, 1.0, 1.25] if max(h, w) >= 200 else [0.75, 1.0, 1.25, 1.5]

        for tmpl in self.templates:
            best_score = 0.0
            best_box = None
            for scale in scales:
                tw = max(16, int(100 * scale))
                th = max(16, int(100 * scale))
                if tw >= w or th >= h:
                    continue
                resized = cv2.resize(tmpl.template, (tw, th), interpolation=cv2.INTER_AREA)
                if w - tw < 1 or h - th < 1:
                    continue
                result = cv2.matchTemplate(gray, resized, cv2.TM_CCOEFF_NORMED)
                _, max_val, _, max_loc = cv2.minMaxLoc(result)
                if max_val > best_score:
                    best_score = float(max_val)
                    best_box = (max_loc[0], max_loc[1], tw, th)
            if best_box and best_score >= MATCH_THRESHOLD:
                x, y, bw, bh = best_box
                out.append(
                    Detection(
                        symbol_id=tmpl.symbol_id,
                        name=tmpl.name,
                        confidence=best_score,
                        x=x,
                        y=y,
                        width=bw,
                        height=bh,
                        method="template_match",
                    )
                )
        return out

    def _region_match(self, gray: np.ndarray) -> list[Detection]:
        """Find bright blob regions (laser glyphs) and classify each crop."""
        out: list[Detection] = []
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        h, w = gray.shape

        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if bw < 12 or bh < 12:
                continue
            if bw * bh > 0.6 * w * h:
                continue
            pad = max(4, int(min(bw, bh) * 0.15))
            x0 = max(0, x - pad)
            y0 = max(0, y - pad)
            x1 = min(w, x + bw + pad)
            y1 = min(h, y + bh + pad)
            crop = gray[y0:y1, x0:x1]
            match = self._best_vector_match(crop)
            if match and match.confidence >= MATCH_THRESHOLD:
                match.x = x0
                match.y = y0
                match.width = x1 - x0
                match.height = y1 - y0
                match.method = "region_vector"
                out.append(match)
        return out

    def _global_best(self, gray: np.ndarray) -> list[Detection]:
        """Whole-image vector match — useful for single-glyph uploads."""
        match = self._best_vector_match(gray)
        if not match or match.confidence < MATCH_THRESHOLD:
            return []
        h, w = gray.shape
        match.x = 0
        match.y = 0
        match.width = w
        match.height = h
        match.method = "global_vector"
        return [match]

    def _best_vector_match(self, gray_crop: np.ndarray) -> Detection | None:
        resized = cv2.resize(gray_crop, (100, 100), interpolation=cv2.INTER_AREA)
        vec = resized.astype(np.float32).flatten()
        vec = (vec - vec.mean()) / (vec.std() + 1e-6)

        best: Detection | None = None
        best_score = -1.0
        for tmpl in self.templates:
            score = float(np.dot(vec, tmpl.vector) / (np.linalg.norm(vec) * np.linalg.norm(tmpl.vector) + 1e-6))
            # Map cosine [-1,1] → [0,1]
            norm_score = (score + 1) / 2
            if norm_score > best_score:
                best_score = norm_score
                best = Detection(
                    symbol_id=tmpl.symbol_id,
                    name=tmpl.name,
                    confidence=norm_score,
                    x=0,
                    y=0,
                    width=100,
                    height=100,
                    method="vector",
                )
        return best

    @staticmethod
    def _iou(a: Detection, b: Detection) -> float:
        ax2, ay2 = a.x + a.width, a.y + a.height
        bx2, by2 = b.x + b.width, b.y + b.height
        ix1, iy1 = max(a.x, b.x), max(a.y, b.y)
        ix2, iy2 = min(ax2, bx2), min(ay2, by2)
        inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
        if inter <= 0:
            return 0.0
        union = a.width * a.height + b.width * b.height - inter
        return inter / union if union else 0.0

    def _nms(self, detections: list[Detection], iou_thresh: float = 0.35) -> list[Detection]:
        if not detections:
            return []
        sorted_d = sorted(detections, key=lambda d: d.confidence, reverse=True)
        kept: list[Detection] = []
        for det in sorted_d:
            if any(self._iou(det, k) > iou_thresh and det.symbol_id == k.symbol_id for k in kept):
                continue
            kept.append(det)
        return kept

    def catalog(self) -> dict:
        return self.manifest
