/**
 * Diagnose operation cost estimates — Grok, Cartesia TTS, Gemini STT.
 * Raw USD reflects platform API spend (before Hive credit markup).
 */
import * as hiveUsage from './hiveUsage.js';

/** Grok text diagnosis (aligned with Diagnose Web). */
export const DIAGNOSE_GROK_CHAT_RAW = Number(process.env.DIAGNOSE_WEB_CHAT_RAW_COST ?? 0.01);

/** Grok vision diagnosis (photo attached). */
export const DIAGNOSE_GROK_VISION_RAW = Number(process.env.DIAGNOSE_WEB_VISION_RAW_COST ?? 0.022);

/** Gemini voice transcription (field mic). */
export const DIAGNOSE_TRANSCRIBE_RAW = Number(process.env.DIAGNOSE_TRANSCRIBE_RAW_COST ?? 0.004);

/**
 * Cartesia bills ~1 credit per input character.
 * Default: $50 / 1M credits ≈ $0.00005 per character (pay-as-you-go).
 */
export const CARTESIA_USD_PER_CHAR = Number(process.env.CARTESIA_USD_PER_CHAR ?? 0.00005);

/**
 * Grok TTS: ~$4.20 per 1M characters (xAI pricing).
 */
export const GROK_TTS_USD_PER_CHAR = Number(process.env.GROK_TTS_USD_PER_CHAR ?? 0.0000042);

/** Minimum charge per Grok TTS request. */
export const GROK_TTS_RAW_MIN = Number(process.env.GROK_TTS_RAW_MIN ?? 0.0003);

/** Minimum charge per TTS request (covers very short replies). */
export const DIAGNOSE_TTS_RAW_MIN = Number(process.env.DIAGNOSE_TTS_RAW_MIN ?? 0.0005);

/** Typical spoken reply length when estimating ops without text (client caps at 420). */
export const DIAGNOSE_TTS_TYPICAL_CHARS = Number(process.env.DIAGNOSE_TTS_TYPICAL_CHARS ?? 300);

export const DIAGNOSE_TTS_MAX_CHARS = Number(process.env.DIAGNOSE_TTS_MAX_CHARS ?? 420);

function roundUsd(value) {
  return Math.round(Math.max(0, Number(value) || 0) * 10000) / 10000;
}

/**
 * @param {string} text
 * @returns {number} raw USD for Cartesia TTS
 */
export function cartesiaTtsRawCost(text) {
  const chars = String(text || '')
    .replace(/\*\*/g, '')
    .replace(/_/g, '')
    .trim()
    .length;
  const billable = chars > 0 ? Math.min(chars, DIAGNOSE_TTS_MAX_CHARS) : DIAGNOSE_TTS_TYPICAL_CHARS;
  return roundUsd(Math.max(DIAGNOSE_TTS_RAW_MIN, billable * CARTESIA_USD_PER_CHAR));
}

export function grokTtsRawCost(text) {
  const chars = String(text || '')
    .replace(/\*\*/g, '')
    .replace(/_/g, '')
    .trim()
    .length;
  const billable = chars > 0 ? Math.min(chars, DIAGNOSE_TTS_MAX_CHARS) : DIAGNOSE_TTS_TYPICAL_CHARS;
  return roundUsd(Math.max(GROK_TTS_RAW_MIN, billable * GROK_TTS_USD_PER_CHAR));
}

export function ttsRawCost(text, provider = 'grok') {
  if (provider === 'cartesia') return cartesiaTtsRawCost(text);
  return grokTtsRawCost(text);
}

export function grokDiagnoseRawCost(hasImage = false) {
  return hasImage ? DIAGNOSE_GROK_VISION_RAW : DIAGNOSE_GROK_CHAT_RAW;
}

/**
 * Published rate card for UI / ai-status.
 */
