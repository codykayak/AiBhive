/**
 * Grok (xAI) Text-to-Speech — uses the company's/platform Grok API key.
 * Docs: https://docs.x.ai/developers/model-capabilities/audio/text-to-speech
 */

const GROK_TTS_URL = 'https://api.x.ai/v1/tts';
export const DEFAULT_GROK_VOICE_ID = 'ara';

/** Built-in Grok voices (case-insensitive IDs). */
export const GROK_VOICES = [
  {
    id: 'ara',
    name: 'Ara',
    description: 'Warm and friendly — balanced, conversational (default)',
  },
  {
    id: 'eve',
    name: 'Eve',
    description: 'Energetic and upbeat — engaging announcements',
  },
  {
    id: 'leo',
    name: 'Leo',
    description: 'Authoritative and strong — instructions and training',
  },
  {
    id: 'rex',
    name: 'Rex',
    description: 'Confident and clear — professional field updates',
  },
  {
    id: 'sal',
    name: 'Sal',
    description: 'Smooth and balanced — versatile narration',
  },
];

export const GROK_TTS_PREVIEW_TEXT =
  'Hi, I am ready to help diagnose equipment in the field.';

/**
 * @param {string} apiKey
 * @param {string} text
 * @param {{ voiceId?: string, language?: string }} [opts]
 * @returns {Promise<Buffer>} MP3 bytes
 */
export async function synthesizeGrokSpeech(apiKey, text, opts = {}) {
  if (!apiKey?.trim()) {
    throw new Error('Grok API key required for TTS');
  }

  const voiceId = String(opts.voiceId || DEFAULT_GROK_VOICE_ID).trim().toLowerCase();
  const language = String(opts.language || 'en').trim() || 'en';
  const transcript = String(text || '').trim().slice(0, 2000);
  if (!transcript) {
    throw new Error('text required');
  }

  const res = await fetch(GROK_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: transcript,
      voice_id: voiceId,
      language,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Grok TTS failed (${res.status}): ${detail.slice(0, 240)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
