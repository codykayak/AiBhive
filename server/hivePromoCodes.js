/**
 * Hive promo codes — partner / creator rates near API cost.
 * Default users pay TOKEN_MARKUP (1.3×). Promo users pay ~1.08× (API + small server fee).
 * When in doubt, err slightly toward covering platform costs.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { TOKEN_MARKUP } from './hivePlans.js';

/** Default partner fee on top of raw API cost (8% — covers server/egress with a little margin). */
export const HIVE_PROMO_MARKUP = Number(process.env.HIVE_PROMO_MARKUP ?? 1.08);

const COL = 'hive_promo_codes';

export function normalizePromoCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40);
}

function promoCol(db) {
  return db.collection(COL);
}

/** Env fallback: HIVE_PROMO_CODES=JOEROGAN:1.08,LEXFRIDMAN:1.08 */
function envPromoMap() {
  const raw = process.env.HIVE_PROMO_CODES ?? '';
  const map = new Map();
  for (const part of raw.split(',')) {
    const [code, rateStr] = part.trim().split(':');
    const normalized = normalizePromoCode(code);
    if (!normalized) continue;
    const rate = rateStr != null ? Number(rateStr) : HIVE_PROMO_MARKUP;
    map.set(normalized, {
      code: normalized,
      markupMultiplier: Number.isFinite(rate) && rate >= 1 ? rate : HIVE_PROMO_MARKUP,
      label: 'Partner code',
      partnerName: normalized,
      active: true,
      source: 'env',
    });
  }
  return map;
}

/**
 * Resolve effective markup for a hive_users doc (or plain object).
 */
export function effectiveMarkupMultiplier(userDoc) {
  const m = Number(userDoc?.markupMultiplier);
  if (Number.isFinite(m) && m >= 1 && m <= TOKEN_MARKUP + 0.01) {
    // Promo or custom rate stored on the user
    if (userDoc?.promoCode || m < TOKEN_MARKUP) return m;
  }
  if (userDoc?.waivePlatformMarkup) {
    return Number(userDoc.serverFeeMarkup) || HIVE_PROMO_MARKUP;
  }
  return TOKEN_MARKUP;
}

export function applyMarkup(rawCostUsd, multiplier = TOKEN_MARKUP) {
  const raw = Math.max(0, Number(rawCostUsd) || 0);
  if (raw === 0) return 0;
  const mult = Number.isFinite(multiplier) && multiplier >= 1 ? multiplier : TOKEN_MARKUP;
  return Math.round(raw * mult * 10000) / 10000;
}

export async function lookupHivePromo(db, code) {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;

  const envHit = envPromoMap().get(normalized);
  if (envHit) return envHit;

  const snap = await promoCol(db).doc(normalized).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (data.active === false) return null;
  if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) return null;
  if (data.maxRedemptions != null && (data.redemptionCount ?? 0) >= data.maxRedemptions) {
    return null;
  }

  const markup = Number(data.markupMultiplier);
  return {
    code: normalized,
    markupMultiplier:
      Number.isFinite(markup) && markup >= 1 ? markup : HIVE_PROMO_MARKUP,
    label: data.label || data.partnerName || 'Partner promo',
    partnerName: data.partnerName || data.label || normalized,
    note: data.note || '',
    source: 'firestore',
    ref: snap.ref,
    maxRedemptions: data.maxRedemptions ?? null,
    redemptionCount: data.redemptionCount ?? 0,
  };
}

/**
 * Apply promo to hive_users — near-cost Hive credit metering.
 */