export function getDiagnoseOperationCostRates() {
  const typicalGrokTts = grokTtsRawCost('x'.repeat(DIAGNOSE_TTS_TYPICAL_CHARS));
  const typicalTts = typicalGrokTts;
  return {
    grokChatRawUsd: DIAGNOSE_GROK_CHAT_RAW,
    grokVisionRawUsd: DIAGNOSE_GROK_VISION_RAW,
    transcribeRawUsd: DIAGNOSE_TRANSCRIBE_RAW,
    grokTtsPerCharUsd: GROK_TTS_USD_PER_CHAR,
    grokTtsTypicalRawUsd: typicalGrokTts,
    ttsPerCharUsd: CARTESIA_USD_PER_CHAR,
    ttsTypicalChars: DIAGNOSE_TTS_TYPICAL_CHARS,
    ttsTypicalRawUsd: cartesiaTtsRawCost('x'.repeat(DIAGNOSE_TTS_TYPICAL_CHARS)),
    typicalDiagnoseWithVoiceUsd: roundUsd(DIAGNOSE_GROK_CHAT_RAW + typicalGrokTts),
    typicalVisionDiagnoseWithVoiceUsd: roundUsd(DIAGNOSE_GROK_VISION_RAW + typicalGrokTts),
  };
}

/**
 * Estimate raw platform cost for one field diagnose operation.
 * @param {{ hasImage?: boolean, replyText?: string, includeTts?: boolean, includeTranscribe?: boolean }} opts
 */
export function estimateDiagnoseOperation(opts = {}) {
  const hasImage = Boolean(opts.hasImage);
  const includeTts = Boolean(opts.includeTts);
  const includeTranscribe = Boolean(opts.includeTranscribe);

  const grokRawUsd = grokDiagnoseRawCost(hasImage);
  const ttsRawUsd = includeTts
    ? (opts.ttsProvider === 'cartesia'
        ? cartesiaTtsRawCost(opts.replyText || 'x'.repeat(DIAGNOSE_TTS_TYPICAL_CHARS))
        : grokTtsRawCost(opts.replyText || 'x'.repeat(DIAGNOSE_TTS_TYPICAL_CHARS)))
    : 0;
  const transcribeRawUsd = includeTranscribe ? DIAGNOSE_TRANSCRIBE_RAW : 0;
  const totalRawUsd = roundUsd(grokRawUsd + ttsRawUsd + transcribeRawUsd);

  return {
    grokRawUsd,
    ttsRawUsd,
    transcribeRawUsd,
    totalRawUsd,
    hasImage,
    includeTts,
    includeTranscribe,
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function estimateDiagnoseForUser(db, userId, opts = {}) {
  const rawCostUsd = estimateDiagnoseOperation(opts).totalRawUsd;
  const { markedUsd } = await hiveUsage.markCostForUser(db, userId, rawCostUsd);
  return {
    ok: true,
    rawCostUsd,
    estimatedCredits: markedUsd,
    rates: getDiagnoseOperationCostRates(),
    breakdown: estimateDiagnoseOperation(opts),
    message: `About $${markedUsd.toFixed(2)} Hive credits for this diagnose run`,
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function requireDiagnoseBudget(db, userId, rawCostUsd, feature, { email } = {}) {
  const { markedUsd: marked } = await hiveUsage.markCostForUser(db, userId, rawCostUsd);
  const budget = await hiveUsage.checkTokenBudget(db, userId, marked, feature, { email });
  if (!budget.ok) {
    return {
      ok: false,
      needPayment: true,
      amountUsd: budget.amountUsd ?? marked,
      suggestedPlan: budget.suggestedPlan ?? 'starter',
    };
  }
  return { ok: true, marked };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function chargeDiagnoseUsage(db, userId, rawCostUsd, feature, summary, { email } = {}) {
  const charge = await hiveUsage.recordTokenUsage(db, userId, {
    rawCostUsd,
    feature,
    summary,
    email,
  });
  if (!charge.ok) {
    const { markedUsd } = await hiveUsage.markCostForUser(db, userId, rawCostUsd);
    return {
      ok: false,
      needPayment: true,
      amountUsd: charge.amountUsd ?? markedUsd,
    };
  }
  return { ok: true, chargedUsd: charge.chargedUsd };
}
