import { adminJson } from '../../lib/adminApi';

export function createTartarApi(user) {
  const post = (path, body) =>
    adminJson(path, user, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });

  return {
    init: () => post('/api/tartar/init'),
    getProfile: () => adminJson('/api/tartar/profile', user),
    saveCustomBuild: (build) => post('/api/tartar/custom-build', { build }),
    addSource: (source) => post('/api/tartar/sources', { source }),
    addSearchTerm: (data) => post('/api/tartar/search-terms', data),
    startIngestion: (data) => post('/api/tartar/ingestion/start', data),
    detectAnomalies: (payload) => post('/api/tartar/anomalies/detect', payload ?? {}),
    getArchiveStats: () => adminJson('/api/tartar/archive-stats', user),
    setShareOptIn: (enabled) => post('/api/tartar/share-opt-in', { enabled }),
    queryMentions: (filters) => post('/api/tartar/mentions/query', filters),
    queryEntities: (filters) => post('/api/tartar/entities/query', filters),
    setBillingMode: (mode) => post('/api/tartar/billing-mode', { mode }),
    storeApiKey: (provider, apiKey) => post('/api/tartar/api-keys', { provider, apiKey }),
    redeemPromoCode: (code) => post('/api/tartar/promo-code', { code }),
  };
}

/** @param {User|null|undefined} user */
export function tartarApiFor(user) {
  if (!user) throw new Error('Sign in to use Old Tartar Research.');
  return createTartarApi(user);
}
