/**
 * Server-side Firestore paths for Old Tartar Research.
 */

export const TARTAR_ROOT = 'tartarResearch';

export function userRoot(uid) {
  return `users/${uid}/${TARTAR_ROOT}`;
}

export function profileRef(db, uid) {
  return db.doc(`${userRoot(uid)}/profile`);
}

export function customBuildRef(db, uid) {
  return db.doc(`${userRoot(uid)}/customBuild`);
}

export function mentionsCol(db, uid) {
  return db.collection(`${userRoot(uid)}/mentions`);
}

export function entitiesCol(db, uid) {
  return db.collection(`${userRoot(uid)}/entities`);
}

export function sourcesCol(db, uid) {
  return db.collection(`${userRoot(uid)}/sources`);
}

export function searchTermsCol(db, uid) {
  return db.collection(`${userRoot(uid)}/searchTerms`);
}

export function ingestionJobsCol(db, uid) {
  return db.collection(`${userRoot(uid)}/ingestionJobs`);
}

export function anomaliesCol(db, uid) {
  return db.collection(`${userRoot(uid)}/anomalies`);
}

export function usageLogCol(db, uid) {
  return db.collection(`${userRoot(uid)}/usageLog`);
}

export function apiSecretsRef(db, uid, provider) {
  return db.doc(`${userRoot(uid)}/apiSecrets/${provider}`);
}

export const PLATFORM_FEE_RATE = 0.3;
export const DEFAULT_STARTING_CREDITS = 100;

/** Credit cost per 1K tokens (approximate; tunable) */
export const CREDIT_RATES = {
  gemini: { inputPer1k: 0.5, outputPer1k: 1.5 },
  grok: { inputPer1k: 1.0, outputPer1k: 3.0 },
  kimi: { inputPer1k: 0.8, outputPer1k: 2.0 },
};
