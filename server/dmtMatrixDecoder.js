/**
 * DMT Matrix Decoder — orchestrates Python CV worker + vision + Firestore.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractJson, runVision } from './fableScrapeProviders.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', 'services', 'dmt-matrix-decoder', 'catalog', 'manifest.json');

const DMT_DECODER_URL = (process.env.DMT_DECODER_URL || '').replace(/\/$/, '');
const DMT_DECODER_SECRET = process.env.DMT_DECODER_WORKER_SECRET || '';
const DMT_DECODE_RAW = Number(process.env.RESEARCH_LAB_DMT_DECODE_RAW ?? 0.018);

let cachedManifest = null;

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

async function callPythonWorker(path, body) {
  if (!DMT_DECODER_URL) {
    return { ok: false, error: 'DMT_DECODER_URL not configured — using local vision-only fallback.' };
  }
  const res = await fetch(`${DMT_DECODER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(DMT_DECODER_SECRET ? { 'x-dmt-decoder-secret': DMT_DECODER_SECRET } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `Worker error (${res.status})`, data };
  }
  return { ok: true, data };
}

const VISION_PROMPT = `You are the DMT Matrix Decoder analyzing a 650nm laser diffraction / DMT visual matrix photo.
Return JSON only:
{
  "summary": "string",
  "matrixStructure": "grid|scattered|linear|mandala|unknown",
  "symbols": [{"label":"", "description":"", "catalogGuess":"symbol id or null", "confidence":0-1, "x":0-1, "y":0-1, "width":0-1, "height":0-1}],
  "decodeNotes": "string",
  "researchFlags": ["string"]
}
Known ids: ${loadDmtCatalog()
  .symbols.slice(0, 24)
  .map((s) => s.id)
  .join(', ')}`;

/**
 * Decode an uploaded laser matrix image.
 * @param {{ imageBase64: string, mimeType?: string, useVision?: boolean, visionProvider?: string, byok?: object, notes?: string }} opts
 */
export async function decodeDmtMatrix(opts = {}) {
  const { imageBase64, mimeType = 'image/jpeg', useVision = true, visionProvider = 'auto', byok = {}, notes = '' } = opts;
  if (!imageBase64) throw new Error('No image provided.');

  const worker = await callPythonWorker('/decode', {
    imageBase64,
    mimeType,
    useVision: false,
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

  const cvDetections = worker.ok ? worker.data?.cvDetections || [] : [];
  const merged = worker.ok ? worker.data?.merged || [] : mergeVisionOnly(vision, imageBase64);

  if (!worker.ok && !vision) {
    throw new Error(worker.error || visionError || 'Decode failed.');
  }

  return {
    sessionId: randomUUID(),
    cvDetections,
    vision,
    visionError,
    merged: enrichMerged(merged, vision),
    workerError: worker.ok ? null : worker.error,
    catalog: { symbolCount: loadDmtCatalog().symbolCount || 0 },
    notes,
    decodedAt: new Date().toISOString(),
  };
}

function mergeVisionOnly(vision, imageBase64) {
  if (!vision?.symbols?.length) return [];
  return vision.symbols.map((sym, i) => ({
    symbolId: sym.catalogGuess || `vision_${i}`,
    name: sym.label || 'Unknown glyph',
    description: sym.description,
    confidence: Number(sym.confidence) || 0.5,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    method: 'vision',
    source: 'vision',
    normalized: {
      x: Number(sym.x) || 0,
      y: Number(sym.y) || 0,
      width: Number(sym.width) || 0.1,
      height: Number(sym.height) || 0.1,
    },
  }));
}

function enrichMerged(merged, vision) {
  const catalog = loadDmtCatalog();
  const byId = Object.fromEntries((catalog.symbols || []).map((s) => [s.id, s]));
  return (merged || []).map((det) => {
    const meta = byId[det.symbolId];
    return {
      ...det,
      tags: meta?.tags || [],
      catalogDescription: meta?.description || det.description,
    };
  });
}

/**
 * Persist decode session to Firestore.
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function saveDmtSession(db, uid, result, { imageBase64, mimeType, email } = {}) {
  const col = db.collection('dmt_matrix_sessions');
  const doc = {
    uid,
    email: email || null,
    sessionId: result.sessionId,
    cvDetections: result.cvDetections,
    vision: result.vision,
    visionError: result.visionError || null,
    merged: result.merged,
    workerError: result.workerError || null,
    notes: result.notes || '',
    symbolCount: result.catalog?.symbolCount || 0,
    detectionCount: (result.merged || []).length,
    decodedAt: result.decodedAt,
    createdAt: new Date(),
    // Store thumbnail reference only — not full image in Firestore doc
    hasImage: !!imageBase64,
    mimeType: mimeType || 'image/jpeg',
  };
  await col.doc(result.sessionId).set(doc);
  return doc;
}

/**
 * List recent sessions for a user.
 */
export async function listDmtSessions(db, uid, limit = 20) {
  const snap = await db
    .collection('dmt_matrix_sessions')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || d.data().createdAt }));
}
