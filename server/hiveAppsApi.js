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
    storage,
    pages: normalizedPages,
    sourceTaskId: ctx.sourceTaskId || null,
    version: Number.isFinite(raw.version) ? Number(raw.version) : 1,
    updatedAt: now,
    createdAt: raw.createdAt || now,
  };
}

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

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function deleteUserApp(db, ownerId, appId) {
  const existing = await getUserApp(db, ownerId, appId);
  if (!existing) return { ok: false, reason: 'not_found' };
  await db.collection(COLLECTION).doc(appId).delete();
  return { ok: true };
}

export { COLLECTION as HIVE_APPS_COLLECTION, PAGE_TYPES, THEMES, ICONS };
