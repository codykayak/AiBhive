const PROFILES_COLLECTION = 'socialUserProfiles';

const DEFAULT_PROFILE = {
  primaryProvider: 'gemini',
  providers: {
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
  },
  dayPrompts: {},
  autoPublishOnApprove: false,
  socialApiKeys: {
    facebook: { accessToken: '', pageId: '' },
    instagram: { accessToken: '', accountId: '' },
  },
};

let firestoreDb = null;

export function initSocialUserProfiles(db) {
  firestoreDb = db;
}

function db() {
  if (!firestoreDb) throw new Error('Social user profiles not initialized.');
  return firestoreDb;
}

function maskKey(key) {
  if (!key) return { set: false, hint: '' };
  const s = String(key);
  return { set: true, hint: `••••${s.slice(-4)}` };
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

function mergeProfile(data = {}) {
  return {
    primaryProvider: data.primaryProvider || DEFAULT_PROFILE.primaryProvider,
    providers: {
      grok: { ...DEFAULT_PROFILE.providers.grok, ...(data.providers?.grok || {}) },
      gemini: { ...DEFAULT_PROFILE.providers.gemini, ...(data.providers?.gemini || {}) },
    },
    dayPrompts: { ...(data.dayPrompts || {}) },
    autoPublishOnApprove: !!data.autoPublishOnApprove,
    socialApiKeys: {
      facebook: {
        ...DEFAULT_PROFILE.socialApiKeys.facebook,
        ...(data.socialApiKeys?.facebook || {}),
      },
      instagram: {
        ...DEFAULT_PROFILE.socialApiKeys.instagram,
        ...(data.socialApiKeys?.instagram || {}),
      },
    },
  };
}

export function sanitizeUserProfile(profile) {
  const merged = mergeProfile(profile);
  return {
    primaryProvider: merged.primaryProvider,
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
  };
}

export function getSocialApiCredentials(profile) {
  return mergeProfile(profile).socialApiKeys;
}

export function getDayPrompt(profile, dateKey) {
  const entry = mergeProfile(profile).dayPrompts?.[dateKey];
  if (!entry?.prompt) return null;
  return entry;
}

export async function getUserProfile(uid) {
  if (!uid) return mergeProfile();
  const snap = await db().collection(PROFILES_COLLECTION).doc(uid).get();
  if (!snap.exists) return mergeProfile();
  return mergeProfile(snap.data());
}

function applySecretField(next, value) {
  if (value && String(value).trim() && !String(value).includes('••••')) {
    return String(value).trim();
  }
  return next;
}

export async function saveUserProfile(uid, email, updates = {}) {
  if (!uid) throw new Error('User id required.');

  const existing = await getUserProfile(uid);
  const next = mergeProfile(existing);

  if (updates.primaryProvider === 'grok' || updates.primaryProvider === 'gemini') {
    next.primaryProvider = updates.primaryProvider;
  }

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

  if (updates.dayPrompts) {
    next.dayPrompts = mergeDayPrompts(next.dayPrompts, updates.dayPrompts);
  }

  if (updates.autoPublishOnApprove !== undefined) {
    next.autoPublishOnApprove = !!updates.autoPublishOnApprove;
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

  await db().collection(PROFILES_COLLECTION).doc(uid).set(
    {
      uid,
      email: email || null,
      ...next,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return getUserProfile(uid);
}

export function resolveGenerationProvider(profile, dateKey) {
  const merged = mergeProfile(profile);
  const dayEntry = dateKey ? merged.dayPrompts?.[dateKey] : null;
  const effectivePrimary =
    dayEntry?.provider && dayEntry.provider !== 'default'
      ? dayEntry.provider
      : merged.primaryProvider;

  const grokKey = merged.providers.grok.apiKey;
  const geminiKey = merged.providers.gemini.apiKey || process.env.GEMINI_API_KEY;
  const grokOk = merged.providers.grok.enabled && grokKey;
  const geminiOk = merged.providers.gemini.enabled && geminiKey;

  if (effectivePrimary === 'grok' && grokOk) {
    return { provider: 'grok', credentials: { apiKey: grokKey, ...merged.providers.grok } };
  }
  if (effectivePrimary === 'gemini' && geminiOk) {
    return {
      provider: 'gemini',
      credentials: {
        apiKey: merged.providers.gemini.apiKey || process.env.GEMINI_API_KEY,
        textModel: merged.providers.gemini.textModel,
        imageModel: merged.providers.gemini.imageModel,
      },
    };
  }
  if (grokOk) {
    return { provider: 'grok', credentials: { apiKey: grokKey, ...merged.providers.grok } };
  }
  if (geminiOk) {
    return {
      provider: 'gemini',
      credentials: {
        apiKey: merged.providers.gemini.apiKey || process.env.GEMINI_API_KEY,
        textModel: merged.providers.gemini.textModel,
        imageModel: merged.providers.gemini.imageModel,
      },
    };
  }

  throw new Error(
    'Enable Grok or Gemini in your profile, add a Grok API key, and ensure Gemini is on (server key or your own).',
  );
}
