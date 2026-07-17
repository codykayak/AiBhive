/**
 * Pros equipment manual RAG — chunked OEM text + source index metadata.
 * Ingest via POST /api/pros/knowledge/manuals/ingest (manager+).
 */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s/+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactModel(text) {
  return normalize(text).replace(/[\s.-]/g, '');
}

function tokens(text) {
  const stop = new Set(['a', 'an', 'the', 'is', 'are', 'to', 'of', 'and', 'or', 'for', 'with', 'it', 'this', 'that']);
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
}

function scoreChunk(chunk, query) {
  const q = normalize(query);
  const qTokens = tokens(query);
  const cq = compactModel(query);
  if (!q) return 0;

  const blob = normalize(
    [
      chunk.brand,
      chunk.title,
      chunk.manualId,
      chunk.sourceUrl,
      ...(chunk.modelPrefixes || []),
      chunk.text,
    ].join(' ')
  );

  let score = 0;
  if (blob.includes(q)) score += 14;
  for (const t of qTokens) {
    if (blob.includes(t)) score += 2;
  }
  for (const prefix of chunk.modelPrefixes || []) {
    const cp = compactModel(prefix);
    if (cp.length >= 3 && (cq.includes(cp) || cp.includes(cq))) score += 20;
    if (q.includes(normalize(prefix))) score += 10;
  }
  return score;
}

export function formatManualChunksForPrompt(chunks) {
  if (!chunks?.length) return '';
  const lines = chunks.map((c, i) => {
    const header = [c.brand, c.title, c.modelPrefixes?.slice(0, 4).join('/')].filter(Boolean).join(' · ');
    const excerpt = String(c.text || '').slice(0, 420).replace(/\s+/g, ' ').trim();
    const page = c.page ? ` (p.${c.page})` : '';
    return `${i + 1}. [${header}]${page}\n${excerpt}`;
  });
  return `\nOEM manual excerpts (indexed):\n${lines.join('\n\n')}`;
}

