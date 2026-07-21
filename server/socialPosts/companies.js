import { Timestamp } from 'firebase-admin/firestore';
import { loadBrand, loadKnowledge, loadTopics } from './loadConfig.js';

const COMPANIES_COLLECTION = 'socialCompanies';

const DEFAULT_PROVIDERS = {
  grok: {
    enabled: false,
    apiKey: '',
    textModel: 'grok-3-mini',
    imageModel: 'grok-imagine-image-quality',
  },
  gemini: {
    enabled: true,
    apiKey: '',
    textModel: 'gemini-2.5-flash',
    imageModel: 'gemini-2.5-flash-image',
  },
};

let firestoreDb = null;

export function initSocialCompanies(db) {
  firestoreDb = db;
}

function db() {
  if (!firestoreDb) throw new Error('Social companies store not initialized.');
  return firestoreDb;
}

function slugify(name) {
  const base = String(name || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'company';
  return base;
}

function maskKey(key) {
  if (!key) return { set: false, hint: '' };
  const s = String(key);
  return { set: true, hint: `••••${s.slice(-4)}` };
}

function mergeProviders(data = {}) {
  return {
    grok: { ...DEFAULT_PROVIDERS.grok, ...(data.grok || {}) },
    gemini: { ...DEFAULT_PROVIDERS.gemini, ...(data.gemini || {}) },
  };
}

function mergeDayPrompts(existing = {}, updates = {}) {
  const merged = { ...existing };
  for (const [dateKey, entry] of Object.entries(updates)) {
    if (!entry || !String(entry.prompt || '').trim()) {
      delete merged[dateKey];
      continue;
    }
    merged[dateKey] = {
      prompt: String(entry.prompt).trim(),
      provider: entry.provider || merged[dateKey]?.provider || 'default',
    };
  }
  return merged;
}

export function defaultCompanySeed(id, name, sortOrder, overrides = {}) {
  const brand = loadBrand();
  const topics = loadTopics();
  const knowledge = loadKnowledge();
  return {
    id,
    name,
    sortOrder,
    autoGenerateEnabled: id === 'aibhive',
    scheduleHour: 7,
    siteUrl: brand.siteUrl,
    brandVoice: brand.voice,
    imageStyle: brand.imageStyle,
    knowledge: knowledge.slice(0, 12000),
    topics: topics.length ? topics : [
      {
        slug: 'general',
        title: `${name} — industry insight`,
        angle: 'practical commentary with a clear takeaway for your audience',
        siteLink: brand.siteUrl,
      },
    ],
    textProvider: 'gemini',
    imageProvider: 'gemini',
    providers: mergeProviders(),
    socialLinks: { facebook: '', instagram: '', x: '' },
    notifyPhone: process.env.SOCIAL_NOTIFY_PHONE || '',
    notifyEnabled: true,
    dayPrompts: {},
    autoPublishOnApprove: false,
    socialApiKeys: {
      facebook: { accessToken: '', pageId: '' },
      instagram: { accessToken: '', accountId: '' },
    },
    ...overrides,
  };
}

function mergeCompany(data = {}) {
  return {
    ...defaultCompanySeed(data.id || 'company', data.name || 'Company', data.sortOrder ?? 0),
    ...data,
    providers: mergeProviders(data.providers),
    socialLinks: {
      facebook: data.socialLinks?.facebook || '',
      instagram: data.socialLinks?.instagram || '',
      x: data.socialLinks?.x || '',
    },
    dayPrompts: { ...(data.dayPrompts || {}) },
    socialApiKeys: {
      facebook: {
        pageId: data.socialApiKeys?.facebook?.pageId || '',
        accessToken: data.socialApiKeys?.facebook?.accessToken || '',
      },
      instagram: {
        accountId: data.socialApiKeys?.instagram?.accountId || '',
        accessToken: data.socialApiKeys?.instagram?.accessToken || '',
      },
    },
    topics: Array.isArray(data.topics) && data.topics.length ? data.topics : defaultCompanySeed(data.id, data.name, 0).topics,
  };
}

export function sanitizeCompany(company) {
  const merged = mergeCompany(company);
  return {
    id: merged.id,
    name: merged.name,
    sortOrder: merged.sortOrder,
    autoGenerateEnabled: !!merged.autoGenerateEnabled,
    scheduleHour: merged.scheduleHour ?? 7,
    siteUrl: merged.siteUrl,
    brandVoice: merged.brandVoice,
    imageStyle: merged.imageStyle,
    knowledge: merged.knowledge,
    topics: merged.topics,
    textProvider: merged.textProvider || 'gemini',
    imageProvider: merged.imageProvider || merged.textProvider || 'gemini',
    providers: {
      grok: {
        enabled: !!merged.providers.grok.enabled,
        textModel: merged.providers.grok.textModel,
        imageModel: merged.providers.grok.imageModel,
        apiKey: maskKey(merged.providers.grok.apiKey),
      },
      gemini: {
        enabled: !!merged.providers.gemini.enabled,
        textModel: merged.providers.gemini.textModel,
        imageModel: merged.providers.gemini.imageModel,
        apiKey: maskKey(merged.providers.gemini.apiKey),
      },
    },
    socialLinks: merged.socialLinks,
    notifyPhone: merged.notifyPhone || '',
    notifyEnabled: merged.notifyEnabled !== false,
    dayPrompts: merged.dayPrompts,
    autoPublishOnApprove: !!merged.autoPublishOnApprove,
    socialApiKeys: {
      facebook: {
        pageId: merged.socialApiKeys.facebook.pageId || '',
        accessToken: maskKey(merged.socialApiKeys.facebook.accessToken),
      },
      instagram: {
        accountId: merged.socialApiKeys.instagram.accountId || '',
        accessToken: maskKey(merged.socialApiKeys.instagram.accessToken),
      },
    },
    serverGeminiAvailable: !!process.env.GEMINI_API_KEY,
    updatedAt: merged.updatedAt || null,
  };
}

export function companyBrand(company) {
  const merged = mergeCompany(company);
  return {
    name: merged.name,
    siteUrl: merged.siteUrl,
    voice: merged.brandVoice,
    imageStyle: merged.imageStyle,
  };
}

export function getCompanyDayPrompt(company, dateKey) {
  const entry = mergeCompany(company).dayPrompts?.[dateKey];
  if (!entry?.prompt) return null;
  return entry;
}

export function getCompanySocialCredentials(company) {
  return mergeCompany(company).socialApiKeys;
}

export async function ensureDefaultCompanies() {
  const snap = await db().collection(COMPANIES_COLLECTION).limit(1).get();
  if (!snap.empty) return;

  const seeds = [
    defaultCompanySeed('aibhive', 'AiBhive', 0),
    defaultCompanySeed('company-2', 'Company 2', 1, {
      autoGenerateEnabled: false,
      knowledge: 'Describe your second client brand, services, and tone here.',
      topics: [{
        slug: 'client-2',
        title: 'Company 2 — weekly insight',
        angle: 'Share a practical tip or news angle for this brand audience',
        siteLink: 'https://example.com',
      }],
    }),
    defaultCompanySeed('company-3', 'Company 3', 2, {
      autoGenerateEnabled: false,
      knowledge: 'Describe your third client brand, services, and tone here.',
      topics: [{
        slug: 'client-3',
        title: 'Company 3 — weekly insight',
        angle: 'Share a practical tip or news angle for this brand audience',
        siteLink: 'https://example.com',
      }],
    }),
  ];

  const batch = db().batch();
  const now = Timestamp.now();
  for (const seed of seeds) {
    batch.set(db().collection(COMPANIES_COLLECTION).doc(seed.id), {
      ...seed,
      createdAt: now,
      updatedAt: now,
    });
  }
  await batch.commit();
  console.log('[socialCompanies] Seeded default companies');
}

export async function listCompanies() {
  await ensureDefaultCompanies();
  const snap = await db().collection(COMPANIES_COLLECTION).orderBy('sortOrder', 'asc').get();
  return snap.docs.map((d) => mergeCompany({ id: d.id, ...d.data() }));
}

export async function getCompany(companyId) {
  if (!companyId) return null;
  const snap = await db().collection(COMPANIES_COLLECTION).doc(companyId).get();
  if (!snap.exists) return null;
  return mergeCompany({ id: snap.id, ...snap.data() });
}

function applySecretField(next, value) {
  if (value && String(value).trim() && !String(value).includes('••••')) {
    return String(value).trim();
  }
  return next;
}

export async function createCompany({ name }) {
  await ensureDefaultCompanies();
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Company name is required.');

  const existing = await listCompanies();
  let id = slugify(trimmed);
  let suffix = 2;
  while (existing.some((c) => c.id === id)) {
    id = `${slugify(trimmed)}-${suffix}`;
    suffix += 1;
  }

  const company = defaultCompanySeed(id, trimmed, existing.length, {
    knowledge: `Brand knowledge for ${trimmed}. Describe services, audience, and tone.`,
    topics: [{
      slug: slugify(trimmed),
      title: `${trimmed} — weekly post`,
      angle: 'One clear, useful insight for this brand audience',
      siteLink: 'https://example.com',
    }],
    autoGenerateEnabled: false,
  });

  await db().collection(COMPANIES_COLLECTION).doc(id).set({
    ...company,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return getCompany(id);
}

export async function saveCompany(companyId, updates = {}) {
  const existing = await getCompany(companyId);
  if (!existing) throw new Error(`Company ${companyId} not found.`);

  const next = mergeCompany(existing);

  if (updates.name !== undefined) next.name = String(updates.name).trim() || next.name;
  if (updates.sortOrder !== undefined) next.sortOrder = Number(updates.sortOrder);
  if (updates.autoGenerateEnabled !== undefined) next.autoGenerateEnabled = !!updates.autoGenerateEnabled;
  if (updates.scheduleHour !== undefined) next.scheduleHour = Number(updates.scheduleHour);
  if (updates.siteUrl !== undefined) next.siteUrl = String(updates.siteUrl).trim();
  if (updates.brandVoice !== undefined) next.brandVoice = String(updates.brandVoice);
  if (updates.imageStyle !== undefined) next.imageStyle = String(updates.imageStyle);
  if (updates.knowledge !== undefined) next.knowledge = String(updates.knowledge).slice(0, 12000);
  if (updates.topics !== undefined && Array.isArray(updates.topics)) next.topics = updates.topics;
  if (updates.textProvider === 'grok' || updates.textProvider === 'gemini') next.textProvider = updates.textProvider;
  if (updates.imageProvider === 'grok' || updates.imageProvider === 'gemini') next.imageProvider = updates.imageProvider;
  if (updates.notifyPhone !== undefined) next.notifyPhone = String(updates.notifyPhone);
  if (updates.notifyEnabled !== undefined) next.notifyEnabled = !!updates.notifyEnabled;
  if (updates.autoPublishOnApprove !== undefined) next.autoPublishOnApprove = !!updates.autoPublishOnApprove;
  if (updates.socialLinks !== undefined) next.socialLinks = { ...next.socialLinks, ...updates.socialLinks };
  if (updates.dayPrompts) next.dayPrompts = mergeDayPrompts(next.dayPrompts, updates.dayPrompts);

  if (updates.providers?.grok) {
    const g = updates.providers.grok;
    if (g.enabled !== undefined) next.providers.grok.enabled = !!g.enabled;
    if (g.textModel) next.providers.grok.textModel = String(g.textModel);
    if (g.imageModel) next.providers.grok.imageModel = String(g.imageModel);
    next.providers.grok.apiKey = applySecretField(next.providers.grok.apiKey, g.apiKey);
  }
  if (updates.providers?.gemini) {
    const g = updates.providers.gemini;
    if (g.enabled !== undefined) next.providers.gemini.enabled = !!g.enabled;
    if (g.textModel) next.providers.gemini.textModel = String(g.textModel);
    if (g.imageModel) next.providers.gemini.imageModel = String(g.imageModel);
    next.providers.gemini.apiKey = applySecretField(next.providers.gemini.apiKey, g.apiKey);
  }

  if (updates.socialApiKeys?.facebook) {
    const fb = updates.socialApiKeys.facebook;
    if (fb.pageId !== undefined) next.socialApiKeys.facebook.pageId = String(fb.pageId).trim();
    next.socialApiKeys.facebook.accessToken = applySecretField(
      next.socialApiKeys.facebook.accessToken,
      fb.accessToken,
    );
  }
  if (updates.socialApiKeys?.instagram) {
    const ig = updates.socialApiKeys.instagram;
    if (ig.accountId !== undefined) next.socialApiKeys.instagram.accountId = String(ig.accountId).trim();
    next.socialApiKeys.instagram.accessToken = applySecretField(
      next.socialApiKeys.instagram.accessToken,
      ig.accessToken,
    );
  }

  await db().collection(COMPANIES_COLLECTION).doc(companyId).set(
    { ...next, updatedAt: Timestamp.now() },
    { merge: true },
  );

  return getCompany(companyId);
}

export async function deleteCompany(companyId) {
  if (companyId === 'aibhive') throw new Error('Cannot delete the default AiBhive company.');
  await db().collection(COMPANIES_COLLECTION).doc(companyId).delete();
  return { ok: true };
}

export function resolveCompanyProvider(company, kind, dateKey) {
  const merged = mergeCompany(company);
  const dayEntry = dateKey ? merged.dayPrompts?.[dateKey] : null;
  const dayOverride = dayEntry?.provider && dayEntry.provider !== 'default' ? dayEntry.provider : null;

  const preferred = kind === 'image'
    ? (dayOverride || merged.imageProvider || merged.textProvider || 'gemini')
    : (dayOverride || merged.textProvider || 'gemini');

  const grokKey = merged.providers.grok.apiKey;
  const geminiKey = merged.providers.gemini.apiKey || process.env.GEMINI_API_KEY;
  const grokOk = merged.providers.grok.enabled && grokKey;
  const geminiOk = merged.providers.gemini.enabled && geminiKey;

  if (preferred === 'grok' && grokOk) {
    return { provider: 'grok', credentials: { apiKey: grokKey, ...merged.providers.grok } };
  }
  if (preferred === 'gemini' && geminiOk) {
    return {
      provider: 'gemini',
      credentials: {
        apiKey: geminiKey,
        textModel: merged.providers.gemini.textModel,
        imageModel: merged.providers.gemini.imageModel,
      },
    };
  }
  if (grokOk) return { provider: 'grok', credentials: { apiKey: grokKey, ...merged.providers.grok } };
  if (geminiOk) {
    return {
      provider: 'gemini',
      credentials: {
        apiKey: geminiKey,
        textModel: merged.providers.gemini.textModel,
        imageModel: merged.providers.gemini.imageModel,
      },
    };
  }

  throw new Error(`Enable ${preferred} or add API keys for ${merged.name}.`);
}
