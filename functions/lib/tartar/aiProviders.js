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
  const systemPrompt = opts.systemPrompt?.trim() || EXTRACTION_SYSTEM;

  let result;
  switch (provider) {
    case 'gemini':
      result = await callGemini(apiKey, userPrompt, systemPrompt);
      break;
    case 'grok':
      result = await callGrok(apiKey, userPrompt, systemPrompt);
      break;
    case 'kimi':
      result = await callKimi(apiKey, userPrompt, systemPrompt);
      break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  return {
    mentions: parseMentionJson(result.text),
    usage: result.usage,
  };
}

const ANOMALY_FOCUS_SYSTEM = `You analyze historical research anomalies detected in archival data.
Given statistical anomaly candidates and a researcher focus prompt, return a JSON array of enhanced objects:
- entityName, entityType, score (0-100), summary (1-2 sentences), aiInsight (why this matters per focus), keep (boolean)
Only include anomalies relevant to the focus. JSON only, no markdown.`;

export async function analyzeAnomaliesWithFocus(provider, apiKey, { anomalies, customPrompt, sampleMentions = [] }) {
  if (!customPrompt?.trim() || !anomalies?.length) {
    return { anomalies, usage: { inputTokens: 0, outputTokens: 0 } };
  }

  const userPrompt = `Researcher focus:\n${customPrompt.trim()}\n\nStatistical anomalies:\n${JSON.stringify(anomalies.slice(0, 25), null, 2)}\n\nSample mentions for context:\n${JSON.stringify(sampleMentions.slice(0, 15), null, 2)}`;

  let result;
  switch (provider) {
    case 'gemini':
      result = await callGemini(apiKey, userPrompt, ANOMALY_FOCUS_SYSTEM);
      break;
    case 'grok':
      result = await callGrok(apiKey, userPrompt, ANOMALY_FOCUS_SYSTEM);
      break;
    case 'kimi':
      result = await callKimi(apiKey, userPrompt, ANOMALY_FOCUS_SYSTEM);
      break;
    default:
      return { anomalies, usage: { inputTokens: 0, outputTokens: 0 } };
  }

  const enhanced = parseAnomalyJson(result.text);
  if (!enhanced.length) return { anomalies, usage: result.usage };

  const byName = Object.fromEntries(enhanced.map((a) => [String(a.entityName).toLowerCase(), a]));
  const merged = anomalies
    .map((a) => {
      const hit = byName[String(a.entityName).toLowerCase()];
      if (!hit || hit.keep === false) return hit ? null : a;
      return {
        ...a,
        score: hit.score ?? a.score,
        summary: hit.summary ?? a.summary,
        aiInsight: hit.aiInsight ?? null,
        focusPrompt: customPrompt.trim(),
      };
    })
    .filter(Boolean);

  return { anomalies: merged.length ? merged : anomalies, usage: result.usage };
}

function parseAnomalyJson(text) {
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

async function callGemini(apiKey, userPrompt, systemInstruction = EXTRACTION_SYSTEM) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
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

async function callGrok(apiKey, userPrompt, systemContent = EXTRACTION_SYSTEM) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: systemContent },
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

async function callKimi(apiKey, userPrompt, systemContent = EXTRACTION_SYSTEM) {
  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: systemContent },
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