export async function searchManualChunks(db, { companyId, query, packId, limit = 4 }) {
  const results = [];
  const collections = [];

  if (companyId) {
    collections.push(db.collection('pros_companies').doc(companyId).collection('manual_chunks'));
  }
  collections.push(db.collection('pros_global_manual_chunks'));

  for (const col of collections) {
    let q = col.where('status', '==', 'active');
    if (packId) q = q.where('packId', '==', packId);
    try {
      const snap = await q.limit(120).get();
      for (const doc of snap.docs) {
        const chunk = { id: doc.id, ...doc.data() };
        const s = scoreChunk(chunk, query);
        if (s > 0) results.push({ ...chunk, _score: s });
      }
    } catch (err) {
      console.warn('[manual-chunks] query', err?.message || err);
      const snap = await col.limit(80).get();
      for (const doc of snap.docs) {
        const chunk = { id: doc.id, ...doc.data() };
        if (packId && chunk.packId && chunk.packId !== packId) continue;
        if (chunk.status && chunk.status !== 'active') continue;
        const s = scoreChunk(chunk, query);
        if (s > 0) results.push({ ...chunk, _score: s });
      }
    }
  }

  const seen = new Set();
  return results
    .sort((a, b) => b._score - a._score)
    .filter((c) => {
      const key = `${c.manualId || c.title}:${String(c.text || '').slice(0, 80)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ _score, ...chunk }) => chunk);
}

export async function ingestManualChunks(db, FieldValue, {
  companyId,
  user,
  brand,
  packId,
  title,
  manualId,
  sourceUrl,
  modelPrefixes = [],
  chunks = [],
  scope = 'company',
}) {
  const now = FieldValue.serverTimestamp();
  const safeManualId =
    manualId ||
    normalize([brand, title, ...(modelPrefixes || []).slice(0, 2)].join('-'))
      .replace(/\s+/g, '-')
      .slice(0, 80) ||
    `manual-${Date.now()}`;

  const col =
    scope === 'global'
      ? db.collection('pros_global_manual_chunks')
      : db.collection('pros_companies').doc(companyId).collection('manual_chunks');

  const batch = db.batch();
  let written = 0;

  for (let i = 0; i < chunks.length; i++) {
    const piece = chunks[i];
    const text = String(piece?.text || '').trim();
    if (!text) continue;
    const ref = col.doc();
    batch.set(ref, {
      id: ref.id,
      manualId: safeManualId,
      brand: String(brand || '').slice(0, 120),
      packId: packId || 'property',
      title: String(title || brand || 'Equipment manual').slice(0, 200),
      sourceUrl: sourceUrl ? String(sourceUrl).slice(0, 500) : null,
      modelPrefixes: (modelPrefixes || []).map((m) => String(m).slice(0, 40)).slice(0, 24),
      page: Number(piece.page) || i + 1,
      text: text.slice(0, 6000),
      status: 'active',
      scope: scope === 'global' ? 'global' : 'company',
      companyId: scope === 'global' ? null : companyId,
      ingestedBy: user?.uid || null,
      ingestedByEmail: user?.email || null,
      createdAt: now,
      updatedAt: now,
    });
    written++;
  }

  if (written === 0) {
    throw new Error('No manual text chunks to ingest');
  }

  await batch.commit();
  return { manualId: safeManualId, chunksWritten: written };
}

/** Static OEM portal index — fast “where to look” without downloading PDFs yet. */
export const MANUAL_SOURCE_INDEX = [
  {
    id: 'src-pentair',
    packId: 'pool',
    brand: 'Pentair',
    portalName: 'Pentair Product Documentation',
    searchUrl: 'https://www.pentair.com/en-us/products/residential/pool-spa-equipment.html',
    searchHint: 'Search pump/heater model on product page → Documents tab',
    modelExamples: ['011057', 'INTELLIFLO', '460736'],
  },
  {
    id: 'src-hayward',
    packId: 'pool',
    brand: 'Hayward',
    portalName: 'Hayward Owner & Service Manuals',
    searchUrl: 'https://www.hayward.com/en-us/support/manuals',
    searchHint: 'Filter by product category then model family',
    modelExamples: ['TRISTAR', 'SP3202', 'AQUARITE'],
  },
  {
    id: 'src-jandy',
    packId: 'pool',
    brand: 'Jandy',
    portalName: 'Zodiac/Jandy Literature',
    searchUrl: 'https://www.jandy.com/en/support',
    searchHint: 'Automation and heater literature library',
    modelExamples: ['IAQUALINK', 'RS', 'JE'],
  },
  {
    id: 'src-carrier',
    packId: 'hvac',
    brand: 'Carrier / Bryant',
    portalName: 'Carrier Technical Literature',
    searchUrl: 'https://www.carrier.com/residential/en/us/products/',
    searchHint: 'Model on outdoor unit label → product literature PDFs',
    modelExamples: ['24ACC', '58MCA', 'FE4ANF'],
  },
  {
    id: 'src-trane',
    packId: 'hvac',
    brand: 'Trane / American Standard',
    portalName: 'Trane Residential Literature',
    searchUrl: 'https://www.trane.com/residential/en/resources/',
    searchHint: 'Search by model number from condenser nameplate',
    modelExamples: ['4TTR', 'TEM6', 'S9V2'],
  },
  {
    id: 'src-lennox',
    packId: 'hvac',
    brand: 'Lennox',
    portalName: 'Lennox Product Literature',
    searchUrl: 'https://www.lennox.com/resources/',
    searchHint: 'Literature finder by model/serial',
    modelExamples: ['XC16', 'EL296', 'CBK'],
  },
  {
    id: 'src-goodman',
    packId: 'hvac',
    brand: 'Goodman / Amana',
    portalName: 'Goodman Technical Support',
    searchUrl: 'https://www.goodmanmfg.com/resources',
    searchHint: 'Installation & service manuals by model prefix',
    modelExamples: ['GMEC', 'ARUF', 'CAPF'],
  },
  {
    id: 'src-rinnai',
    packId: 'plumbing',
    brand: 'Rinnai',
    portalName: 'Rinnai Technical Documents',
    searchUrl: 'https://www.rinnai.us/technical-documents',
    searchHint: 'Tankless model from front cover sticker',
    modelExamples: ['RU199', 'RU160', 'V53'],
  },
  {
    id: 'src-navien',
    packId: 'plumbing',
    brand: 'Navien',
    portalName: 'Navien Technical Library',
    searchUrl: 'https://www.navieninc.com/support',
    searchHint: 'NPE/NPN install + service PDFs',
    modelExamples: ['NPE-180', 'NPE-240', 'NPN'],
  },
  {
    id: 'src-watts',
    packId: 'plumbing',
    brand: 'Watts',
    portalName: 'Watts Backflow & Regulator Docs',
    searchUrl: 'https://www.watts.com/resources/literature',
    searchHint: 'RPZ/PRV model from tag',
    modelExamples: ['009', 'LF009', 'LFN45'],
  },
  {
    id: 'src-sqd',
    packId: 'electrical',
    brand: 'Schneider / Square D',
    portalName: 'Square D Literature Library',
    searchUrl: 'https://www.se.com/us/en/download/',
    searchHint: 'Catalog number from breaker/panel label',
    modelExamples: ['QO', 'HOM', 'HOM24L70'],
  },
  {
    id: 'src-eaton',
    packId: 'electrical',
    brand: 'Eaton',
    portalName: 'Eaton Literature & Resources',
    searchUrl: 'https://www.eaton.com/us/en-us/support/documentation.html',
    searchHint: 'CH/BR catalog numbers',
    modelExamples: ['CH130', 'BR2020'],
  },
  {
    id: 'src-whirlpool',
    packId: 'property',
    brand: 'Whirlpool / Maytag',
    portalName: 'Whirlpool Manuals & Literature',
    searchUrl: 'https://www.whirlpool.com/support/manuals.html',
    searchHint: 'Model number from tag inside door/frame',
    modelExamples: ['WTW', 'MVWB', 'WED'],
  },
  {
    id: 'src-lg',
    packId: 'property',
    brand: 'LG',
    portalName: 'LG Owner Manuals',
    searchUrl: 'https://www.lg.com/us/support/manuals-documents',
    searchHint: 'Model + serial from sticker',
    modelExamples: ['WM', 'DLEX', 'LFX'],
  },
  {
    id: 'src-samsung',
    packId: 'property',
    brand: 'Samsung',
    portalName: 'Samsung Download Center',
    searchUrl: 'https://www.samsung.com/us/support/downloads/',
    searchHint: 'Model code on label',
    modelExamples: ['WF45', 'RF28', 'DW80'],
  },
  {
    id: 'src-ge',
    packId: 'property',
    brand: 'GE Appliances',
    portalName: 'GE Owner Manuals & Specs',
    searchUrl: 'https://www.geappliances.com/ge/service-and-support/manuals.htm',
    searchHint: 'Model from tag; service manuals for techs',
    modelExamples: ['GFE', 'GDT', 'JB'],
  },
];

export function filterManualSources(packId) {
  if (!packId) return MANUAL_SOURCE_INDEX;
  return MANUAL_SOURCE_INDEX.filter((s) => s.packId === packId);
}
