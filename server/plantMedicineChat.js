/**
 * Plant medicine AI chat — Grok + Living Knowledge RAG context, billed via Hive credits.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as hiveUsage from './hiveUsage.js';
import { ensureHiveUser, getHiveAccount } from './hiveBilling.js';
import { grokChatMessages } from './socialPosts/grokProvider.js';
import {
  getCachedGrokChatModel,
  getCachedGrokVisionModel,
  resolveLatestGrokModels,
} from './grokModelResolver.js';
import { DIAGNOSE_GROK_VISION_RAW } from './diagnoseBilling.js';
import { buildGrokUserContent } from './prosGrokMessage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURE_ID = 'plant_medicine_chat';
const VISION_FEATURE_ID = 'plant_medicine_vision';
const PLANT_CHAT_RAW_COST = 0.006;
/** Photo plant ID uses Hive credits (vision), same order of magnitude as Diagnose photo. */
const PLANT_VISION_RAW_COST = Number(process.env.PLANT_MEDICINE_VISION_RAW_COST ?? DIAGNOSE_GROK_VISION_RAW);
/** Ask AiBhive uses Hive credits — only paid feature besides adding states. */
const PLANT_CHAT_FREE = false;

let ragIndex = null;

function loadRagIndex() {
  if (!ragIndex) {
    const p = path.join(__dirname, 'plantMedicineRagIndex.json');
    ragIndex = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return ragIndex;
}

export function resolvePlantHiveUserId(firebaseUid) {
  return `web_${firebaseUid}`;
}

export function getPlantRagEntry(plantId) {
  return loadRagIndex().plants?.[plantId] ?? null;
}

function formatPlantBlock(plant) {
  const lines = [
    `### ${plant.commonName} (${plant.scientificName})`,
    `- ID: ${plant.id}`,
    `- Category: ${plant.category} · Uses: ${plant.uses}`,
    plant.regions?.length ? `- Regions: ${plant.regions.join(', ')}` : '',
    `- Habitat: ${plant.habitat}`,
    `- Identification: ${plant.identification}`,
    plant.lookalikes?.length ? `- Toxic look-alikes: ${plant.lookalikes.join(' | ')}` : '',
    plant.edibleNotes ? `- Edible notes: ${plant.edibleNotes}` : '',
    plant.medicinalNotes ? `- Medicinal notes: ${plant.medicinalNotes}` : '',
    plant.holisticNotes ? `- Holistic notes: ${plant.holisticNotes}` : '',
    plant.preparation ? `- Preparation: ${plant.preparation}` : '',
    `- Harvest season: ${plant.harvestSeason}`,
    plant.safetyWarnings?.length ? `- Safety warnings: ${plant.safetyWarnings.join(' | ')}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export function buildPlantRagContext(plantId) {
  const plant = getPlantRagEntry(plantId);
  if (!plant) return null;

  const related = Object.values(loadRagIndex().plants || {})
    .filter(
      (p) =>
        p.id !== plantId &&
        p.category === plant.category &&
        p.regions?.some((r) => plant.regions?.includes(r)),
    )
    .slice(0, 3);

  const relatedBlocks = related.map((p) => formatPlantBlock(p)).join('\n\n');

  return [
    formatPlantBlock(plant),
    relatedBlocks ? `\n--- Related species in the same region/category ---\n${relatedBlocks}` : '',
    '\n--- General safety ---',
    'Never eat a wild plant or mushroom without 100% identification.',
    'Oregon Poison Center / California Poison Control: 1-800-222-1222.',
    'This library is educational — not medical advice.',
  ]
    .filter(Boolean)
    .join('\n');
}

const SYSTEM_PROMPT = `You are AiBhive Living Knowledge — the research assistant for wild plants, mushrooms, holistic protocols, hypnosis & energy work, and animal health in our community library.

RULES:
- Stay STRICTLY on topic for the focus article or species in context.
- Use ONLY the library context provided below. If the answer is not in context, say you are not sure and recommend expert confirmation.
- For foraging: ALWAYS mention toxic look-alikes when discussing edibility.
- Never encourage eating anything without 100% ID. Never give psilocybin cultivation steps.
- For health topics: educational only — not medical or veterinary advice.
- Be warm, concise, and practical. Prefer bullet points. Keep answers under 300 words unless the user asks for detail.`;

export async function runPlantMedicineChat(db, hiveUserId, opts) {
  const message = String(opts.message || '').trim().slice(0, 2000);
  const plantId = String(opts.plantId || '').trim();
  const essayId = String(opts.essayId || '').trim();
  const library = String(opts.library || '').trim();
  const topicId = String(opts.topicId || '').trim();
  const contextText = String(opts.contextText || '').trim();
  const focusTitle = String(opts.focusTitle || '').trim();

  if (!message) return { ok: false, error: 'Message is required.' };

  let libraryContext = null;
  let focusLabel = focusTitle;

  if (plantId) {
    libraryContext = buildPlantRagContext(plantId);
    if (!libraryContext) return { ok: false, error: 'Plant not found in library.' };
    const plant = getPlantRagEntry(plantId);
    focusLabel = plant?.commonName || focusTitle;
  } else if (contextText) {
    libraryContext = contextText.slice(0, 12000);
  } else {
    return { ok: false, error: 'No library context for this item.' };
  }

  if (!focusLabel && essayId) focusLabel = essayId;
  if (!focusLabel && topicId) focusLabel = topicId;

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'Hive AI is temporarily unavailable.' };

  await ensureHiveUser(db, hiveUserId);

  if (!PLANT_CHAT_FREE) {
    const budget = await hiveUsage.checkTokenBudget(db, hiveUserId, PLANT_CHAT_RAW_COST * 1.2, FEATURE_ID, {
      email: opts.email,
    });
    if (!budget.ok) {
      return {
        ok: false,
        needPayment: true,
        code: 'credits_depleted',
        error: 'Hive credits depleted — add credits to continue.',
        amountUsd: budget.amountUsd ?? 0.02,
        budget: budget.budget,
      };
    }
  }

  await resolveLatestGrokModels();
  const model = process.env.PLANT_MEDICINE_CHAT_MODEL || getCachedGrokChatModel();

  const history = (opts.history || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const plant = plantId ? getPlantRagEntry(plantId) : null;
  const system = [
    SYSTEM_PROMPT,
    focusLabel ? `\nCurrent focus: ${focusLabel}` : '',
    '\n--- LIBRARY CONTEXT (authoritative) ---\n',
    libraryContext,
  ].join('');

  const messages = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: message },
  ];

  const reply = await grokChatMessages(apiKey, model, messages, {
    temperature: 0.25,
    max_tokens: 1200,
  });

  if (!reply) return { ok: false, error: 'No response from Hive AI.' };

  let chargedUsd = 0;
  let account = await getHiveAccount(db, hiveUserId);

  if (!PLANT_CHAT_FREE) {
    const usage = await hiveUsage.recordTokenUsage(db, hiveUserId, {
      rawCostUsd: PLANT_CHAT_RAW_COST,
      feature: FEATURE_ID,
      summary: `Living Knowledge: ${focusLabel || plant?.commonName || 'chat'}`,
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

    chargedUsd = usage.chargedUsd ?? PLANT_CHAT_RAW_COST;
    account = await getHiveAccount(db, hiveUserId);
  }

  return {
    ok: true,
    reply,
    source: 'grok',
    model,
    chargedUsd,
    account: {
      creditBalanceUsd: account.creditBalanceUsd,
      usage: account.usage,
    },
  };
}

const LIVING_KNOWLEDGE_SYSTEM = `You are Grok, powering AiBhive Living Knowledge — a specially trained holistic AI agent for wild plants, edible fungi, holistic protocols, hypnosis/energy education, and animal wellness research.

Behave like AiBhive Diagnose / Pros Diagnose AI: conversational, practical, multi-turn. When the ask is incomplete, ask a short clarifying follow-up before a long answer.

RULES:
- Prefer the Living Knowledge library context provided below as authoritative. Quote or paraphrase it when answering.
- Educational tone only — not medical, veterinary, or licensed therapy advice. Never invent dosages, illegal cultivation steps, or guaranteed cures.
- If the user's question is vague or missing a critical detail (species vs symptom, region, edible vs medicinal intent, human vs animal, acute vs chronic), ask 1–2 focused clarifying questions FIRST — same style as a field co-pilot. Wait for their reply in the conversation history before dumping a full essay.
- When you have enough detail (including prior turns), answer clearly (under ~350 words) with safety callouts when relevant.
- If the library context still does not cover the topic after clarifying, say so honestly and invite them to Contribute so the community archive grows.
- Keep a warm, smart, concise voice. Use short paragraphs or bullets for steps/ID features.
- Stay on Living Knowledge topics; politely redirect unrelated asks.
- Use conversation history: treat short replies like "yarrow" or "QHHT" as answers to your previous clarifier.`;

/** Free-form Living Knowledge chat using client-retrieved RAG context (also free). */
export async function runLivingKnowledgeChat(db, hiveUserId, opts) {
  const message = String(opts.message || '').trim().slice(0, 2000);
  const context = String(opts.context || '').trim().slice(0, 14000);
  const scope = String(opts.scope || 'all').trim().slice(0, 40);
  if (!message) return { ok: false, error: 'Message is required.' };

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'Hive AI is temporarily unavailable.' };

  await ensureHiveUser(db, hiveUserId);

  await resolveLatestGrokModels();
  const model = process.env.PLANT_MEDICINE_CHAT_MODEL || getCachedGrokChatModel();

  const history = (opts.history || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2500) }));

  const system = [
    LIVING_KNOWLEDGE_SYSTEM,
    `\nActive library scope: ${scope}`,
    context
      ? `\n--- LIVING KNOWLEDGE CONTEXT (authoritative) ---\n${context}`
      : '\n--- LIVING KNOWLEDGE CONTEXT ---\n(No strong library hits yet. Ask clarifying questions, then answer carefully or invite a community contribution.)',
  ].join('');

  const reply = await grokChatMessages(
    apiKey,
    model,
    [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
    {
      temperature: 0.35,
      max_tokens: 1400,
    },
  );

  if (!reply) return { ok: false, error: 'No response from Hive AI.' };

  const account = await getHiveAccount(db, hiveUserId);
  return {
    ok: true,
    reply,
    source: 'grok',
    model,
    chargedUsd: 0,
    account: {
      creditBalanceUsd: account.creditBalanceUsd,
      usage: account.usage,
    },
  };
}

const PLANT_PHOTO_ID_SYSTEM = `You are Grok, powering AiBhive Living Knowledge plant photo identification — same field-co-pilot style as AiBhive Diagnose / Pros.

You identify wild plants and mushrooms from user photos for educational foraging safety.

RULES:
- Prefer matches from the Living Knowledge plant catalog provided below when morphology fits.
- Be honest about uncertainty. Never claim 100% ID from a single photo unless diagnostic features are unmistakable.
- ALWAYS list dangerous / toxic look-alikes for any edible candidate — this is critical.
- Never encourage eating anything without 100% in-person confirmation. Never give cultivation steps for controlled substances.
- Educational only — not medical advice.
- Oregon / California Poison Control: 1-800-222-1222.

OUTPUT FORMAT (required):
1) A short readable field report (markdown) with:
   - Top ID candidate(s) with confidence as High / Medium / Low
   - Key visual traits you used
   - Dangerous look-alikes (call out toxicity clearly)
   - Safety next steps
2) Then a JSON block exactly between markers:

<<<PLANT_ID_JSON>>>
{
  "candidates": [
    {
      "commonName": "string",
      "scientificName": "string",
      "confidence": 0.0,
      "confidenceLabel": "high|medium|low",
      "rationale": "short",
      "plantIdHint": "optional-library-id-or-empty"
    }
  ],
  "dangerousLookalikes": [
    {
      "commonName": "string",
      "scientificName": "string",
      "whyDangerous": "string",
      "plantIdHint": "optional-library-id-or-empty"
    }
  ],
  "certaintyNote": "string"
}
<<<END_PLANT_ID_JSON>>>

confidence is 0–1. Put highest-confidence candidate first. Include 1–3 candidates. Include 1–4 dangerous lookalikes when relevant.`;

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPlantFromCatalog(commonName, scientificName, plantIdHint) {
  const plants = Object.values(loadRagIndex().plants || {});
  if (plantIdHint) {
    const byId = plants.find((p) => p.id === plantIdHint);
    if (byId) return byId;
  }
  const sci = normalizeName(scientificName);
  const common = normalizeName(commonName);
  if (sci) {
    const exactSci = plants.find((p) => normalizeName(p.scientificName) === sci);
    if (exactSci) return exactSci;
    const partialSci = plants.find(
      (p) => normalizeName(p.scientificName).includes(sci) || sci.includes(normalizeName(p.scientificName)),
    );
    if (partialSci) return partialSci;
  }
  if (common) {
    const exactCommon = plants.find((p) => normalizeName(p.commonName) === common);
    if (exactCommon) return exactCommon;
    const aka = plants.find((p) => (p.alsoKnownAs || []).some((a) => normalizeName(a) === common));
    if (aka) return aka;
    const partial = plants.find(
      (p) => normalizeName(p.commonName).includes(common) || common.includes(normalizeName(p.commonName)),
    );
    if (partial) return partial;
  }
  return null;
}

function parsePlantIdJson(reply) {
  const marked = reply.match(/<<<PLANT_ID_JSON>>>\s*([\s\S]*?)\s*<<<END_PLANT_ID_JSON>>>/);
  const raw = marked?.[1] || reply.match(/\{[\s\S]*"candidates"[\s\S]*\}/)?.[0];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function enrichCandidate(row, kind) {
  const matched = matchPlantFromCatalog(row.commonName, row.scientificName, row.plantIdHint);
  const confidence = Math.max(0, Math.min(1, Number(row.confidence) || 0));
  let confidenceLabel = String(row.confidenceLabel || '').toLowerCase();
  if (!['high', 'medium', 'low'].includes(confidenceLabel)) {
    confidenceLabel = confidence >= 0.75 ? 'high' : confidence >= 0.45 ? 'medium' : 'low';
  }
  return {
    kind,
    commonName: row.commonName || matched?.commonName || 'Unknown',
    scientificName: row.scientificName || matched?.scientificName || '',
    confidence,
    confidenceLabel,
    rationale: row.rationale || row.whyDangerous || '',
    whyDangerous: row.whyDangerous || '',
    plantId: matched?.id || null,
    lookalikes: matched?.lookalikes || [],
    safetyWarnings: matched?.safetyWarnings || [],
    category: matched?.category || null,
    uses: matched?.uses || null,
  };
}

function buildPhotoIdCatalogContext(limit = 80) {
  const plants = Object.values(loadRagIndex().plants || {}).slice(0, limit);
  return plants
    .map(
      (p) =>
        `- ${p.id}: ${p.commonName} (${p.scientificName}) [${p.category}/${p.uses}]` +
        (p.lookalikes?.length ? ` | lookalikes: ${p.lookalikes.slice(0, 2).join('; ')}` : ''),
    )
    .join('\n');
}

/**
 * Paid Grok vision plant photo ID — Hive credits (same cost class as Diagnose photo).
 * Returns readable reply + structured candidates / dangerous lookalikes matched to library IDs.
 */
export async function runPlantPhotoIdentify(db, hiveUserId, opts) {
  const message = String(opts.message || 'Identify this plant from the photo.').trim().slice(0, 2000);
  const attachment = opts.attachment;
  const context = String(opts.context || '').trim().slice(0, 8000);
  if (!attachment?.base64) return { ok: false, error: 'Photo attachment is required.' };

  const base64 = String(attachment.base64).replace(/^data:[^;]+;base64,/, '');
  if (base64.length < 80) return { ok: false, error: 'Photo data looks empty.' };
  if (base64.length > 7_500_000) return { ok: false, error: 'Photo too large — try a smaller image.' };

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'Hive AI is temporarily unavailable.' };

  await ensureHiveUser(db, hiveUserId);

  const rawCost = PLANT_VISION_RAW_COST;
  const { markedUsd: markedEstimate } = await hiveUsage.markCostForUser(db, hiveUserId, rawCost);
  const budget = await hiveUsage.checkTokenBudget(db, hiveUserId, markedEstimate, VISION_FEATURE_ID, {
    email: opts.email,
  });
  if (!budget.ok) {
    return {
      ok: false,
      needPayment: true,
      code: 'credits_depleted',
      error: 'Hive credits depleted — add credits for photo plant ID.',
      amountUsd: budget.amountUsd ?? markedEstimate,
      budget: budget.budget,
    };
  }

  await resolveLatestGrokModels();
  const model =
    process.env.PLANT_MEDICINE_VISION_MODEL ||
    process.env.GROK_DIAGNOSE_VISION_MODEL ||
    getCachedGrokVisionModel();

  const catalog = buildPhotoIdCatalogContext(100);
  const system = [
    PLANT_PHOTO_ID_SYSTEM,
    '\n--- LIVING KNOWLEDGE PLANT CATALOG (prefer these IDs when they fit) ---\n',
    catalog,
    context ? `\n--- EXTRA CLIENT RAG CONTEXT ---\n${context}` : '',
  ].join('');

  const userContent = buildGrokUserContent(message, {
    base64,
    mimeType: attachment.mimeType || 'image/jpeg',
  });

  const reply = await grokChatMessages(
    apiKey,
    model,
    [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    {
      temperature: 0.2,
      max_tokens: 2200,
      vision: true,
    },
  );

  if (!reply) return { ok: false, error: 'No response from Hive AI.' };

  const usage = await hiveUsage.recordTokenUsage(db, hiveUserId, {
    rawCostUsd: rawCost,
    feature: VISION_FEATURE_ID,
    summary: 'Living Knowledge photo plant ID',
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

  const parsed = parsePlantIdJson(reply);
  const candidates = Array.isArray(parsed?.candidates)
    ? parsed.candidates.slice(0, 4).map((row) => enrichCandidate(row, 'candidate'))
    : [];
  const dangerousLookalikes = Array.isArray(parsed?.dangerousLookalikes)
    ? parsed.dangerousLookalikes.slice(0, 5).map((row) => enrichCandidate(row, 'lookalike'))
    : [];

  // If model forgot lookalikes but top candidate is in library, surface library lookalikes.
  if (dangerousLookalikes.length === 0 && candidates[0]?.lookalikes?.length) {
    for (const text of candidates[0].lookalikes.slice(0, 3)) {
      dangerousLookalikes.push({
        kind: 'lookalike',
        commonName: String(text).split('—')[0].split('-')[0].trim().slice(0, 80),
        scientificName: '',
        confidence: 0,
        confidenceLabel: 'medium',
        rationale: text,
        whyDangerous: text,
        plantId: null,
        lookalikes: [],
        safetyWarnings: [],
        category: null,
        uses: null,
      });
    }
  }

  const prose = reply
    .replace(/<<<PLANT_ID_JSON>>>[\s\S]*?<<<END_PLANT_ID_JSON>>>/g, '')
    .trim();

  const account = await getHiveAccount(db, hiveUserId);
  return {
    ok: true,
    reply: prose || reply,
    candidates,
    dangerousLookalikes,
    certaintyNote: parsed?.certaintyNote || '',
    source: 'grok-vision',
    model,
    chargedUsd: usage.chargedUsd ?? markedEstimate,
    account: {
      creditBalanceUsd: account.creditBalanceUsd,
      usage: account.usage,
    },
  };
}
