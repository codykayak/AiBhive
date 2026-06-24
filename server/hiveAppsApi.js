/**
 * Server-side CRUD for hive_apps — user-owned, instantly-operational app
 * specs that the mobile app renders dynamically (no APK reinstall needed).
 *
 * Each document is a HiveAppSpec describing the user's app: branding (title,
 * tagline, color theme, icon), pages (lists, trackers, notes, calculators,
 * info), and storage mode. The mobile DynamicAppHost reads the spec by id
 * and renders the user's app in real time.
 *
 * Lifecycle:
 *   1. Triage on /api/hive/tasks decides buildMethod=spec for simple
 *      host_screen requests.
 *   2. hiveSpecBuilder.generateAppSpec asks Gemini to emit a spec JSON.
 *   3. The spec is stored at hive_apps/<id> with ownerId = userId.
 *   4. Mobile fetches via GET /api/hive/apps?userId=... and renders.
 *   5. User can iterate (updates the same doc) or export (kicks off a
 *      proper Cursor build that reads the spec).
 */

const COLLECTION = 'hive_apps';

const PAGE_TYPES = ['list', 'tracker', 'note', 'calculator', 'info'];
const THEMES = ['amber', 'blue', 'green', 'purple', 'pink', 'slate'];
const ICONS = [
  'sparkles', 'rocket', 'target', 'flame', 'leaf', 'heart',
  'star', 'zap', 'list', 'calculator', 'pencil', 'book',
  'wallet', 'dumbbell', 'coffee', 'sun', 'moon', 'compass',
];

function clampString(value, max, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, max);
}

/**
 * Validate + normalize a spec coming from any source (Gemini, manual edit,
 * iteration). Returns a clean object safe to store, or throws.
 *
 * @param {object} raw
 * @param {{ ownerId: string, sourceTaskId?: string }} ctx
 */
export function normalizeAppSpec(raw, ctx) {
  if (!raw || typeof raw !== 'object') throw new Error('Spec must be an object.');
  if (!ctx?.ownerId) throw new Error('ownerId required to normalize spec.');

  const id = clampString(raw.id, 64, '');
  const slug = clampString(raw.slug, 48, '');
  const title = clampString(raw.title, 64, 'My App');
  const tagline = clampString(raw.tagline, 140);
  const summary = clampString(raw.summary, 280);

  const theme = THEMES.includes(raw.theme) ? raw.theme : 'amber';
  const icon = ICONS.includes(raw.icon) ? raw.icon : 'sparkles';
  const storage = raw.storage === 'cloud' ? 'cloud' : 'local';

  const pages = Array.isArray(raw.pages) ? raw.pages : [];
  const normalizedPages = pages
    .filter((p) => p && PAGE_TYPES.includes(p.type))
    .slice(0, 6)
    .map((p, idx) => normalizePage(p, idx));

  if (!normalizedPages.length) {
    normalizedPages.push({
      id: 'home',
      title: 'Home',
      type: 'info',
      config: {
        body: 'Your app is ready. Tell the Hive what to add next.',
      },
    });
  }

  const now = new Date().toISOString();

  return {
    id: id || undefined,
    slug,
    ownerId: ctx.ownerId,
    title,
    tagline,
    summary,
    theme,
    icon,
    storage: 'cloud',
    pages: normalizedPages,
    sourceTaskId: ctx.sourceTaskId || null,
    sourceCommunityAppId: ctx.sourceCommunityAppId || raw.sourceCommunityAppId || null,
    visibility: raw.visibility === 'community' ? 'community' : 'private',
    toolkitKeywords: normalizeKeywords(raw.toolkitKeywords, title, tagline, summary),
    installCount: Number.isFinite(raw.installCount) ? Math.max(0, Number(raw.installCount)) : 0,
    sharedAt: raw.sharedAt || null,
    version: Number.isFinite(raw.version) ? Number(raw.version) : 1,
    updatedAt: now,
    createdAt: raw.createdAt || now,
  };
}

function normalizeKeywords(explicit, title, tagline, summary) {
  const fromExplicit = Array.isArray(explicit)
    ? explicit.filter((k) => typeof k === 'string').map((k) => k.trim().toLowerCase()).slice(0, 24)
    : [];
  const blob = `${title} ${tagline} ${summary}`.toLowerCase();
  const tokens = blob
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const merged = [...new Set([...fromExplicit, ...tokens])].slice(0, 24);
  return merged;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'app', 'tool', 'that', 'this', 'from', 'have', 'are', 'was',
]);

