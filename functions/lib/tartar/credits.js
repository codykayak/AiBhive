/**
 * Hive credits + BYOK billing for AI extraction.
 * Platform charges 30% on Hive credit usage for upkeep/servers.
 */

import { FieldValue } from 'firebase-admin/firestore';
import {
  profileRef,
  usageLogCol,
  apiSecretsRef,
  PLATFORM_FEE_RATE,
  DEFAULT_STARTING_CREDITS,
  CREDIT_RATES,
} from './paths.js';

/**
 * Ensure user has a tartar profile with starting credits.
 */
export async function ensureProfile(db, uid) {
  const ref = profileRef(db, uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();
  const profile = {
    hiveCredits: DEFAULT_STARTING_CREDITS,
    billingMode: 'hive_credits',
    defaultAiProvider: 'gemini',
    enabledApps: { old_tartar_research: true },
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(profile);
  return profile;
}

/**
 * Resolve which API key to use: BYOK or platform secret.
 */
export async function resolveApiKey(db, uid, provider, platformSecrets) {
  const profile = (await ensureProfile(db, uid));
  if (profile.billingMode === 'byok') {
    const secretSnap = await apiSecretsRef(db, uid, provider).get();
    if (secretSnap.exists && secretSnap.data()?.apiKey) {
      return { key: secretSnap.data().apiKey, mode: 'byok', chargeCredits: false };
    }
    throw new Error(`No API key stored for ${provider}. Add your key in Settings.`);
  }
  const platformKey = platformSecrets[provider];
  if (!platformKey) throw new Error(`Platform ${provider} is not configured.`);
  return { key: platformKey, mode: 'hive_credits', chargeCredits: true };
}

/**
 * Estimate credit cost from token usage.
 */
export function estimateCredits(provider, inputTokens, outputTokens) {
  const rates = CREDIT_RATES[provider] ?? CREDIT_RATES.gemini;
  const base = (inputTokens / 1000) * rates.inputPer1k + (outputTokens / 1000) * rates.outputPer1k;
  const withFee = base * (1 + PLATFORM_FEE_RATE);
  return Math.ceil(withFee * 100) / 100;
}

/**
 * Deduct credits and log usage. Returns remaining balance.
 */
export async function chargeCredits(db, uid, { provider, inputTokens, outputTokens, operation, jobId }) {
  const credits = estimateCredits(provider, inputTokens, outputTokens);
  const ref = profileRef(db, uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const balance = snap.data()?.hiveCredits ?? 0;
    if (balance < credits) {
      throw new Error(`Insufficient Hive credits (need ${credits}, have ${balance}). Purchase more or switch to your own API keys.`);
    }
    tx.update(ref, {
      hiveCredits: FieldValue.increment(-credits),
      lastUsageAt: FieldValue.serverTimestamp(),
    });
    const logRef = usageLogCol(db, uid).doc();
    tx.set(logRef, {
      provider,
      operation,
      inputTokens,
      outputTokens,
      creditsCharged: credits,
      platformFee: Math.ceil(credits * PLATFORM_FEE_RATE * 100) / 100,
      jobId: jobId ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const updated = await ref.get();
  return { creditsCharged: credits, remaining: updated.data()?.hiveCredits ?? 0 };
}

/**
 * Store user's BYOK key (server-side only).
 */
export async function storeApiKey(db, uid, provider, apiKey) {
  await apiSecretsRef(db, uid, provider).set({
    provider,
    apiKey: String(apiKey).trim(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await profileRef(db, uid).set({ billingMode: 'byok' }, { merge: true });
}

export async function setBillingMode(db, uid, mode) {
  if (mode !== 'hive_credits' && mode !== 'byok') {
    throw new Error('billingMode must be hive_credits or byok');
  }
  await profileRef(db, uid).set({ billingMode: mode }, { merge: true });
}

export { PLATFORM_FEE_RATE, DEFAULT_STARTING_CREDITS };
