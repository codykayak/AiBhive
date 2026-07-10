/**
 * Hive Home Assistant — web search relay + knowledge serving.
 * Site chats use the latest Grok model (weekly refresh via grokModelResolver).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as hiveUsage from './hiveUsage.js';
import { runIntelCloudTool } from './intelOsint.js';
import { HOME_ASSISTANT_KNOWLEDGE } from './homeAssistantKnowledgeBundled.js';
import { parseHomeAssistantJson } from './assistantJson.js';
import { enrichHomeAssistantAction } from './homeAssistOrchestrate.js';
import { grokChatMessages } from './socialPosts/grokProvider.js';
import { getCachedGrokChatModel, resolveLatestGrokModels } from './grokModelResolver.js';
import { loadHiveMissionMarkdown } from '../shared/hiveMission.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOME_CHAT_RAW_COST = 0.006;

function getXaiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

/** Pick Serp for short factual queries; Firecrawl search for deeper research. */
function pickSearchTool(query) {
  const q = String(query || '').toLowerCase();
  if (/(license|contractor|regulation|law|expired|dbpr|osint|investigate|company|domain)/.test(q)) {
    return 'firecrawl_search';
  }
  return 'serp_search';
}

export function getHomeAssistantKnowledgeMarkdown() {
  const live = path.join(__dirname, '../shared/home-assistant-knowledge.md');
  let base = HOME_ASSISTANT_KNOWLEDGE;
  if (fs.existsSync(live)) {
    base = fs.readFileSync(live, 'utf8');
  }
  let mission = '';
  try {
    mission = loadHiveMissionMarkdown();
  } catch {
    mission = '';
  }
  return [
    base,
    '',
    '--- COMPLETE PRODUCT MISSION (authoritative) ---',
    String(mission || '').slice(0, 12000),
    '',
    'You understand AiBhive\'s complete product mission: build apps from plain English, research with multi-agent Research Lab, meter Hive credits fairly, and grow a community-sourced library. Never invent features. Never mention internal cost markups — only Hive credits and plans.',
  ].join('\n');
}

/**
 * Run a billed web search for the home assistant.
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runHomeAssistantWebSearch(db, userId, query) {
  const trimmed = String(query || '').trim().slice(0, 500);
  if (!trimmed) {
    return { ok: false, error: 'Empty search query.' };
  }

  const toolId = pickSearchTool(trimmed);
  return runIntelCloudTool(db, hiveUsage, {
    userId,
    toolId,
    params: {
      company: trimmed,
      domain: '',
      userIntent: trimmed,
      url: '',
    },
  });
}

/**
 * Billed Hive Cloud chat turn for the home assistant (latest Grok).
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runHomeAssistantChat(db, userId, opts) {
  const message = String(opts.message || '').trim().slice(0, 2000);
  if (!message) {
    return { ok: false, error: 'Empty message.' };
  }

  const attachment = opts.attachment;
  if (attachment?.base64 && attachment.base64.length > 900_000) {
    return { ok: false, error: 'Image attachment is too large. Try a smaller photo.' };
  }

  const apiKey = getXaiKey();
  if (!apiKey) {
    return { ok: false, error: 'Hive AI is warming up. Try again in a moment.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, HOME_CHAT_RAW_COST * 1.2, 'home_assist_chat');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.02 };
  }

  await resolveLatestGrokModels();
  const model = process.env.HOME_ASSIST_MODEL || getCachedGrokChatModel();

  const history = (opts.history || [])
    .filter((t) => t?.content?.trim() && (t.role === 'user' || t.role === 'ai'))
    .slice(-10);

  const system =
    String(opts.systemInstruction || getHomeAssistantKnowledgeMarkdown()).slice(0, 24000) +
    '\n\nYou are powered by Grok on AiBhive. Follow the complete product mission. Prefer Hive credits language — never discuss markup percentages.';

  const messages = [{ role: 'system', content: system }];
  for (const turn of history) {
    messages.push({
      role: turn.role === 'ai' ? 'assistant' : 'user',
      content: String(turn.content).trim(),
    });
  }

  if (attachment?.base64) {
    const mime = attachment.mime || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${attachment.base64}`;
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            message +
            `\n\n[User attached an image${attachment.width && attachment.height ? ` (${attachment.width}x${attachment.height})` : ''}. Describe it and help with their request. Respond with valid JSON only as specified.]`,
        },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  try {
    const text = await grokChatMessages(apiKey, model, messages);
    if (!text) {
      return { ok: false, error: 'No response from Hive AI.' };
    }

    const parsed = parseHomeAssistantJson(text);
    let action = parsed.ok ? parsed.action : { reply: parsed.reply, intent: 'chat', buildStage: 'none' };
    action = await enrichHomeAssistantAction(db, message, action, {
      failureContext: opts.failureContext,
    });

    const charge = await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: HOME_CHAT_RAW_COST,
      feature: 'home_assist_chat',
      summary: 'Home assistant chat (Grok)',
    });
    if (!charge.ok) {
      return { ok: false, needPayment: true, amountUsd: charge.amountUsd ?? 0.02 };
    }

    return {
      ok: true,
      text: action.reply,
      reply: action.reply,
      action,
      chargedUsd: charge.chargedUsd ?? 0,
      model,
    };
  } catch (err) {
    console.error('[hive/home-assist/chat]', err.message || err);
    return { ok: false, error: err.message || 'Hive chat failed.' };
  }
}
