/**
 * Express routes for Old Tartar Research — wraps functions/lib/tartar handlers.
 */
import { createTartarHandlers, handleTartarIngestionWorker, TartarApiError } from '../functions/lib/tartar/handlers.js';
import { verifyHiveAuth } from './hiveAuth.js';

function tartarSecrets() {
  return {
    gemini: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '',
    grok: process.env.GROK_API_KEY ?? process.env.XAI_API_KEY ?? '',
    kimi: process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY ?? '',
    workerSecret: process.env.TARTAR_WORKER_SECRET ?? '',
  };
}

function statusForTartarError(err) {
  if (err instanceof TartarApiError) {
    if (err.code === 'unauthenticated') return 401;
    if (err.code === 'invalid-argument') return 400;
    if (err.code === 'permission-denied') return 403;
    if (err.code === 'not-found') return 404;
    return 400;
  }
  if (/insufficient hive credits/i.test(err.message)) return 402;
  return 500;
}

async function requireTartarUser(req, res) {
  const authUser = await verifyHiveAuth(req);
  if (!authUser?.uid) {
    res.status(401).json({ error: 'Sign in to use Old Tartar Research.' });
    return null;
  }
  return authUser;
}

function tartarRequest(authUser, body = {}) {
  return { auth: { uid: authUser.uid }, data: body };
}

export function registerTartarRoutes(app, db) {
  const handlers = createTartarHandlers({ db, platformSecrets: tartarSecrets() });

  async function invoke(res, fn, authUser, body) {
    try {
      const result = await fn(tartarRequest(authUser, body));
      return res.json(result);
    } catch (err) {
      console.error('[tartar]', err);
      const status = statusForTartarError(err);
      return res.status(status).json({ error: err.message || 'Tartar request failed.' });
    }
  }

  app.post('/api/tartar/init', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarInit.bind(handlers), authUser);
  });

  app.get('/api/tartar/profile', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarGetProfile.bind(handlers), authUser);
  });

  app.post('/api/tartar/custom-build', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarSaveCustomBuild.bind(handlers), authUser, { build: req.body?.build });
  });

  app.post('/api/tartar/sources', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarAddSource.bind(handlers), authUser, { source: req.body?.source });
  });

  app.post('/api/tartar/search-terms', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarAddSearchTerm.bind(handlers), authUser, req.body ?? {});
  });

  app.post('/api/tartar/ingestion/start', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarStartIngestion.bind(handlers), authUser, req.body ?? {});
  });

  app.post('/api/tartar/anomalies/detect', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarDetectAnomalies.bind(handlers), authUser, req.body ?? {});
  });

  app.post('/api/tartar/mentions/query', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarQueryMentions.bind(handlers), authUser, req.body ?? {});
  });

  app.post('/api/tartar/entities/query', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarQueryEntities.bind(handlers), authUser, req.body ?? {});
  });

  app.post('/api/tartar/billing-mode', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarSetBillingMode.bind(handlers), authUser, { mode: req.body?.mode });
  });

  app.post('/api/tartar/api-keys', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarStoreApiKey.bind(handlers), authUser, {
      provider: req.body?.provider,
      apiKey: req.body?.apiKey,
    });
  });

  app.post('/api/tartar/promo-code', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarRedeemPromo.bind(handlers), authUser, { code: req.body?.code });
  });

  app.get('/api/tartar/archive-stats', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarGetArchiveStats.bind(handlers), authUser);
  });

  app.post('/api/tartar/share-opt-in', async (req, res) => {
    const authUser = await requireTartarUser(req, res);
    if (!authUser) return;
    return invoke(res, handlers.tartarSetShareOptIn.bind(handlers), authUser, { enabled: req.body?.enabled });
  });

  app.post('/api/tartar/ingestion/worker', (req, res) => {
    return handleTartarIngestionWorker(req, res, { db, platformSecrets: tartarSecrets() });
  });
}
