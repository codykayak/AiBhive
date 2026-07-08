/**
 * Promo codes waive the 30% platform markup — users pay API cost + small server fee.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { profileRef, promoCodesCol, PROMO_SERVER_FEE_RATE, PLATFORM_FEE_RATE } from './paths.js';

function normalizeCode(code) {
  return String(code ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/** Env fallback: TARTAR_PROMO_CODES=CODE1:0.05,CODE2:0.08 */
function envPromoMap() {
  const raw = process.env.TARTAR_PROMO_CODES ?? '';
  const map = new Map();
  for (const part of raw.split(',')) {
    const [code, rateStr] = part.trim().split(':');
    const normalized = normalizeCode(code);
    if (!normalized) continue;
    const rate = rateStr != null ? Number(rateStr) : PROMO_SERVER_FEE_RATE;
    map.set(normalized, {
      code: normalized,
      serverFeeRate: Number.isFinite(rate) ? rate : PROMO_SERVER_FEE_RATE,
      label: 'Partner code',
    });
  }
  return map;
}

async function lookupPromo(db, code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const envHit = envPromoMap().get(normalized);
  if (envHit) return { ...envHit, source: 'env' };

  const snap = await promoCodesCol(db).doc(normalized).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.active === false) return null;
  if (data.maxRedemptions != null && (data.redemptionCount ?? 0) >= data.maxRedemptions) return null;

  return {
    code: normalized,
    serverFeeRate: data.serverFeeRate ?? PROMO_SERVER_FEE_RATE,
    label: data.label ?? 'Promo code',
    source: 'firestore',
    ref: snap.ref,
  };
}

/**
 * @returns effective fee rate for credit estimates (0.3 default, 0.05 with promo)
 */
export function effectiveFeeRate(profile) {
  if (profile?.waivePlatformMarkup) {
    return profile.serverFeeRate ?? PROMO_SERVER_FEE_RATE;
  }
  return PLATFORM_FEE_RATE;
}

export async function redeemPromoCode(db, uid, code) {
  const promo = await lookupPromo(db, code);
  if (!promo) {
    throw new Error('Invalid or expired promo code.');
  }

  await profileRef(db, uid).set({
    promoCode: promo.code,
    waivePlatformMarkup: true,
    serverFeeRate: promo.serverFeeRate,
    promoLabel: promo.label,
    promoAppliedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (promo.ref) {
    await promo.ref.set({
      redemptionCount: FieldValue.increment(1),
      lastRedeemedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return {
    ok: true,
    code: promo.code,
    serverFeeRate: promo.serverFeeRate,
    message: `Promo applied — reduced processing rates on Hive credits. Thank you for helping build the library.`,
  };
}
