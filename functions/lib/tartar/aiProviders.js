/**
 * Multi-provider AI abstraction — Grok (xAI), Gemini, Kimi (Moonshot).
 */

const EXTRACTION_SYSTEM = `You extract historical entity mentions from archival text.
Return a JSON array of objects with fields:
- entityName (string)
- role (string: builder, architect, engineer, author, publisher, organization, etc.)
- project (string: building, book, map, article name)
- projectType (string)
- date (string: year or date if known)
- location (string)
- confidence (number 0-1)
Only include clear mentions. Return [] if none found. JSON only, no markdown.`;

/**
 * @param {string} provider
 * @param {string} apiKey
 * @param {string} text
 * @param {object} [opts]
 */
export async function extractMentions(provider, apiKey, text, opts = {}) {
  const truncated = String(text).slice(0, opts.maxChars ?? 12000);
  const userPrompt = `Source: ${opts.sourceTitle ?? 'unknown'}\n\nText:\n${truncated}`;

  let result;
  switch (provider) {
    case 'gemini':
      result = await callGemini(apiKey, userPrompt);
      break;
    case 'grok':
      result = await callGrok(apiKey, userPrompt);
      break;
    case 'kimi':
      result = await callKimi(apiKey, userPrompt);
      break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  return {
    mentions: parseMentionJson(result.text),
    usage: result.usage,
  };
}

async function callGemini(apiKey, userPrompt) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: EXTRACTION_SYSTEM,
  });
  const res = await model.generateContent(userPrompt);
  const text = res.response.text();
  const usage = res.response.usageMetadata ?? {};
  return {
    text,
    usage: {
      inputTokens: usage.promptTokenCount ?? Math.ceil(userPrompt.length / 4),
      outputTokens: usage.candidatesTokenCount ?? Math.ceil(text.length / 4),
    },
  };
}

async function callGrok(apiKey, userPrompt) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '[]';
  return {
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
  };
}

async function callKimi(apiKey, userPrompt) {
  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kimi API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '[]';
  return {
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
  };
}

function parseMentionJson(text) {
  const raw = String(text).trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const arr = JSON.parse(jsonMatch[0]);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export const SUPPORTED_PROVIDERS = ['gemini', 'grok', 'kimi'];
