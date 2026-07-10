/**
 * Intel Agent chat for web — Claude (Research), Grok, or Gemini fallback.
 * Billed via Hive credits (Hive credits).
 */
import { GoogleGenAI } from '@google/genai';
import { grokChatMessages } from './socialPosts/grokProvider.js';
import { anthropicApiKey, claudeChatMessages, intelClaudeModel } from './anthropicProvider.js';
import * as hiveUsage from './hiveUsage.js';
import { markCostForUser } from './hiveUsage.js';
import { getCachedGrokChatModel, resolveLatestGrokModels } from './grokModelResolver.js';

const GEMINI_MODEL = process.env.INTEL_GEMINI_MODEL || 'gemini-2.5-flash';
const CHAT_RAW_COST = Number(process.env.INTEL_CHAT_RAW_COST ?? 0.008);

async function resolveGrokModel() {
  if (process.env.INTEL_GROK_MODEL) return process.env.INTEL_GROK_MODEL;
  await resolveLatestGrokModels();
  return getCachedGrokChatModel();
}

const DEFAULT_SYSTEM = `You are AiBhive Intel Agent — an OSINT research assistant for authorized business, security, and journalistic research.

Rules:
- Synthesize only from evidence provided in the conversation or tool results.
- Be clear when data is missing or uncertain.
- Never suggest illegal access, hacking, or harassment.
- Format briefs with: Executive summary, Key findings (bullets), Recommended next steps.
- Plain English — no jargon unless the user asks for technical detail.`;

let geminiClient;

function getGemini() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

function grokKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

/** Which Intel LLM backends are configured on the server. */
export function intelLlmStatus() {
  return {
    claude: Boolean(anthropicApiKey()),
    grok: Boolean(grokKey()),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    models: {
      claude: intelClaudeModel(),
      grok: process.env.INTEL_GROK_MODEL || getCachedGrokChatModel(),
      gemini: GEMINI_MODEL,
    },
    defaultProvider: process.env.INTEL_LLM_PROVIDER || (anthropicApiKey() ? 'claude' : grokKey() ? 'grok' : 'gemini'),
  };
}

function providerAvailable(id) {
  if (id === 'claude') return Boolean(anthropicApiKey());
  if (id === 'grok') return Boolean(grokKey());
  if (id === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
  return false;
}

function resolveIntelProvider(requested) {
  const pref = String(requested || process.env.INTEL_LLM_PROVIDER || '').trim().toLowerCase();
  const tryOrder =
    pref === 'claude'
      ? ['claude', 'grok', 'gemini']
      : pref === 'grok'
        ? ['grok', 'claude', 'gemini']
        : pref === 'gemini'
          ? ['gemini', 'claude', 'grok']
          : anthropicApiKey()
            ? ['claude', 'grok', 'gemini']
            : grokKey()
              ? ['grok', 'claude', 'gemini']
              : ['gemini', 'claude', 'grok'];

  for (const id of tryOrder) {
    if (providerAvailable(id)) return id;
  }
  return null;
}

function buildGrokMessages(systemInstruction, history, message) {
  const messages = [];
  const system = String(systemInstruction || DEFAULT_SYSTEM).slice(0, 12000);
  if (system) messages.push({ role: 'system', content: system });
  for (const turn of history) {
    if (!turn?.content?.trim()) continue;
    messages.push({
      role: turn.role === 'ai' ? 'assistant' : 'user',
      content: String(turn.content).trim().slice(0, 8000),
    });
  }
  messages.push({ role: 'user', content: String(message).trim().slice(0, 8000) });
  return messages;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runIntelResearchChat(db, userId, opts) {
  const message = String(opts.message || '').trim();
  if (!message) return { ok: false, error: 'Empty message.' };

  const { markedUsd: markedEstimate } = await markCostForUser(db, userId, CHAT_RAW_COST);

  const budget = await hiveUsage.checkTokenBudget(db, userId, markedEstimate, 'hive_cloud_intel', {
    email: opts.email,
  });
  if (!budget.ok) {
    return {
      ok: false,
      needPayment: true,
      amountUsd: budget.amountUsd ?? markedEstimate,
      suggestedPlan: budget.suggestedPlan ?? 'starter',
    };
  }

  const history = (opts.history || [])
    .filter((t) => t?.content?.trim() && (t.role === 'user' || t.role === 'ai'))
    .slice(-12);

  const contextBlock = [
    opts.targetContext ? `[RESEARCH CONTEXT]\n${String(opts.targetContext).slice(0, 14000)}` : '',
    opts.documentContext ? `[UPLOADED DOCUMENTS]\n${String(opts.documentContext).slice(0, 16000)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const userMessage = contextBlock ? `${message}\n\n${contextBlock}` : message;

  const systemInstruction = String(opts.systemInstruction || DEFAULT_SYSTEM).slice(0, 12000);
  const provider = resolveIntelProvider(opts.llmProvider);

  if (!provider) {
    return {
      ok: false,
      error:
        'No Intel AI provider configured. Add ANTHROPIC_API_KEY, XAI_API_KEY, or GEMINI_API_KEY on the server.',
    };
  }

  let usedGrokModel = process.env.INTEL_GROK_MODEL || getCachedGrokChatModel();

  try {
    let text = '';
    if (provider === 'claude') {
      const messages = buildGrokMessages(systemInstruction, history, userMessage).filter(
        (m) => m.role !== 'system'
      );
      text = await claudeChatMessages(
        anthropicApiKey(),
        intelClaudeModel(),
        messages,
        systemInstruction,
        2400
      );
    } else if (provider === 'grok') {
      const messages = buildGrokMessages(systemInstruction, history, userMessage);
      usedGrokModel = await resolveGrokModel();
      text = await grokChatMessages(grokKey(), usedGrokModel, messages);
    } else {
      const gemini = getGemini();
      if (!gemini) {
        return { ok: false, error: 'Hive AI is warming up. Try again in a moment.' };
      }
      const contents = [];
      for (const turn of history) {
        contents.push({
          role: turn.role === 'ai' ? 'model' : 'user',
          parts: [{ text: String(turn.content).trim() }],
        });
      }
      contents.push({ role: 'user', parts: [{ text: userMessage }] });
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.45,
          maxOutputTokens: 2400,
        },
      });
      text = response.text?.trim() || '';
    }

    if (!text) return { ok: false, error: 'No response from Intel AI.' };

    const charge = await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: CHAT_RAW_COST,
      feature: 'hive_cloud_intel',
      summary: `Intel chat (${provider})`,
      email: opts.email,
    });

    if (!charge.ok) {
      return { ok: false, needPayment: true, amountUsd: charge.amountUsd ?? markedEstimate };
    }

    return {
      ok: true,
      text,
      provider,
      model:
        provider === 'claude'
          ? intelClaudeModel()
          : provider === 'grok'
            ? usedGrokModel
            : GEMINI_MODEL,
      chargedUsd: charge.chargedUsd ?? markedEstimate,
      budget: charge.budget,
    };
  } catch (err) {
    console.error('[intel/research-chat]', err.message || err);
    return { ok: false, error: err.message || 'Intel chat failed.' };
  }
}

export { DEFAULT_SYSTEM as INTEL_RESEARCH_SYSTEM };
