/**
 * DMT Matrix Decoder — structural + raster + vision orchestration.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractJson, runVision } from './fableScrapeProviders.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = join(__dirname, '..', 'services', 'dmt-matrix-decoder', 'catalog');
const MANIFEST_PATH = join(CATALOG_DIR, 'manifest.json');
const STRUCTURAL_MANIFEST_PATH = join(CATALOG_DIR, 'structural_manifest.json');

const DMT_DECODER_URL = (process.env.DMT_DECODER_URL || '').replace(/\/$/, '');
const DMT_DECODER_SECRET = process.env.DMT_DECODER_WORKER_SECRET || '';
const DMT_DECODE_RAW = Number(process.env.RESEARCH_LAB_DMT_DECODE_RAW ?? 0.018);

let cachedManifest = null;
let cachedStructural = null;

export function dmtDecodeRawCost() {
  return DMT_DECODE_RAW;
}

export function loadDmtCatalog() {
  if (cachedManifest) return cachedManifest;
  try {
    cachedManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    cachedManifest = { symbols: [], symbolCount: 0 };
  }
  return cachedManifest;
}

export function loadStructuralCatalog() {
  if (cachedStructural) return cachedStructural;
  try {
    cachedStructural = JSON.parse(readFileSync(STRUCTURAL_MANIFEST_PATH, 'utf8'));
  } catch {
    cachedStructural = { glyphs: [], tokens: [], tokenIndex: {}, glyphCount: 0 };
  }
  return cachedStructural;
}

async function callPythonWorker(path, body, method = 'POST') {
  if (!DMT_DECODER_URL) {
    return { ok: false, error: 'DMT_DECODER_URL not configured — using local vision-only fallback.' };
  }
  const res = await fetch(`${DMT_DECODER_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(DMT_DECODER_SECRET ? { 'x-dmt-decoder-secret': DMT_DECODER_SECRET } : {}),
    },
    ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(120_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `Worker error (${res.status})`, data };
  }
  return { ok: true, data };
}

const VISION_PROMPT = `You are the DMT Matrix Decoder analyzing a 650nm laser diffraction / DMT visual matrix photo.
Return JSON only with confidence scores and feature attributions:
{
  "summary": "string",
  "matrixStructure": "grid|scattered|linear|mandala|unknown",
  "symbols": [{
    "label": "", "description": "", "catalogGuess": "symbol id or null", "tokenGuess": "GLYPH_XXXX or null",
    "confidence": 0-1, "x": 0-1, "y": 0-1, "width": 0-1, "height": 0-1,
    "attributions": { "symmetry": 0-1, "junctionCount": 0, "strokeComplexity": 0-1, "topologyClass": "linear|radial|grid|loop|compound|unknown" }
  }],
  "decodeNotes": "string",
  "researchFlags": ["string"]
}
Known ids: ${loadDmtCatalog()
  .symbols.map((s) => s.id)
  .join(', ')}`;

/**
 * Decode an uploaded laser matrix image (structural + raster + vision).
 */
