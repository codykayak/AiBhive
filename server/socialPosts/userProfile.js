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

function mergeProfile(data = {}) {
  return {
    primaryProvider: data.primaryProvider || DEFAULT_PROFILE.primaryProvider,
    providers: {
      grok: { ...DEFAULT_PROFILE.providers.grok, ...(data.providers?.grok || {}) },
      gemini: { ...DEFAULT_PROFILE.providers.gemini, ...(data.providers?.gemini || {}) },
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
    serverGeminiAvailable: !!process.env.GEMINI_API_KEY,
  };
}

export async function getUserProfile(uid) {
  if (!uid) return mergeProfile();
  const snap = await db().collection(PROFILES_COLLECTION).doc(uid).get();
  if (!snap.exists) return mergeProfile();
  return mergeProfile(snap.data());
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
    if (g.apiKey && String(g.apiKey).trim() && !String(g.apiKey).includes('••••')) {
      next.providers.grok.apiKey = String(g.apiKey).trim();
    }
  }

  if (updates.providers?.gemini) {
    const g = updates.providers.gemini;
    if (g.enabled !== undefined) next.providers.gemini.enabled = !!g.enabled;
    if (g.textModel) next.providers.gemini.textModel = String(g.textModel);
    if (g.imageModel) next.providers.gemini.imageModel = String(g.imageModel);
    if (g.apiKey && String(g.apiKey).trim() && !String(g.apiKey).includes('••••')) {
      next.providers.gemini.apiKey = String(g.apiKey).trim();
    }
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

export function resolveGenerationProvider(profile) {
  const merged = mergeProfile(profile);
  const grokKey = merged.providers.grok.apiKey;
  const geminiKey = merged.providers.gemini.apiKey || process.env.GEMINI_API_KEY;
  const grokOk = merged.providers.grok.enabled && grokKey;
  const geminiOk = merged.providers.gemini.enabled && geminiKey;

  if (merged.primaryProvider === 'grok' && grokOk) {
    return { provider: 'grok', credentials: { apiKey: grokKey, ...merged.providers.grok } };
  }
  if (merged.primaryProvider === 'gemini' && geminiOk) {
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
