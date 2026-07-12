/**
 * Fable Scrape — pluggable AI provider layer.
 *
 * One interface (runChat / runVision) across Grok (xAI), Gemini, Claude,
 * Kimi (Moonshot), and DeepSeek so each harvest job can mix-and-match which
 * model does which role and experiment with cost/efficiency. Keys resolve from
 * a per-request BYOK map first, then server env vars.
 */
import { GoogleGenAI } from '@google/genai';
import { claudeChatMessages } from './anthropicProvider.js';

export const PROVIDERS = {
  grok: {
    label: 'Grok (xAI)',
    envKeys: ['XAI_API_KEY', 'GROK_API_KEY'],
    base: process.env.FABLE_GROK_BASE_URL || 'https://api.x.ai/v1',
    style: 'openai',
    vision: true,
    defaultChat: process.env.FABLE_GROK_MODEL || 'grok-3-mini',
    defaultVision: process.env.FABLE_GROK_VISION_MODEL || 'grok-2-vision-1212',
  },
  gemini: {
    label: 'Gemini',
    envKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    style: 'gemini',
    vision: true,
    defaultChat: process.env.FABLE_GEMINI_MODEL || 'gemini-2.5-flash',
    defaultVision: process.env.FABLE_GEMINI_VISION_MODEL || 'gemini-2.5-flash',
  },
  claude: {
    label: 'Claude (Anthropic)',
    envKeys: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'ANTHROPIC_KEY'],
    base: 'https://api.anthropic.com/v1',
    style: 'anthropic',
    vision: true,
    defaultChat: process.env.FABLE_CLAUDE_MODEL || 'claude-sonnet-5',
    defaultVision: process.env.FABLE_CLAUDE_MODEL || 'claude-sonnet-5',
  },
  kimi: {
    label: 'Kimi (Moonshot)',
    envKeys: ['KIMI_API_KEY', 'MOONSHOT_API_KEY'],
    base: process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1',
    style: 'openai',
    vision: false,
    defaultChat: process.env.FABLE_KIMI_MODEL || 'moonshot-v1-8k',
    defaultVision: process.env.FABLE_KIMI_MODEL || 'moonshot-v1-8k',
  },
  deepseek: {
    label: 'DeepSeek',
    envKeys: ['DEEPSEEK_API_KEY'],
    base: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    style: 'openai',
    vision: false,
    defaultChat: process.env.FABLE_DEEPSEEK_MODEL || 'deepseek-chat',
    defaultVision: process.env.FABLE_DEEPSEEK_MODEL || 'deepseek-chat',
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS);

function envKeyFor(provider) {
  const cfg = PROVIDERS[provider];
  if (!cfg) return '';
  for (const name of cfg.envKeys) {
    if (process.env[name]) return process.env[name].trim();
  }
  return '';
}

/** Resolve the API key for a provider: BYOK map first, then server env. */
export function resolveKey(provider, byok = {}) {
  const supplied = byok && typeof byok[provider] === 'string' ? byok[provider].trim() : '';
  return supplied || envKeyFor(provider);
}

/** Report which providers have a usable server key + whether they can do vision. */
export function providerStatus() {
  return PROVIDER_IDS.map((id) => ({
    id,
    label: PROVIDERS[id].label,
    hasServerKey: !!envKeyFor(id),
    vision: PROVIDERS[id].vision,
    defaultChatModel: PROVIDERS[id].defaultChat,
    defaultVisionModel: PROVIDERS[id].defaultVision,
  }));
}

let geminiClients = new Map();
function geminiClient(apiKey) {
  if (!geminiClients.has(apiKey)) geminiClients.set(apiKey, new GoogleGenAI({ apiKey }));
  return geminiClients.get(apiKey);
}