export async function decodeDmtMatrix(opts = {}) {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    useVision = true,
    useStructural = true,
    visionProvider = 'auto',
    byok = {},
    notes = '',
  } = opts;
  if (!imageBase64) throw new Error('No image provided.');

  const worker = await callPythonWorker('/decode', {
    imageBase64,
    mimeType,
    useVision: false,
    useStructural,
    visionProvider,
  });

  let vision = null;
  let visionError = null;
  if (useVision) {
    try {
      const provider = visionProvider === 'grok' ? 'grok' : visionProvider === 'gemini' ? 'gemini' : 'gemini';
      const text = await runVision({
        provider,
        byok,
        prompt: VISION_PROMPT,
        images: [imageBase64],
        mimeType,
        maxTokens: 4096,
      });
      vision = extractJson(text) || { raw: text };
      vision.provider = provider;
    } catch (err) {
      visionError = err.message || String(err);
      if (visionProvider === 'auto' || visionProvider === 'gemini') {
        try {
          const text = await runVision({
            provider: 'grok',
            byok,
            prompt: VISION_PROMPT,
            images: [imageBase64],
            mimeType,
          });
          vision = extractJson(text) || { raw: text };
          vision.provider = 'grok';
          visionError = null;
        } catch (grokErr) {
          visionError = grokErr.message || visionError;
        }
      }
    }
  }

  const structural = loadStructuralCatalog();
  const tokenIndex = structural.tokenIndex || {};

  const cvDetections = worker.ok ? worker.data?.cvDetections || [] : [];
  const structuralMatches = worker.ok ? worker.data?.structuralMatches || [] : [];
  const syntax = worker.ok ? worker.data?.syntax || null : null;
  let merged = worker.ok ? worker.data?.merged || [] : mergeVisionOnly(vision, tokenIndex);

  if (vision?.symbols?.length && worker.ok) {
    merged = enrichMerged(merged, vision, tokenIndex);
  } else if (!worker.ok) {
    merged = enrichMerged(mergeVisionOnly(vision, tokenIndex), vision, tokenIndex);
  }

  if (!worker.ok && !vision) {
    throw new Error(worker.error || visionError || 'Decode failed.');
  }

  return {
    sessionId: randomUUID(),
    cvDetections,
    structuralMatches,
    structuralError: worker.ok ? worker.data?.structuralError || null : worker.error,
    syntax,
    vision,
    visionError,
    merged: enrichMerged(merged, vision, tokenIndex),
    workerError: worker.ok ? null : worker.error,
    catalog: {
      symbolCount: loadDmtCatalog().symbolCount || 0,
      structuralGlyphCount: structural.glyphCount || 0,
      tokenIndex,
      clustering: structural.clustering || null,
    },
    notes,
    decodedAt: new Date().toISOString(),
  };
}

function mergeVisionOnly(vision, tokenIndex) {
  if (!vision?.symbols?.length) return [];
  return vision.symbols.map((sym, i) => {
    const sid = sym.catalogGuess || `vision_${i}`;
    return {
      symbolId: sid,
      tokenId: sym.tokenGuess || tokenIndex[sid] || null,
      name: sym.label || 'Unknown glyph',
      description: sym.description,
      confidence: Number(sym.confidence) || 0.5,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      method: 'vision',
      source: 'vision',
      attributions: sym.attributions || {},
      normalized: {
        x: Number(sym.x) || 0,
        y: Number(sym.y) || 0,
        width: Number(sym.width) || 0.1,
        height: Number(sym.height) || 0.1,
      },
    };
  });
}

function enrichMerged(merged, vision, tokenIndex) {
  const catalog = loadDmtCatalog();
  const byId = Object.fromEntries((catalog.symbols || []).map((s) => [s.id, s]));
  return (merged || []).map((det) => {
    const meta = byId[det.symbolId];
    return {
      ...det,
      name: meta?.name || det.name,
      tokenId: det.tokenId || tokenIndex[det.symbolId] || null,
      tags: meta?.tags || [],
      catalogDescription: meta?.description || det.description,
      catalogSource: meta?.source || null,
      registryUrl: meta?.registryUrl || null,
      attributions: det.attributions || {},
    };
  });
}

export async function saveDmtSession(db, uid, result, { imageBase64, mimeType, email } = {}) {
  const col = db.collection('dmt_matrix_sessions');
  const doc = {
    uid,
    email: email || null,
    sessionId: result.sessionId,
    cvDetections: result.cvDetections,
    structuralMatches: result.structuralMatches || [],
    structuralError: result.structuralError || null,
    syntax: result.syntax || null,
    vision: result.vision,
    visionError: result.visionError || null,
    merged: result.merged,
    workerError: result.workerError || null,
    notes: result.notes || '',
    symbolCount: result.catalog?.symbolCount || 0,
    structuralGlyphCount: result.catalog?.structuralGlyphCount || 0,
    detectionCount: (result.merged || []).length,
    decodedAt: result.decodedAt,
    createdAt: new Date(),
    hasImage: !!imageBase64,
    mimeType: mimeType || 'image/jpeg',
    pipeline: 'structural_v2',
  };
  await col.doc(result.sessionId).set(doc);
  return doc;
}

export async function listDmtSessions(db, uid, limit = 20) {
  const snap = await db
    .collection('dmt_matrix_sessions')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || d.data().createdAt,
  }));
}
