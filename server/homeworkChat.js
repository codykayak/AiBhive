/**
 * Homework assignment completion — Grok-powered answers grounded in private RAG corpus.
 */
import { grokChatMessages } from './socialPosts/grokProvider.js';
import { extractDocumentText } from './intelDocuments.js';

const GROK_MODEL = process.env.HOMEWORK_GROK_MODEL || process.env.INTEL_GROK_MODEL || 'grok-3-mini';

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

/**
 * @param {string} assignmentText
 * @param {string} ragContext
 */
export async function completeHomeworkAssignment(assignmentText, ragContext) {
  const assignment = String(assignmentText || '').trim();
  if (!assignment) return { ok: false, error: 'Assignment text is required.' };

  const apiKey = grokKey();
  if (!apiKey) {
    return { ok: false, error: 'Grok API is not configured (XAI_API_KEY).' };
  }

  const contextBlock = String(ragContext || '').trim();
  const userMessage = [
    '## Assignment to complete',
    assignment,
    '',
    contextBlock
      ? `## Reference documents (RAG corpus)\nUse these as your sole factual source:\n\n${contextBlock.slice(0, 80000)}`
      : '## Reference documents\n(No reference documents uploaded yet — answer from general knowledge but note that no RAG corpus was provided.)',
  ].join('\n');

  try {
    const messages = [
      { role: 'system', content: HOMEWORK_SYSTEM },
      { role: 'user', content: userMessage.slice(0, 120000) },
    ];
    const text = await grokChatMessages(apiKey, GROK_MODEL, messages);
    if (!text) return { ok: false, error: 'No response from Grok.' };

    return {
      ok: true,
      text,
      provider: 'grok',
      model: GROK_MODEL,
      hadRagContext: Boolean(contextBlock),
    };
  } catch (err) {
    console.error('[homework/complete]', err.message || err);
    return { ok: false, error: err.message || 'Homework completion failed.' };
  }
}

/**
 * @param {{ name?: string, mimeType?: string, base64: string }} file
 */
export async function extractAssignmentText(file) {
  return extractDocumentText(file);
}
