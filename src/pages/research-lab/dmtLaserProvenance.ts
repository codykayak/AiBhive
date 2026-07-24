/** Provenance + laser experiment background for the DMT Matrix Decoder. */

export const DMT_CODE_LINKS = {
  home: 'https://dmtcode.com',
  registry: 'https://dmtcode.com/registry',
  dataJson: 'https://dmtcode.com/data.json',
  zenodo: 'https://doi.org/10.5281/zenodo.17816520',
  supabaseSource:
    'https://bbmhrgpsyiahefnxqwfg.supabase.co/rest/v1/registry_glyphs',
} as const;

export const DMT_CATALOG_ATTRIBUTION =
  'DMT Code Visual Symbol Catalogue — CC-BY-4.0 — community glyphs from dmtcode.com';

export const PHOTO_MATCH_PIPELINES = [
  {
    id: 'classifier',
    title: 'Raster template scan',
    body: 'OpenCV slides our 45 catalogue tiles across your photo and flags regions that visually resemble known glyphs. This is the only path that returns pixel positions (bounding boxes) on the image.',
  },
  {
    id: 'structural',
    title: 'Structural vector match',
    body: 'Stroke topology from your image is normalized and compared to the vector catalogue (chamfer distance). Strong for shape family, but today treats the whole frame as one glyph query unless the worker is fully deployed.',
  },
  {
    id: 'vision',
    title: 'Gemini / Grok vision',
    body: 'Vision models read the full photograph, draw normalized bounding boxes, and guess catalogue IDs (symbol_001, registry_*, GLYPH_XXXX tokens). Best for messy real-world wall photos when templates miss.',
  },
] as const;

export const PHOTO_MATCH_TIPS = {
  worksWell: [
    '650nm red laser diffraction on a wall, door, or flat surface',
    'Glyphs roughly similar size to the 100×100 catalogue tiles',
    'Reasonable focus and contrast (laser on dark background)',
    'Single exposure — not heavy motion blur',
  ],
  struggles: [
    'Tiny glyphs far from camera or heavily cropped',
    'Non-red lighting, color grading, or heavy JPEG artifacts',
    'Overlapping symbols with no clear separation',
    'Glyphs that never appeared in the dmtcode.com registry or archetype set',
  ],
} as const;
