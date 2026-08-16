/**
 * AI iridology iris photo analysis — Grok vision + Hive credits (feature: iridology_vision).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as hiveUsage from './hiveUsage.js';
import { ensureHiveUser, getHiveAccount } from './hiveBilling.js';
import { grokChatMessages } from './socialPosts/grokProvider.js';
import {
  getCachedGrokVisionModel,
  resolveLatestGrokModels,
} from './grokModelResolver.js';
import { DIAGNOSE_GROK_VISION_RAW } from './diagnoseBilling.js';
import { buildGrokUserContent, MAX_VISION_ATTACHMENTS } from './prosGrokMessage.js';
import { collectVisionAttachments } from './plantMedicineChat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IRIDOLOGY_VISION_FEATURE_ID = 'iridology_vision';
const IRIDOLOGY_VISION_RAW_COST = Number(
  process.env.PLANT_MEDICINE_VISION_RAW_COST ?? process.env.IRIDOLOGY_VISION_RAW_COST ?? DIAGNOSE_GROK_VISION_RAW,
);

function visionRawCostForCount(imageCount) {
  const n = Math.max(1, Math.min(MAX_VISION_ATTACHMENTS, imageCount || 1));
  return IRIDOLOGY_VISION_RAW_COST * (1 + 0.18 * (n - 1));
}

let knowledgeCache = null;

function loadIridologyKnowledge() {
  if (!knowledgeCache) {
    const p = path.join(__dirname, 'iridologyKnowledge.json');
    knowledgeCache = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return knowledgeCache;
}

function buildIridologyRagContext() {
  const k = loadIridologyKnowledge();
  const parts = [
    '--- IRIDOLOGY KNOWLEDGE (educational RAG) ---',
    JSON.stringify(
      {
        methodologies: k.methodologies,
        zones: k.zones,
        signs: k.signs,
        constitutionalTypes: k.constitutionalTypes,
        photoQualityTips: k.photoQualityTips,
        cautions: k.cautions,
      },
      null,
      0,
    ).slice(0, 6000),
  ];
  return parts.join('\n');
}

const IRIDOLOGY_VISION_SYSTEM = `You are AiBhive Living Knowledge educational iridology analysis powered by Bhive Credits (Grok vision).

STRICT RULES:
- NOT medical diagnosis. Use phrasing: "iridology literature associates…", "possible tendency…", "educational interpretation only".
- Iridology is controversial and NOT validated clinical science — acknowledge uncertainty in every report.
- Photo quality gate: if blur, glare, partial iris, contact lens artifacts, or extreme darkness → set photoQuality poor/fair and fill retakeAdvice; do not invent fine fiber detail.
- Left vs right eye: respect user hint; if unknown, state uncertainty in eye field.
- Methodology requested by user: jensen | physical | integrated | all — weight observations accordingly.
- Integrated: require multiple converging signs before medium/high confidence tendencies.
- Rayid/personality reads only when methodology is "all", clearly labeled non-medical.
- Urgent symptoms or serious patterns → cautions must say seek licensed medical / emergency care, not iris reading.
- Never state "you have disease X".

PROSE REPORT (required before JSON — educational, in-depth):
Write 5–8 sections with markdown headings exactly as shown when photoQuality is good or fair; if poor, still write Photo assessment + Retake guidance (shorter):
## Photo assessment
## Global iris overview
## Fiber & texture (physical iridology)
## Zone & sign findings
## Constitutional read
## Integrated summary
## What to do next
Each section: 2–4 sentences, specific to THIS photo. Cite visible features; admit limits. Total prose target 450–900 words for good photos.

Return prose PLUS structured JSON wrapped exactly like:
<<<IRIDOLOGY_JSON>>>
{
  "photoQuality": "good|fair|poor",
  "methodology": "integrated|jensen|physical|all",
  "eye": "left|right|both|unknown",
  "constitutionalType": { "label": "lymphatic|biliary|hematogenic|neurogenic|mixed|unknown", "confidence": "high|medium|low", "rationale": "..." },
  "photoAssessment": "1-3 sentences on lighting, focus, framing, artifacts",
  "globalOverview": "color, symmetry, visible stroma pattern",
  "fiberAndTexture": "open/dense fibers, rings, arcus if visible",
  "integratedSummary": "cross-check of signs with uncertainty",
  "nextSteps": ["retake tip or professional care if needed"],
  "observations": [
    { "zone": "7-8 o'clock lung sector", "sign": "lacuna", "meaning": "...", "confidence": "low|medium|high", "sources": ["jensen"] }
  ],
  "wellnessTendencies": ["..."],
  "cautions": ["..."],
  "retakeAdvice": null
}
<<<END_IRIDOLOGY_JSON>>>`;

function parseIridologyJson(reply) {
  const marked = reply.match(/<<<IRIDOLOGY_JSON>>>\s*([\s\S]*?)\s*<<<END_IRIDOLOGY_JSON>>>/);
  const raw = marked?.[1] || reply.match(/\{[\s\S]*"photoQuality"[\s\S]*\}/)?.[0];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeConfidence(value) {
  const v = String(value || 'low').toLowerCase();
  return v === 'high' || v === 'medium' ? v : 'low';
}

function normalizeObservations(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 12).map((row) => ({
    zone: String(row.zone || row.sector || 'general iris').slice(0, 120),
    sign: String(row.sign || row.pattern || 'observation').slice(0, 80),
    meaning: String(row.meaning || row.interpretation || '').slice(0, 500),
    confidence: normalizeConfidence(row.confidence),
    sources: Array.isArray(row.sources) ? row.sources.map((s) => String(s).slice(0, 40)).slice(0, 4) : [],
  }));
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} hiveUserId
 * @param {object} opts
 */
