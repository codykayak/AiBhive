/**
 * OEM manual RAG search + Google dork fallback when no ingested manual matches.
 */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s/+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text) {
  const stop = new Set(['a', 'an', 'the', 'is', 'are', 'to', 'of', 'and', 'or', 'for', 'with', 'it', 'this', 'that', 'my', 'not', 'no']);
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
}

/** Likely equipment model / serial tokens from free text or nameplate OCR. */
export function extractModelCandidates(text) {
  const raw = String(text || '');
  const found = new Set();

  const patterns = [
    /\b[A-Z]{2,6}[- ]?\d{2,}[A-Z0-9./_-]{1,12}\b/g,
    /\b\d{2,3}[A-Z]{1,4}\d{2,}[A-Z0-9-]*\b/g,
    /\b(?:model|mod|m\/n|pn|p\/n|serial|s\/n)[#:\s]+([A-Z0-9][A-Z0-9./_-]{3,24})\b/gi,
  ];

  for (const pattern of patterns) {
    let match;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(raw)) !== null) {
      const token = (match[1] || match[0]).replace(/^(model|mod|m\/n|pn|p\/n|serial|s\/n)[#:\s]+/i, '').trim();
      if (token.length >= 4 && token.length <= 28) found.add(token.toUpperCase());
    }
  }

  return [...found].slice(0, 4);
}

function scoreManualChunk(chunk, query, modelCandidates = []) {
  const q = normalize(query);
  const qTokens = tokens(query);
  const blob = normalize([chunk.brand, chunk.title, chunk.text, ...(chunk.modelPrefixes || [])].join(' '));
  let score = 0;

  for (const model of modelCandidates) {
    const m = normalize(model);
    if (!m) continue;
    if (blob.includes(m)) score += 20;
    for (const prefix of chunk.modelPrefixes || []) {
      const p = normalize(prefix);
      if (p && (m.startsWith(p) || p.startsWith(m.slice(0, Math.min(p.length, m.length))))) score += 25;
    }
  }

  if (q && blob.includes(q)) score += 10;
  for (const t of qTokens) {
    if (blob.includes(t)) score += 2;
  }
  if (chunk.brand && q.includes(normalize(chunk.brand))) score += 8;

  return score;
}

export function formatManualsForPrompt(manuals) {
  if (!manuals?.length) return '';
  const lines = manuals.map((m, i) => {
    const cite = [m.brand, m.title, m.page ? `p.${m.page}` : ''].filter(Boolean).join(' · ');
    return `${i + 1}. [${cite}] ${String(m.text || '').slice(0, 900)}`;
  });
  return `\nOEM / shop manual excerpts (ingested library):\n${lines.join('\n')}`;
}

export async function searchManualChunks(db, { companyId, query, packId, limit = 4 }) {
  const results = [];
  const modelCandidates = extractModelCandidates(query);

  const loadCol = async (col) => {
    let q = col.where('status', '==', 'active');
    if (packId) q = q.where('packId', '==', packId);
    const snap = await q.limit(120).get();
    for (const doc of snap.docs) {
      const chunk = { id: doc.id, ...doc.data() };
      const s = scoreManualChunk(chunk, query, modelCandidates);
      if (s > 0) results.push({ ...chunk, _score: s });
    }
  };

  if (companyId) {
    await loadCol(db.collection('pros_companies').doc(companyId).collection('manual_chunks'));
  }
  try {
    await loadCol(db.collection('pros_global_manual_chunks'));
  } catch (err) {
    console.warn('[manual search] global chunks', err?.message || err);
  }

  return results
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...chunk }) => chunk);
}

export function buildManualDorkLinks({ query = '', brand = '', model = '' } = {}) {
  const modelToken = String(model || extractModelCandidates(query)[0] || query).trim().slice(0, 80);
  if (!modelToken) return [];

  const base = [brand, modelToken].filter(Boolean).join(' ').trim();
  const packs = [
    { label: 'Service manual PDFs', query: `"${base}" service manual filetype:pdf` },
    { label: 'ManualsLib', query: `site:manualslib.com ${base}` },
    { label: 'Installation / owners PDF', query: `"${base}" (installation OR owners) manual filetype:pdf` },
    { label: 'Parts / wiring diagram', query: `"${base}" (parts OR wiring) diagram filetype:pdf` },
  ];

  return packs.map((p) => ({
    label: p.label,
    query: p.query,
    googleUrl: `https://www.google.com/search?q=${encodeURIComponent(p.query)}`,
  }));
}