export async function redeemHivePromo(db, userId, code, opts = {}) {
  const promo = await lookupHivePromo(db, code);
  if (!promo) {
    throw new Error('Invalid or expired promo code.');
  }

  const now = new Date().toISOString();
  await db.collection('hive_users').doc(userId).set(
    {
      promoCode: promo.code,
      promoLabel: promo.label,
      partnerName: promo.partnerName,
      markupMultiplier: promo.markupMultiplier,
      waivePlatformMarkup: true,
      serverFeeMarkup: promo.markupMultiplier,
      promoAppliedAt: now,
      email: opts.email || undefined,
      updatedAt: now,
    },
    { merge: true },
  );

  if (promo.ref) {
    await promo.ref.set(
      {
        redemptionCount: FieldValue.increment(1),
        lastRedeemedAt: now,
        lastRedeemedBy: userId,
      },
      { merge: true },
    );
  }

  await db.collection('hive_ledger').doc().set({
    userId,
    type: 'promo_redeem',
    promoCode: promo.code,
    markupMultiplier: promo.markupMultiplier,
    amountUsd: 0,
    summary: `Promo ${promo.code} applied — near-cost Hive credits`,
    createdAt: now,
  });

  return {
    ok: true,
    code: promo.code,
    label: promo.label,
    partnerName: promo.partnerName,
    markupMultiplier: promo.markupMultiplier,
    message: `Promo ${promo.code} applied. You now pay near our API & server cost in Hive credits — thank you for helping grow the community library.`,
  };
}

export async function clearHivePromo(db, userId) {
  const now = new Date().toISOString();
  await db.collection('hive_users').doc(userId).set(
    {
      promoCode: null,
      promoLabel: null,
      partnerName: null,
      markupMultiplier: TOKEN_MARKUP,
      waivePlatformMarkup: false,
      serverFeeMarkup: null,
      promoClearedAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  return { ok: true };
}

/** Admin: list promo codes */
export async function listHivePromos(db) {
  try {
    const snap = await promoCol(db).orderBy('createdAt', 'desc').limit(200).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await promoCol(db).limit(200).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }
}

/** Admin: create or update a promo code */
export async function upsertHivePromo(db, input) {
  const code = normalizePromoCode(input.code);
  if (!code || code.length < 2) {
    throw new Error('Promo code must be at least 2 characters (letters, numbers, _ or -).');
  }
  const markup = Number(input.markupMultiplier ?? HIVE_PROMO_MARKUP);
  if (!Number.isFinite(markup) || markup < 1 || markup > 2) {
    throw new Error('Markup multiplier must be between 1.0 and 2.0 (e.g. 1.08 = near cost).');
  }
  const now = new Date().toISOString();
  const ref = promoCol(db).doc(code);
  const existing = await ref.get();
  const payload = {
    code,
    partnerName: String(input.partnerName || input.label || code).trim().slice(0, 80),
    label: String(input.label || input.partnerName || code).trim().slice(0, 80),
    note: String(input.note || '').trim().slice(0, 500),
    markupMultiplier: markup,
    active: input.active !== false,
    maxRedemptions:
      input.maxRedemptions == null || input.maxRedemptions === ''
        ? null
        : Math.max(1, Number(input.maxRedemptions) || 1),
    expiresAt: input.expiresAt || null,
    updatedAt: now,
  };
  if (!existing.exists) {
    payload.createdAt = now;
    payload.redemptionCount = 0;
  }
  await ref.set(payload, { merge: true });
  return { id: code, ...payload, redemptionCount: existing.data()?.redemptionCount ?? 0 };
}

export async function setHivePromoActive(db, code, active) {
  const normalized = normalizePromoCode(code);
  const ref = promoCol(db).doc(normalized);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Promo code not found.');
  await ref.set({ active: !!active, updatedAt: new Date().toISOString() }, { merge: true });
  return { id: normalized, active: !!active };
}

export async function deleteHivePromo(db, code) {
  const normalized = normalizePromoCode(code);
  await promoCol(db).doc(normalized).delete();
  return { ok: true };
}

/**
 * Load markup for a userId (for billing paths).
 */
export async function getUserMarkupMultiplier(db, userId) {
  if (!userId) return TOKEN_MARKUP;
  try {
    const snap = await db.collection('hive_users').doc(userId).get();
    return effectiveMarkupMultiplier(snap.data() || {});
  } catch {
    return TOKEN_MARKUP;
  }
}
