/**
 * DMT Matrix corpus research — statistics + script comparison report.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { extractJson, runChat, runVision } from './fableScrapeProviders.js';
import { TOKEN_MARKUP } from './hivePlans.js';
import { loadDmtCatalog, loadStructuralCatalog } from './dmtMatrixDecoder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(
  __dirname,
  '..',
  'services',
  'dmt-matrix-decoder',
  'catalog',
  'registry_records.json',
);
const SYMBOLS_DIR = join(__dirname, '..', 'services', 'dmt-matrix-decoder', 'catalog', 'symbols');

export const DMT_RESEARCH_DEFAULT_BUDGET_USD = Number(
  process.env.RESEARCH_LAB_DMT_RESEARCH_BUDGET_USD ?? 1,
);
export const DMT_RESEARCH_RAW_PER_GLYPH = Number(
  process.env.RESEARCH_LAB_DMT_RESEARCH_RAW_PER_GLYPH ?? 0.085,
);

const SCRIPT_TARGETS = [
  'Japanese Katakana',
  'Japanese Kanji (simple forms)',
  'Hebrew',
  'Aramaic',
  'Phoenician',
  'Runic / Elder Futhark',
  'Cuneiform wedge patterns',
  'Devanagari',
  'Geometric / non-linguistic',
];

const COMPARE_PROMPT = `You are a comparative paleography analyst for the DMT Code visual symbol research project.
Compare this 100×100 laser-diffraction glyph to known writing systems.

Return ONLY valid JSON:
{
  "glyphId": "string",
  "glyphName": "string",
  "matches": [
    {
      "script": "Japanese Katakana|Japanese Kanji|Hebrew|Aramaic|Phoenician|Runic|Cuneiform|Devanagari|Geometric|Other",
      "characterOrForm": "specific character or description",
      "similarityScore": 0.0-1.0,
      "reasoning": "brief structural rationale",
      "confidence": 0.0-1.0
    }
  ],
  "topologyAssessment": {
    "symmetry": 0.0-1.0,
    "junctionCount": integer,
    "strokeComplexity": 0.0-1.0,
    "topologyClass": "linear|radial|grid|loop|compound|unknown"
  },
  "linguisticLikelihood": 0.0-1.0,
  "notes": "string"
}

Focus on stroke topology, symmetry axes, junctions — not color. Flag similarity >= 0.65 as promising.`;

function loadRegistryRecords() {
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { glyphs: [] };
  }
}

function readGlyphBase64(filename) {
  try {
    const buf = readFileSync(join(SYMBOLS_DIR, filename));
    return buf.toString('base64');
  } catch {
    return null;
  }
}

function shannonEntropy(tokens) {
  if (!tokens.length) return 0;
  const counts = new Map();
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  const n = tokens.length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return Math.round(h * 1000) / 1000;
}

function bigramMatrix(tokens) {
  const counts = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = `${tokens[i]}→${tokens[i + 1]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return [...counts.entries()]
    .map(([pair, c]) => ({ pair, count: c, probability: Math.round((c / total) * 1000) / 1000 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
}

function tagFrequency(symbols) {
  const counts = new Map();
  for (const sym of symbols) {
    for (const tag of sym.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function rankGlyphs(symbols, structural) {
  const tokenIndex = structural.tokenIndex || {};
  const ranked = symbols.map((sym) => {
    const isRegistry = String(sym.id || '').startsWith('registry_');
    const registryBoost = isRegistry ? 1.15 : 1;
    const tagWeight = (sym.tags || []).length * 0.05;
    const tokenId = tokenIndex[sym.id] || null;
    return {
      id: sym.id,
      name: sym.name,
      filename: sym.filename,
      description: sym.description,
      tags: sym.tags || [],
      source: sym.source,
      tokenId,
      registryUrl: sym.registryUrl || null,
      score: registryBoost + tagWeight + (isRegistry ? 0.2 : 0),
    };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

export function resolveResearchBudget(budgetUsd, { useRawBudget = false } = {}) {
  const budget = Math.max(0.25, Math.min(Number(budgetUsd) || DMT_RESEARCH_DEFAULT_BUDGET_USD, 5));
  if (useRawBudget) {
    return {
      budgetUsd: budget,
      apiBudgetUsd: budget,
      chargeUsd: budget,
      useRawBudget: true,
    };
  }
  const apiBudgetUsd = Math.round((budget / TOKEN_MARKUP) * 10000) / 10000;
  return {
    budgetUsd: budget,
    apiBudgetUsd,
    chargeUsd: budget,
    useRawBudget: false,
  };
}

export function researchRawCostForBudget(budgetUsd, useRawBudget = false) {
  const { apiBudgetUsd, chargeUsd } = resolveResearchBudget(budgetUsd, { useRawBudget });
  return { rawCostUsd: apiBudgetUsd, chargeUsd };
}

export function buildCorpusPreview() {
  const catalog = loadDmtCatalog();
  const structural = loadStructuralCatalog();
  const registry = loadRegistryRecords();
  const symbols = catalog.symbols || [];
  const tokens = (structural.tokens || []).map((t) => t.token_id);
  const ranked = rankGlyphs(symbols, structural);

  return {
    symbolCount: symbols.length,
    registryCount: registry.glyphCount || registry.glyphs?.length || 0,
    tokenCount: tokens.length,
    clusterCount: structural.clustering?.clusterCount || 0,
    tagFrequency: tagFrequency(symbols),
    topGlyphs: ranked.slice(0, 12).map(({ id, name, filename, tokenId, tags }) => ({
      id,
      name,
      filename,
      tokenId,
      tags,
    })),
    shannonEntropyCatalog: shannonEntropy(tokens),
    dataSources: [
      'dmtcode.com registry (Supabase registry_glyphs)',
      'DMT Code archetype catalogue',
      'structural_manifest.json clustering',
    ],
  };
}

async function compareGlyphToScripts(glyph, { provider = 'gemini', byok = {} }) {
  const b64 = readGlyphBase64(glyph.filename);
  if (!b64) {
    return { glyphId: glyph.id, error: 'Glyph image not found', matches: [] };
  }
  const prompt = `${COMPARE_PROMPT}\n\nGlyph id: ${glyph.id}\nGlyph name: ${glyph.name}\nCompare against: ${SCRIPT_TARGETS.join(', ')}`;
  const text = await runVision({
    provider: provider === 'grok' ? 'grok' : 'gemini',
    byok,
    prompt,
    images: [b64],
    mimeType: 'image/png',
    maxTokens: 2048,
  });
  const parsed = extractJson(text) || {};
  const matches = (parsed.matches || [])
    .filter((m) => Number(m.similarityScore) >= 0.45)
    .sort((a, b) => Number(b.similarityScore) - Number(a.similarityScore));
  return {
    glyphId: glyph.id,
    glyphName: glyph.name,
    filename: glyph.filename,
    tokenId: glyph.tokenId,
    matches: matches.slice(0, 5),
    topologyAssessment: parsed.topologyAssessment || {},
    linguisticLikelihood: Number(parsed.linguisticLikelihood) || 0,
    notes: parsed.notes || '',
    provider: provider === 'grok' ? 'grok' : 'gemini',
  };
}

function assessSystemType(stats, comparisons) {
  const highMatches = comparisons.flatMap((c) =>
    (c.matches || []).filter((m) => Number(m.similarityScore) >= 0.65),
  );
  const avgLinguistic =
    comparisons.reduce((s, c) => s + (Number(c.linguisticLikelihood) || 0), 0) /
    Math.max(comparisons.length, 1);
  const entropy = stats.shannonEntropy;

  let classification = 'geometric_primitives';
  let confidence = 0.55;
  const rationale = [];

  if (highMatches.length >= 3 && avgLinguistic >= 0.5) {
    classification = 'structured_symbolic_system';
    confidence = 0.72;
    rationale.push(`${highMatches.length} high-similarity script matches across compared glyphs.`);
  } else if (highMatches.length >= 1) {
    classification = 'hybrid_geometric_linguistic';
    confidence = 0.62;
    rationale.push('Some glyphs show script-like correspondence without corpus-wide consistency.');
  } else if (entropy < 2.5) {
    classification = 'repeating_geometric_motifs';
    confidence = 0.58;
    rationale.push('Low token entropy suggests repeated geometric motifs rather than open vocabulary.');
  } else {
    rationale.push('No strong cross-script convergence; motifs appear primarily geometric.');
  }

  if (entropy >= 3.5) {
    rationale.push(`Catalog token entropy ${entropy} bits suggests diverse symbol inventory.`);
  }

  return {
    classification,
    confidence: Math.round(confidence * 100) / 100,
    rationale,
    promisingScriptMatches: highMatches.length,
    avgLinguisticLikelihood: Math.round(avgLinguistic * 100) / 100,
  };
}

function synthesisPrompt(stats, comparisons, assessment) {
  return `You are lead researcher on the DMT Code decoder project. Write a concise research synthesis.

DATA:
- Symbols in catalogue: ${stats.symbolCount}
- Registry glyphs: ${stats.registryCount}
- Shannon entropy (token ids): ${stats.shannonEntropy}
- Top tags: ${stats.tagFrequency.slice(0, 8).map((t) => t.tag).join(', ')}
- Top transitions: ${stats.topBigrams.slice(0, 5).map((b) => b.pair).join(', ')}
- Script comparisons run: ${comparisons.length}
- Promising matches (>=0.65): ${assessment.promisingScriptMatches}
- System classification: ${assessment.classification}

Return JSON only:
{
  "headline": "one sentence",
  "summary": "2-3 sentences",
  "namingHypotheses": [{"name": "proposed label", "glyphIds": [], "rationale": ""}],
  "nextExperiments": ["string"],
  "confidenceInStructuredLanguage": 0.0-1.0
}`;
}

/**
 * Run paid corpus research within API budget.
 */
