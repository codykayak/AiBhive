/**
 * Cartesia TTS — high-quality voice for Pros Diagnose narration.
 * API key stays server-side only (CARTESIA_API_KEY).
 */

const CARTESIA_API_URL = 'https://api.cartesia.ai/tts/bytes';
const DEFAULT_VOICE_ID = 'db6b0ed5-d5d3-463d-ae85-518a07d3c2b4';
const DEFAULT_MODEL_ID = 'sonic-3.5';
const API_VERSION = '2026-03-01';

export function isCartesiaConfigured() {
  return Boolean(process.env.CARTESIA_API_KEY?.trim());
}

/**
 * @param {string} text
 * @returns {Promise<Buffer>} WAV bytes (pcm_s16le, 44.1kHz)
 */
export async function synthesizeCartesiaSpeech(text) {
  const apiKey = process.env.CARTESIA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Cartesia TTS not configured');
  }

  const transcript = String(text || '').trim().slice(0, 2000);
  if (!transcript) {
    throw new Error('text required');
  }

  const voiceId = process.env.CARTESIA_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
  const modelId = process.env.CARTESIA_MODEL_ID?.trim() || DEFAULT_MODEL_ID;
  const speed = Number(process.env.CARTESIA_SPEED || 1.2);

  const res = await fetch(CARTESIA_API_URL, {
    method: 'POST',
    headers: {
      'Cartesia-Version': API_VERSION,
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: modelId,
      transcript,
      voice: { mode: 'id', id: voiceId },
      output_format: {
        container: 'wav',
        encoding: 'pcm_s16le',
        sample_rate: 44100,
      },
      generation_config: {
        speed: Number.isFinite(speed) ? speed : 1.2,
        volume: 1,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Cartesia TTS failed (${res.status}): ${detail.slice(0, 240)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
