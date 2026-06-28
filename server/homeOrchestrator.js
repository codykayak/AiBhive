/**
 * Hive Home Assistant — web search relay + knowledge serving.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import * as hiveUsage from './hiveUsage.js';
import { runIntelCloudTool } from './intelOsint.js';
import { HOME_ASSISTANT_KNOWLEDGE } from './homeAssistantKnowledgeBundled.js';
import { parseHomeAssistantJson } from './assistantJson.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOME_CHAT_MODEL = process.env.HOME_ASSIST_MODEL || 'gemini-2.5-flash';
const HOME_CHAT_RAW_COST = 0.006;

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
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
  if (fs.existsSync(live)) {
    return fs.readFileSync(live, 'utf8');
  }
  return HOME_ASSISTANT_KNOWLEDGE;
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
 * Billed Hive Cloud chat turn for the mobile home assistant.
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

  const gemini = getGemini();
  if (!gemini) {
    return { ok: false, error: 'Hive AI is warming up. Try again in a moment.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, HOME_CHAT_RAW_COST * 1.2, 'home_assist_chat');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.02 };
  }

  const history = (opts.history || [])
    .filter((t) => t?.content?.trim() && (t.role === 'user' || t.role === 'ai'))
    .slice(-10);

  const contents = [];
  for (const turn of history) {
    contents.push({
      role: turn.role === 'ai' ? 'model' : 'user',
      parts: [{ text: String(turn.content).trim() }],
    });
  }
  const userParts = [{ text: message }];
  if (attachment?.base64) {
    userParts.push({
      inlineData: {
        mimeType: attachment.mime || 'image/jpeg',
        data: attachment.base64,
      },
    });
    userParts[0].text =
      message +
      `\n\n[User attached an image${attachment.width && attachment.height ? ` (${attachment.width}x${attachment.height})` : ''}. Describe it and help with their request.]`;
  }
  contents.push({ role: 'user', parts: userParts });

  try {
    const response = await gemini.models.generateContent({
      model: HOME_CHAT_MODEL,
      contents,
      config: {
        systemInstruction: String(opts.systemInstruction || '').slice(0, 24000),
        temperature: 0.45,
        maxOutputTokens: 1400,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { ok: false, error: 'No response from Hive AI.' };
    }

    const parsed = parseHomeAssistantJson(text);

    const charge = await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: HOME_CHAT_RAW_COST,
      feature: 'home_assist_chat',
      summary: 'Home assistant chat',
    });
    if (!charge.ok) {
      return { ok: false, needPayment: true, amountUsd: charge.amountUsd ?? 0.02 };
    }

    return {
      ok: true,
      text: parsed.ok ? parsed.reply : parsed.reply,
      reply: parsed.ok ? parsed.reply : parsed.reply,
      action: parsed.ok ? parsed.action : { reply: parsed.reply, intent: 'chat', buildStage: 'none' },
      chargedUsd: charge.chargedUsd ?? 0,
    };
  } catch (err) {
    console.error('[hive/home-assist/chat]', err.message || err);
    return { ok: false, error: err.message || 'Hive chat failed.' };
  }
}