export async function runDmtMatrixResearch(opts = {}) {
  const {
    budgetUsd = DMT_RESEARCH_DEFAULT_BUDGET_USD,
    useRawBudget = false,
    visionProvider = 'auto',
    byok = {},
    db = null,
    uid = null,
  } = opts;

  const budget = resolveResearchBudget(budgetUsd, { useRawBudget });
  const maxGlyphs = Math.max(
    3,
    Math.min(12, Math.floor(budget.apiBudgetUsd / DMT_RESEARCH_RAW_PER_GLYPH)),
  );

  const catalog = loadDmtCatalog();
  const structural = loadStructuralCatalog();
  const registry = loadRegistryRecords();
  const symbols = catalog.symbols || [];
  const ranked = rankGlyphs(symbols, structural);

  const tokens = (structural.tokens || []).map((t) => t.token_id);
  const tokenSeq = tokens.length ? tokens : ranked.map((g) => g.tokenId || g.id).filter(Boolean);

  const stats = {
    symbolCount: symbols.length,
    registryCount: registry.glyphCount || 0,
    archetypeCount: symbols.length - (registry.glyphCount || 0),
    tokenCount: tokenSeq.length,
    shannonEntropy: shannonEntropy(tokenSeq),
    tagFrequency: tagFrequency(symbols),
    topBigrams: bigramMatrix(tokenSeq),
    topTrigrams: (() => {
      const grams = [];
      for (let i = 0; i < tokenSeq.length - 2; i++) {
        grams.push(`${tokenSeq[i]}|${tokenSeq[i + 1]}|${tokenSeq[i + 2]}`);
      }
      const c = new Map();
      for (const g of grams) c.set(g, (c.get(g) || 0) + 1);
      return [...c.entries()]
        .map(([seq, count]) => ({ seq, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    })(),
    frequencyRanking: ranked.slice(0, 20).map((g, i) => ({
      rank: i + 1,
      id: g.id,
      name: g.name,
      tokenId: g.tokenId,
      filename: g.filename,
      tags: g.tags,
      score: Math.round(g.score * 100) / 100,
    })),
    clustering: structural.clustering || null,
  };

  // Session history enrichment
  if (db && uid) {
    try {
      const snap = await db
        .collection('dmt_matrix_sessions')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      const sessionTokens = [];
      for (const doc of snap.docs) {
        const syntax = doc.data().syntax;
        if (syntax?.tokenSequence?.length) sessionTokens.push(...syntax.tokenSequence);
      }
      if (sessionTokens.length) {
        stats.sessionTokenCount = sessionTokens.length;
        stats.sessionEntropy = shannonEntropy(sessionTokens);
        stats.sessionBigrams = bigramMatrix(sessionTokens).slice(0, 10);
      }
    } catch {
      /* non-fatal */
    }
  }

  const toCompare = ranked.slice(0, maxGlyphs);
  const comparisons = [];
  let spentUsd = 0;
  const providerOrder =
    visionProvider === 'grok' ? ['grok'] : visionProvider === 'gemini' ? ['gemini'] : ['gemini', 'grok'];

  for (const glyph of toCompare) {
    if (spentUsd + DMT_RESEARCH_RAW_PER_GLYPH > budget.apiBudgetUsd + 0.001) break;
    let result = null;
    for (const prov of providerOrder) {
      try {
        result = await compareGlyphToScripts(glyph, { provider: prov, byok });
        spentUsd += DMT_RESEARCH_RAW_PER_GLYPH;
        break;
      } catch {
        /* try next provider */
      }
    }
    if (result) comparisons.push(result);
  }

  const assessment = assessSystemType(stats, comparisons);

  let synthesis = null;
  const synthesisBudget = 0.12;
  if (spentUsd + synthesisBudget <= budget.apiBudgetUsd + 0.001) {
    try {
      const prov = providerOrder[0];
      const text = await runChat({
        provider: prov,
        byok,
        prompt: synthesisPrompt(stats, comparisons, assessment),
        json: true,
        maxTokens: 1500,
      });
      synthesis = extractJson(text);
      spentUsd += synthesisBudget;
    } catch {
      synthesis = {
        headline: 'Corpus analysis complete',
        summary: `Analyzed ${stats.symbolCount} glyphs with ${comparisons.length} script comparisons. Classification: ${assessment.classification.replace(/_/g, ' ')}.`,
        namingHypotheses: [],
        nextExperiments: ['Collect more registry submissions', 'Run matrix photo decodes for sequence data'],
        confidenceInStructuredLanguage: assessment.avgLinguisticLikelihood,
      };
    }
  }

  const promising = comparisons
    .flatMap((c) =>
      (c.matches || [])
        .filter((m) => Number(m.similarityScore) >= 0.65)
        .map((m) => ({
          glyphId: c.glyphId,
          glyphName: c.glyphName,
          filename: c.filename,
          script: m.script,
          characterOrForm: m.characterOrForm,
          similarityScore: m.similarityScore,
          reasoning: m.reasoning,
        })),
    )
    .sort((a, b) => Number(b.similarityScore) - Number(a.similarityScore))
    .slice(0, 12);

  return {
    reportId: randomUUID(),
    generatedAt: new Date().toISOString(),
    budget: {
      ...budget,
      apiSpentUsd: Math.round(spentUsd * 1000) / 1000,
      glyphsCompared: comparisons.length,
    },
    stats,
    comparisons,
    promisingMatches: promising,
    assessment,
    synthesis,
    scriptsComparedAgainst: SCRIPT_TARGETS,
  };
}

export async function saveDmtResearchReport(db, uid, report, { email } = {}) {
  const doc = {
    uid,
    email: email || null,
    reportId: report.reportId,
    generatedAt: report.generatedAt,
    budget: report.budget,
    assessment: report.assessment,
    stats: {
      symbolCount: report.stats.symbolCount,
      shannonEntropy: report.stats.shannonEntropy,
      promisingMatches: report.promisingMatches?.length || 0,
    },
    synthesis: report.synthesis,
    fullReport: report,
    createdAt: new Date(),
  };
  await db.collection('dmt_matrix_research').doc(report.reportId).set(doc);
  return doc;
}
