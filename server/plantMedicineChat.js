/**
 * Plant medicine AI chat — Grok + Living Knowledge RAG context, billed via Hive credits.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as hiveUsage from './hiveUsage.js';
import { ensureHiveUser, getHiveAccount } from './hiveBilling.js';
import { grokChatMessages } from './socialPosts/grokProvider.js';
import { getCachedGrokChatModel, resolveLatestGrokModels } from './grokModelResolver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURE_ID = 'plant_medicine_chat';
const PLANT_CHAT_RAW_COST = 0.006;
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
