const XAI_BASE = 'https://api.x.ai/v1';

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

export async function grokChat(apiKey, model, prompt, system = '') {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return grokChatMessages(apiKey, model, messages);
}

/** Multi-turn Grok chat (system + history + latest user message). */
export async function grokChatMessages(apiKey, model, messages, opts = {}) {
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.6;
  const max_tokens = typeof opts.max_tokens === 'number' ? opts.max_tokens : 4096;
  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Grok API error (${res.status})`);
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Grok.');
  return text;
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

SITE KNOWLEDGE:
${knowledge.slice(0, 6000)}

TODAY'S TOPIC: ${topic.title} — ${topic.angle}
SITE LINK: ${topic.siteLink}

NEWS TO COMMENT ON:
Title: ${article.title}
Source: ${article.source}
URL: ${article.url}
Summary: ${article.summary}

Return ONLY valid JSON:
{
  "facebook": { "caption": "${platformSpecs.facebook.captionGuide}" },
  "instagram": { "caption": "${platformSpecs.instagram.captionGuide}", "hashtags": ["#AI", "#automation"] },
  "x": { "caption": "${platformSpecs.x.captionGuide}" },
  "imagePrompt": "Short headline + visual scene. ${brand.imageStyle}"
}`;

  const raw = await grokChat(apiKey, textModel, prompt);
  return { captions: extractJson(raw), raw };
}

export async function grokGeneratePlatformImage(apiKey, imageModel, imagePrompt, brand, aspectHint) {
  const fullPrompt = `${imagePrompt}

${brand.imageStyle}
Aspect: ${aspectHint}.
Professional social marketing graphic for ${brand.name}.`;

  const buffer = await grokGenerateImage(apiKey, imageModel, fullPrompt, aspectHint);
  return { buffer, model: imageModel };
}
