/**
 * Parse Home Assistant JSON responses from LLM output.
 * Never surface raw JSON blobs to end users.
 */

function stripCodeFences(text) {
  return String(text || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function extractJsonObject(text) {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }
  return cleaned;
}

/** Try to pull a human reply from broken / partial JSON. */
function salvageReplyFromBrokenJson(text) {
  const raw = String(text || '');
  const replyMatch = raw.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (replyMatch) {
    try {
      return JSON.parse(`"${replyMatch[1]}"`);
    } catch {
      return replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }
  const cleaned = stripCodeFences(raw);
  if (cleaned && !cleaned.startsWith('{')) return cleaned;
  return '';
}

/**
 * @param {string} text
 * @returns {{ ok: true, action: Record<string, unknown>, reply: string } | { ok: false, reply: string }}
 */
export function parseHomeAssistantJson(text) {
  const fallbackReply =
    'I\'m here to help with jobs, research, or building a tool. What would you like to do?';

  if (!text?.trim()) {
    return { ok: false, reply: fallbackReply };
  }

  try {
    const parsed = JSON.parse(extractJsonObject(text));
    const reply = String(parsed.reply || '').trim();
    if (!reply) {
      return { ok: false, reply: fallbackReply };
    }
    return {
      ok: true,
      reply,
      action: {
        reply,
        intent: parsed.intent || 'chat',
        needsWebSearch: !!parsed.needsWebSearch,
        webSearchQuery: parsed.webSearchQuery || '',
        buildStage: parsed.buildStage || 'none',
        buildSummary: parsed.buildSummary || '',
        buildMessage: parsed.buildMessage || '',
        intelIntent: parsed.intelIntent || '',
        intelTargetType: parsed.intelTargetType || undefined,
        intelRegion: parsed.intelRegion || '',
        intelRadiusMiles: parsed.intelRadiusMiles ?? undefined,
        suggestedToolName: parsed.suggestedToolName || '',
        offerTokens: !!parsed.offerTokens,
        tokenReason: parsed.tokenReason || '',
      },
    };
  } catch {
    const salvaged = salvageReplyFromBrokenJson(text);
    if (salvaged) {
      return {
        ok: true,
        reply: salvaged,
        action: { reply: salvaged, intent: 'chat', buildStage: 'none' },
      };
    }
    const plain = stripCodeFences(text);
    if (plain && !plain.startsWith('{')) {
      return {
        ok: true,
        reply: plain,
        action: { reply: plain, intent: 'chat', buildStage: 'none' },
      };
    }
    return { ok: false, reply: fallbackReply };
  }
}
