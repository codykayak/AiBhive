#!/usr/bin/env python3
"""Download 100×100 PNG glyphs from the dmtcode.com Supabase registry.

The public registry stores approved glyphs in `registry_glyphs` with embedded
`image_data` (data:image/png;base64,...). The PNG ZIP on dmtcode.com/registry
is listed as "Coming Soon"; this script is the live programmatic source.

Outputs:
  catalog/symbols/registry_<uuid>.png
  catalog/registry_records.json
"""
from __future__ import annotations

import base64
import binascii
import json
import os
import re
import struct
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SYMBOLS_DIR = ROOT / "catalog" / "symbols"
RECORDS_PATH = ROOT / "catalog" / "registry_records.json"

SUPABASE_URL = os.environ.get(
    "DMTCODE_SUPABASE_URL", "https://bbmhrgpsyiahefnxqwfg.supabase.co"
)
SUPABASE_ANON_KEY = os.environ.get(
    "DMTCODE_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWhyZ3BzeWlhaGVmbnhxd2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1Njc5ODcsImV4cCI6MjA3OTE0Mzk4N30.zPuWahf5g140hdR__asVINWBvYJaxZmVvDQTvIAjLww",
)
PAGE_SIZE = 200


def _request(path: str) -> list[dict]:
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{path}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_registry_glyphs() -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        query = (
            "registry_glyphs"
            f"?select=id,image_data,source,symmetry,motif_tags,perceived_surface,"
            "depth,motion,emotional_valence,communicative_intent,confirmation_count,"
            "created_at,updated_at"
            f"&order=created_at.asc&limit={PAGE_SIZE}&offset={offset}"
        )
        try:
            batch = _request(query)
        except urllib.error.URLError as exc:
            print(f"Failed to fetch registry_glyphs: {exc}", file=sys.stderr)
            break
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def decode_png(image_data: str) -> bytes | None:
    if not image_data:
        return None
    raw = image_data
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[-1]
    try:
        data = base64.b64decode(raw, validate=True)
    except (ValueError, binascii.Error):
        return None
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return data


def png_dimensions(data: bytes) -> tuple[int, int] | None:
    if len(data) < 24:
        return None
    w, h = struct.unpack(">II", data[16:24])
    return int(w), int(h)


def slug_from_tags(tags: list[str], glyph_id: str) -> str:
    if tags:
        slug = re.sub(r"[^a-z0-9]+", "_", tags[0].lower()).strip("_")
        if slug:
            return slug[:40]
    return glyph_id.replace("-", "")[:12]


def main() -> int:
    SYMBOLS_DIR.mkdir(parents=True, exist_ok=True)
    rows = fetch_registry_glyphs()
    if not rows:
        print("No registry_glyphs returned — keeping existing catalogue PNGs.")
        return 0

    saved: list[dict] = []
    skipped = 0
    for row in rows:
        glyph_id = row.get("id") or ""
        png = decode_png(row.get("image_data") or "")
        if not png:
            skipped += 1
            continue
        dims = png_dimensions(png)
        filename = f"registry_{glyph_id}.png"
        (SYMBOLS_DIR / filename).write_bytes(png)
        tags = row.get("motif_tags") or []
        saved.append(
            {
                "id": f"registry_{glyph_id}",
                "registryId": glyph_id,
                "filename": filename,
                "name": slug_from_tags(tags, glyph_id).replace("_", " ").title(),
                "description": (
                    f"Community registry glyph ({row.get('source') or 'unknown source'})"
                ),
                "tags": tags,
                "source": row.get("source") or "dmtcode_registry",
                "symmetry": row.get("symmetry"),
                "surface": row.get("perceived_surface"),
                "confirmationCount": row.get("confirmation_count"),
                "width": dims[0] if dims else 100,
                "height": dims[1] if dims else 100,
                "registryUrl": f"https://dmtcode.com/registry/{glyph_id}",
            }
        )

    manifest = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": "https://dmtcode.com/registry (Supabase registry_glyphs)",
        "license": "CC-BY-4.0",
        "glyphCount": len(saved),
        "skipped": skipped,
        "glyphs": saved,
    }
    RECORDS_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Fetched {len(saved)} registry PNGs ({skipped} skipped) → {SYMBOLS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
