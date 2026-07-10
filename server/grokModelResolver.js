/**
 * Resolve the latest Grok chat model for site assistants.
 * Re-checks xAI /v1/models at least weekly (or on cold start when cache is stale).
 */
const XAI_BASE = 'https://api.x.ai/v1';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FALLBACK_CHAT = process.env.GROK_CHAT_MODEL || process.env.INTEL_GROK_MODEL || 'grok-3-mini';
const FALLBACK_VISION =
  process.env.GROK_VISION_MODEL || process.env.FABLE_GROK_VISION_MODEL || 'grok-2-vision-1212';

/** Prefer newer chat models; skip image/audio-only ids. */
const CHAT_PREFERENCE = [
  /^grok-4(?!.*image)/i,
  /^grok-3(?!.*mini)(?!.*image)/i,
  /^grok-3-mini/i,
  /^grok-2(?!.*vision)(?!.*image)/i,
];

let cache = {
  chatModel: FALLBACK_CHAT,
  visionModel: FALLBACK_VISION,
  checkedAt: 0,
  source: 'fallback',
};

function pickBestChatModel(ids) {
  const list = (ids || []).map(String).filter(Boolean);
  for (const re of CHAT_PREFERENCE) {
    const hit = list.find((id) => re.test(id) && !/image|audio|tts|voice/i.test(id));
    if (hit) return hit;
  }
  const anyGrok = list.find((id) => /^grok/i.test(id) && !/image|audio|tts|voice|vision/i.test(id));
  return anyGrok || FALLBACK_CHAT;
}

function pickBestVisionModel(ids) {
  const list = (ids || []).map(String).filter(Boolean);
  const vision = list.find((id) => /vision/i.test(id) && /^grok/i.test(id));
  return vision || FALLBACK_VISION;
}

/**
 * @returns {Promise<{ chatModel: string, visionModel: string, source: string, checkedAt: number }>}
 */
export async function resolveLatestGrokModels(force = false) {
  const now = Date.now();
  if (!force && cache.checkedAt && now - cache.checkedAt < WEEK_MS) {
    return { ...cache };
  }

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    cache = { ...cache, checkedAt: now, source: 'env-fallback-no-key' };
    return { ...cache };
  }

  try {
    const res = await fetch(`${XAI_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn('[grokModelResolver] models list failed:', data?.error?.message || res.status);
      cache = { ...cache, checkedAt: now, source: 'stale-after-error' };
      return { ...cache };
    }
    const ids = (data.data || data.models || []).map((m) => m.id || m.name).filter(Boolean);
    cache = {
      chatModel: pickBestChatModel(ids),
      visionModel: pickBestVisionModel(ids),
      checkedAt: now,
      source: 'xai-models',
    };
    console.log(
      `[grokModelResolver] weekly refresh → chat=${cache.chatModel} vision=${cache.visionModel}`,
    );
    return { ...cache };
  } catch (err) {
    console.warn('[grokModelResolver]', err.message || err);
    cache = { ...cache, checkedAt: now, source: 'stale-after-error' };
    return { ...cache };
  }
}

/** Sync peek at last resolved chat model (may trigger background refresh). */
export function getCachedGrokChatModel() {
  if (!cache.checkedAt || Date.now() - cache.checkedAt >= WEEK_MS) {
    void resolveLatestGrokModels();
  }
  return cache.chatModel || FALLBACK_CHAT;
}

export function getCachedGrokVisionModel() {
  if (!cache.checkedAt || Date.now() - cache.checkedAt >= WEEK_MS) {
    void resolveLatestGrokModels();
  }
  return cache.visionModel || FALLBACK_VISION;
}

/** Kick a refresh on server boot (non-blocking). */
export function startWeeklyGrokModelRefresh() {
  void resolveLatestGrokModels(true);
  const timer = setInterval(() => {
    void resolveLatestGrokModels(true);
  }, WEEK_MS);
  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}