function normalizePage(page, idx) {
  const id = clampString(page.id, 48, `page-${idx + 1}`);
  const title = clampString(page.title, 48, `Page ${idx + 1}`);
  const type = page.type;
  const cfg = page.config && typeof page.config === 'object' ? page.config : {};

  let config;
  switch (type) {
    case 'list': {
      config = {
        addPlaceholder: clampString(cfg.addPlaceholder, 64, 'Add an item…'),
        emptyMessage: clampString(cfg.emptyMessage, 140, 'No items yet — tap + to add your first.'),
        seed: Array.isArray(cfg.seed)
          ? cfg.seed
              .filter((s) => typeof s === 'string')
              .slice(0, 12)
              .map((s) => clampString(s, 120))
          : [],
        showCheckbox: cfg.showCheckbox !== false,
      };
      break;
    }
    case 'tracker': {
      config = {
        unit: clampString(cfg.unit, 24, 'count'),
        prompt: clampString(cfg.prompt, 80, 'Log an entry'),
        defaultValue: Number.isFinite(cfg.defaultValue) ? Number(cfg.defaultValue) : 1,
        aggregate: ['sum', 'avg', 'count', 'latest'].includes(cfg.aggregate) ? cfg.aggregate : 'sum',
        timeframeDays: Number.isFinite(cfg.timeframeDays) ? Math.min(365, Math.max(1, Number(cfg.timeframeDays))) : 30,
      };
      break;
    }
    case 'note': {
      config = {
        placeholder: clampString(cfg.placeholder, 140, 'Write whatever you want here…'),
        seedText: clampString(cfg.seedText, 4000, ''),
      };
      break;
    }
    case 'calculator': {
      const inputs = Array.isArray(cfg.inputs)
        ? cfg.inputs
            .filter((i) => i && typeof i.id === 'string' && typeof i.label === 'string')
            .slice(0, 8)
            .map((i) => ({
              id: clampString(i.id, 24),
              label: clampString(i.label, 48),
              unit: clampString(i.unit, 16),
              defaultValue: Number.isFinite(i.defaultValue) ? Number(i.defaultValue) : 0,
            }))
        : [];
      config = {
        inputs,
        formula: clampString(cfg.formula, 240, ''),
        resultLabel: clampString(cfg.resultLabel, 48, 'Result'),
        resultUnit: clampString(cfg.resultUnit, 16, ''),
      };
      break;
    }
    case 'info':
    default: {
      config = {
        body: clampString(cfg.body, 4000, ''),
        bullets: Array.isArray(cfg.bullets)
          ? cfg.bullets
              .filter((s) => typeof s === 'string')
              .slice(0, 12)
              .map((s) => clampString(s, 240))
          : [],
        links: Array.isArray(cfg.links)
          ? cfg.links
              .filter((l) => l && typeof l.url === 'string')
              .slice(0, 6)
              .map((l) => ({
                label: clampString(l.label, 48, l.url),
                url: clampString(l.url, 240),
              }))
          : [],
      };
    }
  }

  return { id, title, type, config };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function listUserApps(db, ownerId) {
  if (!ownerId) return [];
  const snap = await db
    .collection(COLLECTION)
    .where('ownerId', '==', ownerId)
    .orderBy('updatedAt', 'desc')
    .limit(60)
    .get()
    .catch(() => null);
  if (!snap) return [];
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function getUserApp(db, ownerId, appId) {
  if (!appId) return null;
  const ref = db.collection(COLLECTION).doc(appId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.ownerId && data.ownerId !== ownerId) return null;
  return { id: snap.id, ...data };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function saveUserApp(db, ownerId, spec) {
  if (!ownerId) throw new Error('ownerId required.');
  const normalized = normalizeAppSpec({ ...spec, ownerId }, { ownerId, sourceTaskId: spec.sourceTaskId });
  const id = normalized.id || db.collection(COLLECTION).doc().id;
  delete normalized.id;
  await db.collection(COLLECTION).doc(id).set(normalized, { merge: true });
  return { id, ...normalized };
}

export function inferAppCategory(app) {
  const types = new Set((app.pages || []).map((p) => p.type));
  if (types.has('tracker')) return 'trackers';
  if (types.has('calculator')) return 'calculators';
  if (types.has('list')) return 'lists';
  if (types.has('note')) return 'notes';
  if (types.has('info')) return 'guides';
  return 'other';
}

function toPublicToolkitApp(app, includeOwner = false) {
  const row = {
    id: app.id,
    title: app.title,
    tagline: app.tagline,
    summary: app.summary,
    theme: app.theme,
    icon: app.icon,
    pages: app.pages,
    pageCount: Array.isArray(app.pages) ? app.pages.length : 0,
    installCount: app.installCount || 0,
    sharedAt: app.sharedAt,
    category: inferAppCategory(app),
    slug: app.slug || null,
  };
  if (includeOwner) row.ownerId = app.ownerId || null;
  return row;
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function getCommunityApp(db, appId) {
  if (!appId) return null;
  const snap = await db.collection(COLLECTION).doc(appId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.visibility !== 'community') return null;
  return { id: snap.id, ...data };
}

/** Public read for store detail pages. */
export async function getPublicToolkitApp(db, appId) {
  const app = await getCommunityApp(db, appId);
  if (!app) return null;
  return toPublicToolkitApp(app, true);
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function listCommunityToolkitRaw(db, limit = 120) {
  const snap = await db
    .collection(COLLECTION)
    .where('visibility', '==', 'community')
    .limit(Math.min(limit, 120))
    .get()
    .catch(() => null);
  if (!snap) return [];
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort(
      (a, b) =>
        (b.installCount || 0) - (a.installCount || 0) ||
        String(b.updatedAt).localeCompare(String(a.updatedAt))
    );
}

/** Score how well a community app matches a natural-language query. */
function scoreToolkitMatch(app, query) {
  const q = String(query || '').toLowerCase();
  const tokens = q
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  if (!tokens.length) return 0;

  const hay = [
    app.title,
    app.tagline,
    app.summary,
    ...(Array.isArray(app.toolkitKeywords) ? app.toolkitKeywords : []),
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) score += 2;
  }
  if (hay.includes(q.slice(0, 48))) score += 5;
  return score + Math.min(3, (app.installCount || 0) / 10);
}

/**
 * Search the shared AiBhive community toolkit.
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function searchCommunityToolkit(db, query, limit = 8) {
  const snap = await db
    .collection(COLLECTION)
    .where('visibility', '==', 'community')
    .limit(120)
    .get()
    .catch(() => null);
  if (!snap) return [];

  const scored = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .map((app) => ({ app, score: scoreToolkitMatch(app, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ app }) => toPublicToolkitApp(app, true));
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function listCommunityToolkit(db, limit = 24) {
  const rows = await listCommunityToolkitRaw(db, Math.min(limit * 3, 120));
  return rows.slice(0, limit).map((app) => toPublicToolkitApp(app));
}

/** Store catalog payload for the web app store. */
export async function getStoreCatalog(db, { query = '', category = '', limit = 48 } = {}) {
  const { listExampleApps } = await import('./hiveExampleApps.js');
  const examples = listExampleApps();
  const all = await listCommunityToolkitRaw(db, 120);
  const q = String(query || '').trim().toLowerCase();
  const cat = String(category || '').trim().toLowerCase();

  let filtered = all;
  if (cat && cat !== 'all') {
    filtered = filtered.filter((app) => inferAppCategory(app) === cat);
  }
  if (q) {
    filtered = filtered
      .map((app) => ({ app, score: scoreToolkitMatch(app, q) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ app }) => app);
  }

  const apps = filtered.slice(0, Math.min(limit, 48)).map((app) => toPublicToolkitApp(app));
  const featured = [...examples, ...all.slice(0, 6).map((app) => toPublicToolkitApp(app))].slice(0, 6);
  const categories = {};
  for (const app of [...examples, ...all]) {
    const c = inferAppCategory(app);
    categories[c] = (categories[c] || 0) + 1;
  }

  return {
    apps,
    examples,
    featured,
    total: all.length + examples.length,
    totalInstalls: all.reduce((n, a) => n + (a.installCount || 0), 0),
    categories,
    query: q || null,
    category: cat || null,
  };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function shareAppToCommunity(db, ownerId, appId) {
  const existing = await getUserApp(db, ownerId, appId);
  if (!existing) return { ok: false, error: 'App not found.' };
  const now = new Date().toISOString();
  await db.collection(COLLECTION).doc(appId).set(
    {
      visibility: 'community',
      sharedAt: now,
      updatedAt: now,
      storage: 'cloud',
    },
    { merge: true }
  );
  const updated = await getUserApp(db, ownerId, appId);
  return { ok: true, app: updated };
}

/** Clone a community app into the user's library (free — no build charge). */
export async function installCommunityApp(db, userId, communityAppId) {
  const source = await getCommunityApp(db, communityAppId);
  if (!source) return { ok: false, error: 'Community app not found or not shared.' };

  const cloneSpec = normalizeAppSpec(
    {
      title: source.title,
      tagline: source.tagline,
      summary: source.summary,
      theme: source.theme,
      icon: source.icon,
      pages: source.pages,
      slug: `${source.slug || 'tool'}-copy`,
      sourceCommunityAppId: communityAppId,
      visibility: 'private',
    },
    { ownerId: userId, sourceCommunityAppId: communityAppId }
  );

  const saved = await saveUserApp(db, userId, cloneSpec);

  await db.collection(COLLECTION).doc(communityAppId).set(
    { installCount: (source.installCount || 0) + 1, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return { ok: true, app: saved, sourceAppId: communityAppId };
}

/** Best single match for triage / home assistant — score threshold 4+. */
export async function findToolkitMatch(db, query) {
  const matches = await searchCommunityToolkit(db, query, 3);
  if (!matches.length) return null;
  const top = matches[0];
  const rescore = scoreToolkitMatch(top, query);
  if (rescore < 4) return null;
  return top;
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function deleteUserApp(db, ownerId, appId) {
  const existing = await getUserApp(db, ownerId, appId);
  if (!existing) return { ok: false, reason: 'not_found' };
  await db.collection(COLLECTION).doc(appId).delete();
  return { ok: true };
}

export { COLLECTION as HIVE_APPS_COLLECTION, PAGE_TYPES, THEMES, ICONS };
