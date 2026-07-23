import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = Path(os.environ.get("DMT_CATALOG_DIR", ROOT / "catalog"))
SYMBOLS_DIR = CATALOG_DIR / "symbols"
MANIFEST_PATH = CATALOG_DIR / "manifest.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
XAI_API_KEY = os.environ.get("XAI_API_KEY") or os.environ.get("GROK_API_KEY") or ""
GEMINI_VISION_MODEL = os.environ.get("DMT_GEMINI_VISION_MODEL", "gemini-2.5-flash")
GROK_VISION_MODEL = os.environ.get("DMT_GROK_VISION_MODEL", "grok-2-vision-1212")
GROK_BASE_URL = os.environ.get("FABLE_GROK_BASE_URL", "https://api.x.ai/v1")

MATCH_THRESHOLD = float(os.environ.get("DMT_MATCH_THRESHOLD", "0.52"))
MAX_DETECTIONS = int(os.environ.get("DMT_MAX_DETECTIONS", "48"))
WORKER_SECRET = os.environ.get("DMT_DECODER_WORKER_SECRET", "")
