/**
 * Homework assignment completion — Grok-powered answers grounded in private RAG corpus.
 */
import { grokChatMessages } from './socialPosts/grokProvider.js';
import { extractDocumentText } from './intelDocuments.js';
import { getCachedGrokChatModel, resolveLatestGrokModels } from './grokModelResolver.js';

const HOMEWORK_CHAT_SYSTEM = `You are a private research assistant helping the user explore and understand their uploaded reference library.

Rules:
- Answer using ONLY the reference documents provided in your context.
- Cite which document(s) you used when making key claims (use the document titles).
- If the documents do not contain enough information, say what is missing — do not invent facts, quotes, or citations.
- Be clear and helpful: summarize, compare, explain concepts, find definitions, or pull out themes from the material.
- Use bullet points or short sections when listing multiple items.
- You may quote brief excerpts from the documents when it helps the user understand.`;

const HOMEWORK_SYSTEM = `You are a private homework assistant. Your job is to complete assignments using ONLY the reference documents provided in the RAG context.

Rules:
- Answer thoroughly and accurately based on the reference documents.
- If the reference documents do not contain enough information, say what is missing and answer what you can from the available material.
- Cite which reference document(s) you used when making key claims.
- Write in clear, complete sentences appropriate for academic or professional work.
- Do not mention that you are an AI unless the assignment explicitly asks for it.
- Do not fabricate facts, quotes, or citations not supported by the reference documents.`;

function grokKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

async function resolveHomeworkModel() {
  if (process.env.HOMEWORK_GROK_MODEL || process.env.INTEL_GROK_MODEL) {
    return process.env.HOMEWORK_GROK_MODEL || process.env.INTEL_GROK_MODEL;
  }
  await resolveLatestGrokModels();
  return getCachedGrokChatModel();
}

/**
 * @param {string} assignmentText
 * @param {string} ragContext
 * @param {string} [customPrompt] - user's personal instructions for style, tone, approach
 */
export async function completeHomeworkAssignment(assignmentText, ragContext, customPrompt) {
  const assignment = String(assignmentText || '').trim();
  if (!assignment) return { ok: false, error: 'Assignment text is required.' };

  const apiKey = grokKey();
  if (!apiKey) {
    return { ok: false, error: 'Grok API is not configured (XAI_API_KEY).' };
  }

  const contextBlock = String(ragContext || '').trim();
  const personalInstructions = String(customPrompt || '').trim();
  const userMessage = [
    personalInstructions
      ? `## Personal instructions (follow these for tone, style, and how to complete this assignment)\n${personalInstructions}\n`
      : '',
    '## Assignment to complete',
    assignment,
    '',
    contextBlock
      ? `## Reference documents (RAG corpus)\nUse these as your sole factual source:\n\n${contextBlock.slice(0, 80000)}`
      : '## Reference documents\n(No reference documents uploaded yet — answer from general knowledge but note that no RAG corpus was provided.)',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const model = await resolveHomeworkModel();
    const messages = [
      { role: 'system', content: HOMEWORK_SYSTEM },
      { role: 'user', content: userMessage.slice(0, 120000) },
    ];
    const text = await grokChatMessages(apiKey, model, messages);
    if (!text) return { ok: false, error: 'No response from Grok.' };

    return {
      ok: true,
      text,
      provider: 'grok',
      model,
      hadRagContext: Boolean(contextBlock),
    };
  } catch (err) {
    console.error('[homework/complete]', err.message || err);
    return { ok: false, error: err.message || 'Homework completion failed.' };
  }
}

/**
 * Multi-turn chat grounded in the user's homework RAG library.
 * @param {string} message
 * @param {Array<{ role: string, content: string }>} history
 * @param {string} ragContext
 */
export async function chatHomeworkRag(message, history, ragContext) {
  const userMessage = String(message || '').trim();
  if (!userMessage) return { ok: false, error: 'Message is required.' };

  const apiKey = grokKey();
  if (!apiKey) {
    return { ok: false, error: 'Grok API is not configured (XAI_API_KEY).' };
  }

  const contextBlock = String(ragContext || '').trim();
  const systemContent = [
    HOMEWORK_CHAT_SYSTEM,
    '',
    contextBlock
      ? `## Reference documents (RAG corpus)\nUse these as your sole factual source:\n\n${contextBlock.slice(0, 80000)}`
      : '## Reference documents\n(No reference documents uploaded yet.)',
  ].join('\n');

  const prior = Array.isArray(history) ? history : [];
  const trimmedHistory = prior
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim())
    .slice(-16)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).trim().slice(0, 12000),
    }));

  try {
    const model = await resolveHomeworkModel();
    const messages = [
      { role: 'system', content: systemContent.slice(0, 100000) },
      ...trimmedHistory,
      { role: 'user', content: userMessage.slice(0, 12000) },
    ];
    const text = await grokChatMessages(apiKey, model, messages);
    if (!text) return { ok: false, error: 'No response from Grok.' };

    return {
      ok: true,
      reply: text,
      provider: 'grok',
      model,
      hadRagContext: Boolean(contextBlock),
    };
  } catch (err) {
    console.error('[homework/chat]', err.message || err);
    return { ok: false, error: err.message || 'Homework chat failed.' };
  }
}

/**
 * @param {{ name?: string, mimeType?: string, base64: string }} file
 */
export async function extractAssignmentText(file) {
  return extractDocumentText(file);
}
