#!/usr/bin/env python3
"""Build or refresh the 100x100 glyph catalogue for the DMT Matrix Decoder.

If PNG files already exist in catalog/symbols/ (e.g. synced from dmtcode.com),
this script only refreshes manifest.json. Otherwise it generates archetype glyphs
aligned with the DMT Code Visual Symbol Catalogue metadata (CC-BY-4.0).
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SYMBOLS_DIR = ROOT / "catalog" / "symbols"
MANIFEST_PATH = ROOT / "catalog" / "manifest.json"
SIZE = 100

# Archetypes derived from dmtcode.com registry topics + Zenodo catalogue v1.0
ARCHETYPES = [
    {
        "id": "symbol_001",
        "name": "T-Bar Glyph",
        "description": "Vertical line with horizontal crossbar resembling letter T",
        "tags": ["alphabetic", "vertical", "bilateral"],
        "source": "650nm_laser",
    },
    {
        "id": "symbol_002",
        "name": "Bilateral Cross",
        "description": "Perfect bilateral cross with four equal arms extending from center",
        "tags": ["geometric", "cross", "bilateral"],
        "source": "650nm_laser",
    },
    {
        "id": "symbol_003",
        "name": "Double Helix",
        "description": "Double helix spiral rotating clockwise with consistent spacing",
        "tags": ["spiral", "helix", "radial"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "symbol_004",
        "name": "Runic Angular",
        "description": "Angular symbol resembling runic alphabet with sharp vertices",
        "tags": ["alphabetic", "angular", "rune"],
        "source": "650nm_laser",
    },
    {
        "id": "hex_lattice",
        "name": "Hexagonal Lattice",
        "description": "Stable hexagonal lattice with nested triangles extending into depth",
        "tags": ["geometric", "hexagonal", "stable", "3D"],
        "source": "650nm_laser",
    },
    {
        "id": "mandala_8",
        "name": "Eight-Fold Mandala",
        "description": "Mandala structure with 8-fold symmetry, red-to-gold color shift reported",
        "tags": ["mandala", "geometric", "symmetrical", "colorful"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "binary_bars",
        "name": "Binary Bars",
        "description": "Binary-like vertical bars that flicker between states with mathematical feel",
        "tags": ["binary", "mathematical", "static", "repeating"],
        "source": "650nm_laser",
    },
    {
        "id": "katakana_grid",
        "name": "Katakana Grid",
        "description": "Rapidly shifting katakana-like characters on a tile grid",
        "tags": ["katakana-like", "shifting", "grid"],
        "source": "650nm_laser",
    },
    {
        "id": "dna_spiral",
        "name": "DNA Helix",
        "description": "Flowing spiral pattern resembling DNA helix rotating slowly clockwise",
        "tags": ["spiral", "organic", "moving", "helix"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "triangle_nested",
        "name": "Nested Triangles",
        "description": "Nested triangles within hexagonal cells, infinite depth illusion",
        "tags": ["geometric", "triangular", "3D"],
        "source": "650nm_laser",
    },
    {
        "id": "circle_concentric",
        "name": "Concentric Rings",
        "description": "Pulsing concentric circles radiating from a luminous center",
        "tags": ["radial", "circular", "pulsing"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "chevron_stack",
        "name": "Chevron Stack",
        "description": "Stacked chevrons pointing upward like ascending code brackets",
        "tags": ["geometric", "angular", "repeating"],
        "source": "650nm_laser",
    },
    {
        "id": "wave_interference",
        "name": "Interference Waves",
        "description": "Sinusoidal interference bands from laser diffraction on a surface",
        "tags": ["wave", "laser", "diffraction"],
        "source": "650nm_laser",
    },
    {
        "id": "diamond_lattice",
        "name": "Diamond Lattice",
        "description": "Rhombus/diamond tiling with alternating bright nodes",
        "tags": ["geometric", "lattice", "repeating"],
        "source": "650nm_laser",
    },
    {
        "id": "arrow_radial",
        "name": "Radial Arrows",
        "description": "Eight radial arrows emanating from center like a compass rose",
        "tags": ["radial", "directional", "geometric"],
        "source": "650nm_laser",
    },
    {
        "id": "bracket_pair",
        "name": "Bracket Pair",
        "description": "Mirrored angular brackets framing an empty matrix cell",
        "tags": ["alphabetic", "angular", "bilateral"],
        "source": "650nm_laser",
    },
    {
        "id": "infinity_loop",
        "name": "Infinity Loop",
        "description": "Figure-eight infinity loop with glowing overlap at center",
        "tags": ["curved", "bilateral", "organic"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "star_pentagram",
        "name": "Pentagram Star",
        "description": "Five-point star with inner pentagon, often reported as luminous",
        "tags": ["geometric", "radial", "symmetrical"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "eye_motif",
        "name": "Eye Motif",
        "description": "Almond eye with central pupil and radiating lashes",
        "tags": ["organic", "bilateral", "watching"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "ladder_rungs",
        "name": "Ladder Rungs",
        "description": "Parallel horizontal rungs between two vertical rails",
        "tags": ["geometric", "vertical", "repeating"],
        "source": "650nm_laser",
    },
    {
        "id": "portal_arch",
        "name": "Portal Arch",
        "description": "Arched doorway or portal with nested rectangular frames",
        "tags": ["architectural", "3D", "portal"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "cube_wireframe",
        "name": "Wireframe Cube",
        "description": "Isometric wireframe cube rotating in perceived 3D space",
        "tags": ["geometric", "3D", "angular"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "flower_6",
        "name": "Six-Petal Flower",
        "description": "Six-petal rosette with radial symmetry and glowing center",
        "tags": ["organic", "radial", "symmetrical"],
        "source": "closed_eyes_dmt",
    },
    {
        "id": "zigzag_lightning",
        "name": "Zigzag Lightning",
        "description": "Sharp zigzag lightning bolt with bilateral symmetry",
        "tags": ["angular", "energy", "bilateral"],
        "source": "650nm_laser",
    },
]


def _canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def _stroke() -> int:
    return 3


def _glow(draw: ImageDraw.ImageDraw, pts, color=(0, 255, 220, 255)):
    draw.line(pts, fill=(0, 180, 160, 120), width=_stroke() + 2)
    draw.line(pts, fill=color, width=_stroke())


def draw_symbol(symbol_id: str) -> Image.Image:
    img, draw = _canvas()
    c = SIZE // 2
    s = _stroke()

    if symbol_id == "symbol_001":
        draw.line([(c, 15), (c, 85)], fill=(0, 255, 220, 255), width=s)
        draw.line([(c - 22, 35), (c + 22, 35)], fill=(0, 255, 220, 255), width=s)
    elif symbol_id == "symbol_002":
        draw.line([(c, 12), (c, 88)], fill=(0, 255, 220, 255), width=s)
        draw.line([(12, c), (88, c)], fill=(0, 255, 220, 255), width=s)
    elif symbol_id == "symbol_003":
        for phase in (0, math.pi):
            pts = []
            for t in range(0, 360, 6):
                rad = math.radians(t)
                x = c + 18 * math.cos(rad + phase) + 8 * math.sin(3 * rad)
                y = c + 28 * math.sin(rad + phase)
                pts.append((x, y))
            _glow(draw, pts)
    elif symbol_id == "symbol_004":
        pts = [(25, 75), (25, 25), (55, 40), (75, 20), (70, 70), (45, 55)]
        draw.polygon(pts, outline=(0, 255, 220, 255), width=s)
    elif symbol_id == "hex_lattice":
        for row in range(3):
            for col in range(3):
                ox = 18 + col * 28 + (row % 2) * 14
                oy = 18 + row * 24
                pts = []
                for i in range(6):
                    ang = math.radians(60 * i - 30)
                    pts.append((ox + 10 * math.cos(ang), oy + 10 * math.sin(ang)))
                draw.polygon(pts, outline=(0, 255, 220, 200), width=2)
    elif symbol_id == "mandala_8":
        for i in range(8):
            ang = math.radians(i * 45)
            x2 = c + 38 * math.cos(ang)
            y2 = c + 38 * math.sin(ang)
            draw.line([(c, c), (x2, y2)], fill=(255, 180, 80, 220), width=2)
        draw.ellipse((c - 28, c - 28, c + 28, c + 28), outline=(255, 100, 100, 255), width=2)
        draw.ellipse((c - 10, c - 10, c + 10, c + 10), fill=(255, 220, 120, 200))
    elif symbol_id == "binary_bars":
        for i, h in enumerate([55, 30, 70, 25, 60, 40, 75, 35]):
            x = 14 + i * 10
            draw.rectangle((x, c - h // 2, x + 6, c + h // 2), fill=(0, 255, 220, 255))
    elif symbol_id == "katakana_grid":
        for row in range(3):
            for col in range(3):
                x = 12 + col * 28
                y = 12 + row * 28
                draw.rectangle((x, y, x + 22, y + 22), outline=(0, 255, 220, 120), width=1)
                draw.line([(x + 4, y + 16), (x + 18, y + 8)], fill=(0, 255, 220, 255), width=2)
                draw.line([(x + 10, y + 6), (x + 10, y + 18)], fill=(0, 255, 220, 255), width=2)
    elif symbol_id == "dna_spiral":
        pts1, pts2 = [], []
        for t in range(0, 360, 8):
            rad = math.radians(t)
            pts1.append((c + 12 * math.cos(rad), 12 + t * 0.22))
            pts2.append((c - 12 * math.cos(rad), 12 + t * 0.22))
        _glow(draw, pts1, (0, 255, 180, 255))
        _glow(draw, pts2, (180, 120, 255, 255))
    elif symbol_id == "triangle_nested":
        for scale in (38, 26, 14):
            pts = []
            for i in range(3):
                ang = math.radians(90 + i * 120)
                pts.append((c + scale * math.cos(ang), c - scale * math.sin(ang)))
            draw.polygon(pts, outline=(0, 255, 220, 255), width=2)
    elif symbol_id == "circle_concentric":
        for r in (8, 16, 26, 36):
            draw.ellipse((c - r, c - r, c + r, c + r), outline=(0, 255, 220, 255 - r * 4), width=2)
    elif symbol_id == "chevron_stack":
        for y in (25, 45, 65):
            draw.polygon([(20, y + 12), (c, y), (80, y + 12)], outline=(0, 255, 220, 255), width=s)
    elif symbol_id == "wave_interference":
        for offset in (0, 15):
            pts = []
            for x in range(10, 90, 2):
                y = c + 18 * math.sin((x + offset) * 0.12)
                pts.append((x, y))
            _glow(draw, pts)
    elif symbol_id == "diamond_lattice":
        for row in range(4):
            for col in range(4):
                x = 12 + col * 22 + (row % 2) * 11
                y = 12 + row * 22
                draw.polygon([(x, y + 8), (x + 8, y), (x + 16, y + 8), (x + 8, y + 16)], outline=(0, 255, 220, 220), width=2)
    elif symbol_id == "arrow_radial":
        for i in range(8):
            ang = math.radians(i * 45)
            x2 = c + 36 * math.cos(ang)
            y2 = c + 36 * math.sin(ang)
            draw.line([(c, c), (x2, y2)], fill=(0, 255, 220, 255), width=2)
            tip_ang1 = ang + math.radians(150)
            tip_ang2 = ang - math.radians(150)
            draw.polygon([
                (x2, y2),
                (x2 + 8 * math.cos(tip_ang1), y2 + 8 * math.sin(tip_ang1)),
                (x2 + 8 * math.cos(tip_ang2), y2 + 8 * math.sin(tip_ang2)),
            ], fill=(0, 255, 220, 255))
    elif symbol_id == "bracket_pair":
        draw.line([(22, 20), (22, 80), (38, 80)], fill=(0, 255, 220, 255), width=s)
        draw.line([(78, 20), (78, 80), (62, 80)], fill=(0, 255, 220, 255), width=s)
    elif symbol_id == "infinity_loop":
        for phase in (0, math.pi):
            pts = []
            for t in range(0, 360, 6):
                rad = math.radians(t)
                x = c + 28 * math.cos(rad) / (1 + 0.4 * (math.sin(rad + phase) ** 2))
                y = c + 14 * math.sin(rad + phase)
                pts.append((x, y))
            _glow(draw, pts)
    elif symbol_id == "star_pentagram":
        pts = []
        for i in range(5):
            ang = math.radians(-90 + i * 72)
            pts.append((c + 36 * math.cos(ang), c + 36 * math.sin(ang)))
        star = [pts[i % 5] for i in [0, 2, 4, 1, 3]]
        draw.polygon(star, outline=(255, 220, 100, 255), width=s)
    elif symbol_id == "eye_motif":
        draw.polygon([(18, c), (c, 28), (82, c), (c, 72)], outline=(0, 255, 220, 255), width=s)
        draw.ellipse((c - 10, c - 10, c + 10, c + 10), fill=(255, 255, 255, 255))
        draw.ellipse((c - 4, c - 4, c + 4, c + 4), fill=(0, 0, 0, 255))
    elif symbol_id == "ladder_rungs":
        draw.line([(30, 15), (30, 85)], fill=(0, 255, 220, 255), width=s)
        draw.line([(70, 15), (70, 85)], fill=(0, 255, 220, 255), width=s)
        for y in range(25, 86, 12):
            draw.line([(30, y), (70, y)], fill=(0, 255, 220, 255), width=2)
    elif symbol_id == "portal_arch":
        draw.rectangle((22, 22, 78, 78), outline=(0, 255, 220, 255), width=2)
        draw.arc((28, 18, 72, 62), 180, 0, fill=(0, 255, 220, 255), width=s)
        draw.rectangle((36, 50, 64, 78), outline=(0, 255, 220, 180), width=2)
    elif symbol_id == "cube_wireframe":
        front = [(30, 45), (60, 45), (60, 75), (30, 75)]
        back = [(40, 30), (70, 30), (70, 60), (40, 60)]
        draw.polygon(front, outline=(0, 255, 220, 255), width=2)
        draw.polygon(back, outline=(0, 255, 220, 180), width=2)
        for a, b in zip(front, back):
            draw.line([a, b], fill=(0, 255, 220, 200), width=2)
    elif symbol_id == "flower_6":
        for i in range(6):
            ang = math.radians(i * 60)
            cx = c + 22 * math.cos(ang)
            cy = c + 22 * math.sin(ang)
            draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), outline=(255, 180, 220, 255), width=2)
        draw.ellipse((c - 8, c - 8, c + 8, c + 8), fill=(255, 240, 180, 255))
    elif symbol_id == "zigzag_lightning":
        pts = [(20, 25), (42, 45), (30, 45), (55, 75), (48, 52), (65, 52), (45, 30)]
        draw.line(pts, fill=(0, 255, 220, 255), width=s + 1)
    else:
        draw.ellipse((c - 20, c - 20, c + 20, c + 20), outline=(0, 255, 220, 255), width=s)

    # Composite on black background for laser-diffraction contrast
    bg = Image.new("RGB", (SIZE, SIZE), (5, 8, 16))
    bg.paste(img, mask=img.split()[3])
    return bg


def build_manifest(symbols: list[dict]) -> dict:
    return {
        "version": "1.0.0",
        "dateModified": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "license": "CC-BY-4.0",
        "attribution": "DMT Code Visual Symbol Catalogue — https://dmtcode.com (archetype glyphs for decoder training)",
        "canvasSize": SIZE,
        "symbolCount": len(symbols),
        "symbols": symbols,
    }


def main() -> None:
    SYMBOLS_DIR.mkdir(parents=True, exist_ok=True)
    symbols = []
    existing = {p.stem for p in SYMBOLS_DIR.glob("*.png")}

    for archetype in ARCHETYPES:
        sid = archetype["id"]
        out = SYMBOLS_DIR / f"{sid}.png"
        if not out.exists():
            draw_symbol(sid).save(out, format="PNG")
        symbols.append(
            {
                **archetype,
                "filename": f"{sid}.png",
                "width": SIZE,
                "height": SIZE,
            }
        )

    # Include any extra PNGs dropped in by the user (e.g. full dmtcode.com catalogue)
    for path in sorted(SYMBOLS_DIR.glob("*.png")):
        if path.stem in {s["id"] for s in symbols}:
            continue
        symbols.append(
            {
                "id": path.stem,
                "name": path.stem.replace("_", " ").title(),
                "description": "Imported glyph from external catalogue",
                "tags": ["imported"],
                "source": "catalogue_import",
                "filename": path.name,
                "width": SIZE,
                "height": SIZE,
            }
        )

    manifest = build_manifest(symbols)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Catalogue ready: {len(symbols)} symbols → {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
