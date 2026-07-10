/**
 * Per-user Research Lab tool preferences (Fable Scrape roster + routing defaults).
 * Stored at users/{uid}/researchLab/fablePrefs — never affects the public site.
 */
import { FieldValue } from 'firebase-admin/firestore';

const PROVIDERS = new Set(['grok', 'gemini', 'claude', 'kimi', 'deepseek']);
const ROUTE_MODES = new Set(['browser', 'residential', 'custom', 'server']);
const PROXY_PRESETS = new Set(['dataimpulse', 'iproyal', 'webshare', 'generic']);

function prefsRef(db, uid) {
  return db.doc(`users/${uid}/researchLab/fablePrefs`);
}

function clip(s, n) {
  return String(s || '').slice(0, n);
}

function normalizeRoster(raw) {
  const roles = ['director', 'vision', 'translator'];
  const roster = {};
  for (const role of roles) {
    const r = raw?.[role];
    const provider = PROVIDERS.has(r?.provider) ? r.provider : role === 'director' ? 'grok' : 'gemini';
    roster[role] = {
      provider,
      model: clip(r?.model, 120),
    };
  }
  return roster;
}

function normalizeRouting(raw) {
  const mode = ROUTE_MODES.has(raw?.mode) ? raw.mode : 'browser';
  const proxyProvider = PROXY_PRESETS.has(raw?.proxyProvider) ? raw.proxyProvider : 'dataimpulse';
  return {
    mode,
    proxyProvider,
    ackMyIp: !!raw?.ackMyIp,
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 */
export async function getResearchLabFablePrefs(db, uid) {
  const snap = await prefsRef(db, uid).get();
  if (!snap.exists) {
    return { roster: null, routing: null, updatedAt: null };
  }
  const data = snap.data() || {};
  return {
    roster: data.roster || null,
    routing: data.routing || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 * @param {{ roster?: object, routing?: object }} body
 */
export async function saveResearchLabFablePrefs(db, uid, body) {
  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (body?.roster) patch.roster = normalizeRoster(body.roster);
  if (body?.routing) patch.routing = normalizeRouting(body.routing);
  await prefsRef(db, uid).set(patch, { merge: true });
  return getResearchLabFablePrefs(db, uid);
}