/** Strip ```json fences and parse; returns null on failure. */
export function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[[{]/);
  if (start < 0) return null;
  const slice = body.slice(start);
  try {
    return JSON.parse(slice);
  } catch {
    // try to trim to the last closing brace/bracket
    const end = Math.max(slice.lastIndexOf('}'), slice.lastIndexOf(']'));
    if (end > 0) {
      try {
        return JSON.parse(slice.slice(0, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function openaiChat({ base, apiKey, model, system, prompt, json, maxTokens }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  const body = { model, messages, temperature: 0.4, max_tokens: maxTokens || 4096 };
  if (json) body.response_format = { type: 'json_object' };
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `API error (${res.status})`);
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from model.');
  return text;
}

function isGeminiBillingExhausted(err) {
  const msg = String(err?.message || err || '');
  return (
    /prepayment credits are depleted|RESOURCE_EXHAUSTED|Quota exceeded|billing/i.test(msg) &&
    (/ai\.studio|gemini|google|generativelanguage/i.test(msg) || /429/.test(msg) || /RESOURCE_EXHAUSTED/i.test(msg))
  ) || /prepayment credits are depleted/i.test(msg);
}

function friendlyGeminiBillingError(err) {
  const raw = String(err?.message || err || '');
  if (!isGeminiBillingExhausted(err) && !/prepayment credits are depleted/i.test(raw)) {
    return raw;
  }
  return (
    'Gemini platform credits are depleted (Google AI Studio prepaid). ' +
    'This is Google’s bill for the server GEMINI_API_KEY — not your Hive credit balance. ' +
    'Fixes: (1) switch Vision/OCR to Grok in the AI roster, (2) paste your own Gemini key (BYOK), ' +
    'or (3) top up prepaid credits at https://ai.studio/projects. Admins are not charged Hive credits.'
  );
}

async function geminiGenerateText({ apiKey, model, system, prompt, json }) {
  try {
    const ai = geminiClient(apiKey);
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        ...(system ? { systemInstruction: system } : {}),
        temperature: 0.4,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini.');
    return text;
  } catch (err) {
    throw new Error(friendlyGeminiBillingError(err));
  }
}

async function geminiVisionText({ apiKey, model, prompt, imgs, mimeType }) {
  try {
    const ai = geminiClient(apiKey);
    const contents = [{ text: prompt }, ...imgs.map((b) => ({ inlineData: { mimeType, data: b } }))];
    const response = await ai.models.generateContent({ model, contents });
    const text = response.text?.trim();
    if (!text) throw new Error('Vision model returned no text.');
    return text;
  } catch (err) {
    throw new Error(friendlyGeminiBillingError(err));
  }
}

/**
 * Text chat across any provider.
 * @param {{ provider:string, model?:string, byok?:object, system?:string, prompt:string, json?:boolean, maxTokens?:number }} args
 */
export async function runChat({ provider, model, byok, system, prompt, json = false, maxTokens }) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown AI provider: ${provider}`);
  const apiKey = resolveKey(provider, byok);
  if (!apiKey) throw new Error(`${cfg.label} has no API key. Add one in the AI roster, or set it on the server.`);
  const useModel = model || cfg.defaultChat;

  if (cfg.style === 'gemini') {
    try {
      return await geminiGenerateText({ apiKey, model: useModel, system, prompt, json });
    } catch (err) {
      // Fall back to Grok when Gemini prepaid is empty and a Grok key exists
      if (isGeminiBillingExhausted(err) && resolveKey('grok', byok)) {
        return openaiChat({
          base: PROVIDERS.grok.base,
          apiKey: resolveKey('grok', byok),
          model: PROVIDERS.grok.defaultChat,
          system,
          prompt,
          json,
          maxTokens,
        });
      }
      throw err;
    }
  }
  if (cfg.style === 'anthropic') {
    const text = await claudeChatMessages(apiKey, useModel, [{ role: 'user', content: prompt }], system, maxTokens || 4096);
    if (!text) throw new Error('Empty response from Claude.');
    return text;
  }
  return openaiChat({ base: cfg.base, apiKey, model: useModel, system, prompt, json, maxTokens });
}

/**
 * Vision call (OCR / read image) across vision-capable providers.
 * @param {{ provider:string, model?:string, byok?:object, prompt:string, images:string[], mimeType?:string, maxTokens?:number }} args
 */
export async function runVision({ provider, model, byok, prompt, images, mimeType = 'image/jpeg', maxTokens }) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown AI provider: ${provider}`);
  if (!cfg.vision) {
    throw new Error(`${cfg.label} can't read images. Pick Gemini, Claude, or Grok for the OCR/vision role.`);
  }
  const apiKey = resolveKey(provider, byok);
  if (!apiKey) throw new Error(`${cfg.label} has no API key. Add one in the AI roster, or set it on the server.`);
  const useModel = model || cfg.defaultVision;
  const imgs = (images || []).slice(0, 20);
  if (!imgs.length) throw new Error('No images supplied to vision model.');

  const runGrokVision = async () => {
    const grokKey = resolveKey('grok', byok);
    if (!grokKey) throw new Error('No Grok key available for vision fallback.');
    const content = [
      { type: 'text', text: prompt },
      ...imgs.map((b) => ({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${b}` } })),
    ];
    const res = await fetch(`${PROVIDERS.grok.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokKey}` },
      body: JSON.stringify({
        model: PROVIDERS.grok.defaultVision,
        messages: [{ role: 'user', content }],
        max_tokens: maxTokens || 4096,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Vision API error (${res.status})`);
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Vision model returned no text.');
    return text;
  };

  if (cfg.style === 'gemini') {
    try {
      return await geminiVisionText({ apiKey, model: useModel, prompt, imgs, mimeType });
    } catch (err) {
      if (isGeminiBillingExhausted(err) && resolveKey('grok', byok)) {
        return runGrokVision();
      }
      throw err;
    }
  }
  if (cfg.style === 'anthropic') {
    const content = [
      { type: 'text', text: prompt },
      ...imgs.map((b) => ({ type: 'image', source: { type: 'base64', media_type: mimeType, data: b } })),
    ];
    const res = await fetch(`${cfg.base}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: useModel, max_tokens: maxTokens || 4096, messages: [{ role: 'user', content }] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Claude vision error (${res.status})`);
    const block = (data.content || []).find((c) => c.type === 'text');
    const text = block?.text?.trim();
    if (!text) throw new Error('Claude vision returned no text.');
    return text;
  }
  // OpenAI-compatible vision (Grok)
  const content = [
    { type: 'text', text: prompt },
    ...imgs.map((b) => ({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${b}` } })),
  ];
  const res = await fetch(`${cfg.base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: useModel, messages: [{ role: 'user', content }], max_tokens: maxTokens || 4096 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Vision API error (${res.status})`);
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Vision model returned no text.');
  return text;
}
