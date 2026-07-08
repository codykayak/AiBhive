/**
 * Server-side Firestore paths for Old Tartar Research.
 *
 * Layout:
 *   users/{uid}/tartarResearch/profile          — document
 *   users/{uid}/tartarResearch/customBuild      — document
 *   users/{uid}/tartarResearch/data             — anchor document for subcollections
 *   users/{uid}/tartarResearch/data/sources/…
 *   users/{uid}/tartarResearch/data/mentions/…
 */

export const TARTAR_ROOT = 'tartarResearch';
export const DATA_DOC = 'data';

export function userRoot(uid) {
  return `users/${uid}/${TARTAR_ROOT}`;
}

export function dataDocRef(db, uid) {
  return db.doc(`${userRoot(uid)}/${DATA_DOC}`);
}

export function profileRef(db, uid) {
  return db.doc(`${userRoot(uid)}/profile`);
}

export function customBuildRef(db, uid) {
  return db.doc(`${userRoot(uid)}/customBuild`);
}

export function mentionsCol(db, uid) {
  return dataDocRef(db, uid).collection('mentions');
}

export function entitiesCol(db, uid) {
  return dataDocRef(db, uid).collection('entities');
}

export function sourcesCol(db, uid) {
  return dataDocRef(db, uid).collection('sources');
}

export function searchTermsCol(db, uid) {
  return dataDocRef(db, uid).collection('searchTerms');
}

export function ingestionJobsCol(db, uid) {
  return dataDocRef(db, uid).collection('ingestionJobs');
}

export function anomaliesCol(db, uid) {
  return dataDocRef(db, uid).collection('anomalies');
}

export function usageLogCol(db, uid) {
  return dataDocRef(db, uid).collection('usageLog');
}

export function apiSecretsRef(db, uid, provider) {
  return dataDocRef(db, uid).collection('apiSecrets').doc(provider);
}

export function promoCodesCol(db) {
  return db.collection('tartarPlatform').doc('catalog').collection('promoCodes');
}

export const PLATFORM_FEE_RATE = 0.3;
export const PROMO_SERVER_FEE_RATE = 0.05;
export const DEFAULT_STARTING_CREDITS = 100;

/** Credit cost per 1K tokens (approximate; tunable) */
export const CREDIT_RATES = {
  gemini: { inputPer1k: 0.5, outputPer1k: 1.5 },
  grok: { inputPer1k: 1.0, outputPer1k: 3.0 },
  kimi: { inputPer1k: 0.8, outputPer1k: 2.0 },
};

/** Ensure the data anchor document exists before subcollection writes. */
export async function ensureDataDoc(db, uid) {
  const ref = dataDocRef(db, uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const { FieldValue } = await import('firebase-admin/firestore');
    await ref.set({ createdAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return ref;
}
