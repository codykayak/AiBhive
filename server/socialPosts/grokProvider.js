const XAI_BASE = 'https://api.x.ai/v1';

const CHAT_MODEL_FALLBACKS = [
  process.env.GROK_CHAT_MODEL,
  process.env.GROK_DIAGNOSE_MODEL,
  process.env.INTEL_GROK_MODEL,
  'grok-3-mini',
  'grok-2-1212',
].filter(Boolean);

const VISION_MODEL_FALLBACKS = [
  process.env.GROK_VISION_MODEL,
  process.env.GROK_DIAGNOSE_VISION_MODEL,
  process.env.FABLE_GROK_VISION_MODEL,
  'grok-2-vision-1212',
  'grok-vision-beta',
].filter(Boolean);

function extractJson(text) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }
  return JSON.parse(candidate);
}

function uniqueModels(models) {
  const seen = new Set();
  const out = [];
  for (const m of models) {
    const id = String(m || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function messagesIncludeImage(messages) {
  return (messages || []).some((m) => {
    if (!m || !Array.isArray(m.content)) return false;
    return m.content.some((part) => part && (part.type === 'image_url' || part.type === 'image'));
  });
}

function normalizeMessages(messages) {
  return (messages || [])
    .filter((m) => m && (m.role === 'system' || m.role === 'user' || m.role === 'assistant'))
    .map((m) => {
      if (typeof m.content === 'string') return m;
      if (Array.isArray(m.content)) return m;
      return { role: m.role, content: String(m.content ?? '') };
    });
}

async function grokChatMessagesOnce(apiKey, model, messages, opts = {}) {
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.6;
  const max_tokens = typeof opts.max_tokens === 'number' ? opts.max_tokens : 4096;
  const normalized = normalizeMessages(messages);

  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: normalized,
      temperature,
      max_tokens,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Grok API error (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.model = model;
    throw err;
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Grok.');
  return text;
}

export async function grokChat(apiKey, model, prompt, system = '') {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return grokChatMessages(apiKey, model, messages);
}

/**
 * Multi-turn Grok chat with automatic model fallback on 400/404.
 * Pass opts.vision=true when messages include image_url parts.
 */
export async function grokChatMessages(apiKey, model, messages, opts = {}) {
  const hasImage = opts.vision ?? messagesIncludeImage(messages);
  const chain = uniqueModels([
    model,
    ...(hasImage ? VISION_MODEL_FALLBACKS : CHAT_MODEL_FALLBACKS),
  ]);

  let lastErr;
  for (const candidate of chain) {
    try {
      return await grokChatMessagesOnce(apiKey, candidate, messages, opts);
    } catch (err) {
      lastErr = err;
      const retryable = err?.status === 400 || err?.status === 404 || err?.status === 422;
      if (!retryable || candidate === chain[chain.length - 1]) break;
      console.warn(`[grok] model ${candidate} failed (${err?.status || '?'}): ${err?.message} — trying fallback`);
    }
  }
  throw lastErr || new Error('Grok chat failed');
}

const ASPECT_MAP = {
  landscape: '16:9',
  portrait: '3:4',
};

export async function grokGenerateImage(apiKey, model, prompt, aspectHint = 'landscape') {
  const aspect = ASPECT_MAP[aspectHint.includes('portrait') ? 'portrait' : 'landscape'] || '16:9';

  const res = await fetch(`${XAI_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      aspect_ratio: aspect,
      response_format: 'b64_json',
      n: 1,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Grok image API error (${res.status})`);
  }

  const b64 = data.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, 'base64');

  const url = data.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error('Failed to download Grok image URL.');
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error('No image returned from Grok.');
}

export async function grokResearchArticle(topic, brand, textModel, apiKey) {
  const prompt = `You are a content researcher for ${brand.name} (${brand.siteUrl}), an AI automation company.

TOPIC: ${topic.title}
ANGLE: ${topic.angle}
SITE: ${topic.siteLink}

Find or synthesize ONE credible, newsworthy angle related to AI automation, business operations, or enterprise technology.

Return ONLY valid JSON:
{
  "title": "headline",
  "url": "https://credible-source-url-or-site-link",
  "source": "publication or ${brand.name}",
  "publishedAt": "YYYY-MM-DD",
  "summary": "2-3 sentence summary",
  "whyRelevant": "1 sentence for business owners"
}`;

  const raw = await grokChat(apiKey, textModel, prompt);
  return { article: extractJson(raw), raw };
}

export async function grokWriteCaptions(topic, article, knowledge, brand, platformSpecs, textModel, apiKey) {
  const prompt = `You are the social media manager for ${brand.name} (${brand.siteUrl}).

BRAND VOICE: ${brand.voice}

TOPIC: ${topic.title}
ANGLE: ${topic.angle}
ARTICLE: ${article.title} — ${article.summary}

KNOWLEDGE BASE:
${knowledge}

PLATFORMS:
${platformSpecs}

Return ONLY valid JSON:
{
  "facebook": { "caption": "..." },
  "instagram": { "caption": "...", "hashtags": ["#AI", "#automation"] },
  "x": { "caption": "..." },
  "imageHeadline": "5-10 word punchy headline to render ON the image (must match post theme)",
  "imageScene": "Visual scene description only — no text in this field",
  "imagePrompt": "Legacy combined field — same as imageScene"
}`;

  const raw = await grokChat(apiKey, textModel, prompt);
  return extractJson(raw);
}

export async function grokGeneratePlatformImage(apiKey, imageModel, imagePrompt, brand, aspectHint) {
  const buffer = await grokGenerateImage(apiKey, imageModel, imagePrompt, aspectHint);
  return { buffer, model: imageModel };
}