export async function runIridologyAnalyze(db, hiveUserId, opts) {
  const methodology = ['integrated', 'jensen', 'physical', 'all'].includes(String(opts.methodology || 'integrated'))
    ? String(opts.methodology)
    : 'integrated';
  const eyeHint = ['left', 'right', 'both', 'unknown'].includes(String(opts.eye || 'unknown'))
    ? String(opts.eye)
    : 'unknown';
  const notes = String(opts.notes || '').trim().slice(0, 2000);
  const visionImages = collectVisionAttachments(opts);
  if (!visionImages.length) return { ok: false, error: 'At least one iris photo is required.' };

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'Hive AI is temporarily unavailable.' };

  await ensureHiveUser(db, hiveUserId);

  const rawCost = visionRawCostForCount(visionImages.length);
  const { markedUsd: markedEstimate } = await hiveUsage.markCostForUser(db, hiveUserId, rawCost);
  const budget = await hiveUsage.checkTokenBudget(db, hiveUserId, markedEstimate, IRIDOLOGY_VISION_FEATURE_ID, {
    email: opts.email,
  });
  if (!budget.ok) {
    return {
      ok: false,
      needPayment: true,
      code: 'credits_depleted',
      error: 'Hive credits depleted — add credits for iris photo analysis.',
      amountUsd: budget.amountUsd ?? markedEstimate,
      budget: budget.budget,
    };
  }

  await resolveLatestGrokModels();
  const model =
    process.env.PLANT_MEDICINE_VISION_MODEL ||
    process.env.GROK_DIAGNOSE_VISION_MODEL ||
    getCachedGrokVisionModel();

  const multiNote =
    visionImages.length > 1
      ? `\nThe user attached ${visionImages.length} iris photo(s) — compare if left/right pair; note asymmetry cautiously.\n`
      : '';
  const system = [IRIDOLOGY_VISION_SYSTEM, multiNote, buildIridologyRagContext()].join('\n');

  const userMessage = [
    `Analyze this iris photo using ${methodology} iridology methodology.`,
    eyeHint !== 'unknown' ? `Eye side hint: ${eyeHint}.` : '',
    notes ? `User notes: ${notes}` : '',
    'Educational interpretation only — structured JSON required.',
  ]
    .filter(Boolean)
    .join(' ');

  const userContent = buildGrokUserContent(
    userMessage,
    visionImages.length === 1 ? { base64: visionImages[0].base64, mimeType: visionImages[0].mimeType } : null,
    visionImages.length > 1 ? visionImages : null,
  );

  let reply;
  try {
    reply = await grokChatMessages(
      apiKey,
      model,
      [
        { role: 'system', content: system.slice(0, 14000) },
        { role: 'user', content: userContent },
      ],
      {
        temperature: 0.25,
        max_tokens: 3600,
        vision: true,
      },
    );
  } catch (err) {
    console.error('[iridology/analyze] Bhive Credits vision failed:', err?.message || err, { model });
    return {
      ok: false,
      error:
        err?.message ||
        'Bhive Credits could not read this iris photo — try natural light, fill the frame, and use JPEG/PNG.',
      code: 'grok_vision_failed',
    };
  }

  if (!reply) return { ok: false, error: 'No response from Hive AI.' };

  const usage = await hiveUsage.recordTokenUsage(db, hiveUserId, {
    rawCostUsd: rawCost,
    feature: IRIDOLOGY_VISION_FEATURE_ID,
    summary: 'Living Knowledge iridology iris analysis',
    email: opts.email,
  });

  if (!usage.ok) {
    return {
      ok: false,
      needPayment: !!usage.needUpgrade,
      code: usage.needUpgrade ? 'credits_depleted' : 'billing_failed',
      error: usage.needUpgrade ? 'Hive credits depleted' : usage.error || 'Billing failed',
      budget: usage.budget,
    };
  }

  const parsed = parseIridologyJson(reply);
  const prose = reply.replace(/<<<IRIDOLOGY_JSON>>>[\s\S]*?<<<END_IRIDOLOGY_JSON>>>/g, '').trim();

  const structured = {
    photoQuality: ['good', 'fair', 'poor'].includes(String(parsed?.photoQuality)) ? parsed.photoQuality : 'fair',
    methodology: ['integrated', 'jensen', 'physical', 'all'].includes(String(parsed?.methodology))
      ? parsed.methodology
      : methodology,
    eye: ['left', 'right', 'both', 'unknown'].includes(String(parsed?.eye)) ? parsed.eye : eyeHint,
    constitutionalType: parsed?.constitutionalType
      ? {
          label: String(parsed.constitutionalType.label || 'unknown').slice(0, 40),
          confidence: normalizeConfidence(parsed.constitutionalType.confidence),
          rationale: String(parsed.constitutionalType.rationale || '').slice(0, 600),
        }
      : null,
    observations: normalizeObservations(parsed?.observations),
    wellnessTendencies: Array.isArray(parsed?.wellnessTendencies)
      ? parsed.wellnessTendencies.map((t) => String(t).slice(0, 300)).slice(0, 8)
      : [],
    cautions: Array.isArray(parsed?.cautions) ? parsed.cautions.map((c) => String(c).slice(0, 400)).slice(0, 8) : [],
    retakeAdvice: parsed?.retakeAdvice ? String(parsed.retakeAdvice).slice(0, 500) : null,
    photoAssessment: parsed?.photoAssessment ? String(parsed.photoAssessment).slice(0, 800) : undefined,
    globalOverview: parsed?.globalOverview ? String(parsed.globalOverview).slice(0, 800) : undefined,
    fiberAndTexture: parsed?.fiberAndTexture ? String(parsed.fiberAndTexture).slice(0, 800) : undefined,
    integratedSummary: parsed?.integratedSummary ? String(parsed.integratedSummary).slice(0, 1000) : undefined,
    nextSteps: Array.isArray(parsed?.nextSteps)
      ? parsed.nextSteps.map((s) => String(s).slice(0, 400)).slice(0, 6)
      : undefined,
  };

  const account = await getHiveAccount(db, hiveUserId);
  return {
    ok: true,
    reply: prose || reply,
    structured,
    source: 'grok-vision',
    model,
    chargedUsd: usage.chargedUsd ?? markedEstimate,
    account: {
      creditBalanceUsd: account.creditBalanceUsd,
      usage: account.usage,
    },
  };
}
