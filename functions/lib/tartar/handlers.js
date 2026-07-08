/**
 * Callable + HTTP handlers for Old Tartar Research.
 */

export class TartarApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TartarApiError';
    this.code = code;
  }
}
import { FieldValue } from 'firebase-admin/firestore';
import { ensureProfile, storeApiKey, setBillingMode, PLATFORM_FEE_RATE, resolveApiKey, chargeCredits } from './credits.js';
import { redeemPromoCode, effectiveFeeRate } from './promoCodes.js';
import { runIngestionJob, seedDefaultSources } from './pipeline.js';
import { detectAnomalies } from './anomalyDetection.js';
import { analyzeAnomaliesWithFocus } from './aiProviders.js';
import { getArchiveStats } from './archiveStats.js';
import {
  setShareOptIn,
  contributeUserData,
  queryPooledAnomalies,
  anomalyCacheKey,
  getCachedAnomalyResult,
  setCachedAnomalyResult,
} from './pool.js';
import {
  customBuildRef,
  mentionsCol,
  entitiesCol,
  sourcesCol,
  searchTermsCol,
  ingestionJobsCol,
  anomaliesCol,
} from './paths.js';
import { SUPPORTED_PROVIDERS } from './aiProviders.js';
import { listAdapterKinds } from './ingestion/registry.js';

const DEFAULT_CATALOG = [
  { id: 'internet_archive', name: 'Internet Archive', kind: 'internet_archive', enabled: true, isCustom: false, defaultSearchTerms: ['Tartaria', 'Tartary'] },
  { id: 'david_rumsey', name: 'David Rumsey Map Collection', kind: 'david_rumsey', enabled: true, isCustom: false, defaultSearchTerms: ['Tartary'] },
  { id: 'loc_maps', name: 'Library of Congress — Maps', kind: 'loc_maps', enabled: true, isCustom: false, defaultSearchTerms: ['Tartary'] },
  { id: 'chronicling_america', name: 'Chronicling America', kind: 'chronicling_america', enabled: true, isCustom: false, defaultSearchTerms: ['architect', 'builder'] },
  { id: 'google_books', name: 'Google Books', kind: 'google_books', enabled: true, isCustom: false, defaultSearchTerms: ['Tartary geography'] },
  { id: 'reddit_tartaria', name: 'Reddit — r/Tartaria', kind: 'reddit', enabled: false, isCustom: false, adapterConfig: { subreddits: ['Tartaria', 'CulturalLayer'] } },
  { id: 'stolen_history', name: 'StolenHistory.net', kind: 'stolen_history', enabled: false, isCustom: false },
];

function requireUid(request) {
  if (!request.auth?.uid) throw new TartarApiError('unauthenticated', 'Sign in to use Old Tartar Research.');
  return request.auth.uid;
}

export function createTartarHandlers({ db, platformSecrets = {} }) {
  return {
    async tartarInit(request) {
      const uid = requireUid(request);
      const profile = await ensureProfile(db, uid);
      await seedDefaultSources(db, uid, DEFAULT_CATALOG);
      return { profile, platformFeeRate: PLATFORM_FEE_RATE, supportedProviders: SUPPORTED_PROVIDERS, adapterKinds: listAdapterKinds() };
    },

    async tartarSaveCustomBuild(request) {
      const uid = requireUid(request);
      const build = request.data?.build ?? {};
      await customBuildRef(db, uid).set({
        name: build.name ?? 'My Research Build',
        description: build.description ?? '',
        enabledSourceIds: build.enabledSourceIds ?? [],
        enabledEntityTypes: build.enabledEntityTypes ?? [],
        dashboardWidgets: build.dashboardWidgets ?? ['mentions', 'anomalies', 'timeline'],
        anomalyRules: build.anomalyRules ?? {},
        theme: build.theme ?? {},
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { ok: true };
    },

    async tartarAddSource(request) {
      const uid = requireUid(request);
      const source = request.data?.source ?? {};
      if (!source.name || !source.kind) {
        throw new TartarApiError('invalid-argument', 'source.name and source.kind are required.');
      }
      const id = source.id ?? `custom_${Date.now()}`;
      await sourcesCol(db, uid).doc(id).set({
        ...source,
        id,
        enabled: source.enabled !== false,
        isCustom: true,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { id };
    },

    async tartarAddSearchTerm(request) {
      const uid = requireUid(request);
      const { term, sourceIds, notes } = request.data ?? {};
      if (!term?.trim()) throw new TartarApiError('invalid-argument', 'term is required.');
      const ref = searchTermsCol(db, uid).doc();
      await ref.set({
        term: term.trim(),
        sourceIds: sourceIds ?? [],
        enabled: true,
        notes: notes ?? '',
        createdAt: FieldValue.serverTimestamp(),
      });
      return { id: ref.id };
    },

    async tartarStartIngestion(request) {
      const uid = requireUid(request);
      const { sourceIds, searchTerms, aiProvider, useAi } = request.data ?? {};
      if (!sourceIds?.length) throw new TartarApiError('invalid-argument', 'sourceIds required.');
      const provider = aiProvider ?? 'gemini';
      if (useAi !== false && !SUPPORTED_PROVIDERS.includes(provider)) {
        throw new TartarApiError('invalid-argument', `aiProvider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`);
      }

      const ref = ingestionJobsCol(db, uid).doc();
      await ref.set({
        status: 'queued',
        sourceIds,
        searchTerms: searchTerms ?? [],
        aiProvider: provider,
        useAi: useAi !== false,
        createdAt: FieldValue.serverTimestamp(),
      });

      const result = await runIngestionJob(db, uid, ref.id, platformSecrets);
      return { jobId: ref.id, ...result };
    },

    async tartarDetectAnomalies(request) {
      const uid = requireUid(request);
      const { rules = {}, customPrompt, aiProvider, usePool = true } = request.data ?? {};
      const provider = aiProvider ?? (await ensureProfile(db, uid)).defaultAiProvider ?? 'gemini';
      const cacheKey = anomalyCacheKey(rules, customPrompt);

      if (usePool && !customPrompt?.trim()) {
        const cached = await getCachedAnomalyResult(db, cacheKey);
        if (cached?.anomalies?.length) {
          return { count: cached.anomalies.length, anomalies: cached.anomalies.slice(0, 50), fromCache: true, fromPool: true };
        }
        const pooled = await queryPooledAnomalies(db, 30);
        if (pooled.length && !(await mentionsCol(db, uid).limit(1).get()).docs.length) {
          return { count: pooled.length, anomalies: pooled, fromPool: true };
        }
      }

      const snap = await mentionsCol(db, uid).limit(5000).get();
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.year != null)
        .map((m) => ({
          entityId: m.entityId,
          entityName: m.entityName,
          entityType: m.entityType,
          year: m.year,
          project: m.project,
        }));

      let detected = detectAnomalies(rows, rules);

      if (customPrompt?.trim()) {
        try {
          const { key, chargeCredits: shouldCharge } = await resolveApiKey(db, uid, provider, platformSecrets);
          const sampleMentions = snap.docs.slice(0, 20).map((d) => d.data());
          const aiResult = await analyzeAnomaliesWithFocus(provider, key, {
            anomalies: detected,
            customPrompt,
            sampleMentions,
          });
          detected = aiResult.anomalies;
          if (shouldCharge && aiResult.usage) {
            await chargeCredits(db, uid, {
              provider,
              inputTokens: aiResult.usage.inputTokens,
              outputTokens: aiResult.usage.outputTokens,
              operation: 'anomaly_focus',
            });
          }
        } catch (err) {
          console.warn('[tartar] AI anomaly focus failed:', err.message);
        }
      }

      const batch = db.batch();
      const col = anomaliesCol(db, uid);
      for (const a of detected) {
        const ref = col.doc();
        batch.set(ref, {
          ...a,
          id: ref.id,
          focusPrompt: customPrompt?.trim() || null,
          detectedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      await setCachedAnomalyResult(db, cacheKey, { anomalies: detected.slice(0, 100) });
      await contributeUserData(db, uid);

      return { count: detected.length, anomalies: detected.slice(0, 50), fromCache: false };
    },

    async tartarQueryMentions(request) {
      const uid = requireUid(request);
      const { entityType, sourceId, yearMin, yearMax, limit = 100 } = request.data ?? {};
      let q = mentionsCol(db, uid).orderBy('createdAt', 'desc');
      if (entityType) q = q.where('entityType', '==', entityType);
      if (sourceId) q = q.where('sourceId', '==', sourceId);
      if (yearMin != null) q = q.where('year', '>=', Number(yearMin));
      if (yearMax != null) q = q.where('year', '<=', Number(yearMax));
      const snap = await q.limit(Math.min(limit, 500)).get();
      return { mentions: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
    },

    async tartarQueryEntities(request) {
      const uid = requireUid(request);
      const { minMentions = 1, limit = 100 } = request.data ?? {};
      const snap = await entitiesCol(db, uid)
        .where('mentionCount', '>=', Number(minMentions))
        .orderBy('mentionCount', 'desc')
        .limit(Math.min(limit, 500))
        .get();
      return { entities: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
    },

    async tartarSetBillingMode(request) {
      const uid = requireUid(request);
      const { mode } = request.data ?? {};
      await setBillingMode(db, uid, mode);
      return { ok: true };
    },

    async tartarStoreApiKey(request) {
      const uid = requireUid(request);
      const { provider, apiKey } = request.data ?? {};
      if (!SUPPORTED_PROVIDERS.includes(provider)) {
        throw new TartarApiError('invalid-argument', 'Invalid provider.');
      }
      if (!apiKey?.trim()) throw new TartarApiError('invalid-argument', 'apiKey required.');
      await storeApiKey(db, uid, provider, apiKey);
      return { ok: true };
    },

    async tartarRedeemPromo(request) {
      const uid = requireUid(request);
      const { code } = request.data ?? {};
      if (!code?.trim()) throw new TartarApiError('invalid-argument', 'Promo code required.');
      return redeemPromoCode(db, uid, code);
    },

    async tartarGetArchiveStats(request) {
      const uid = requireUid(request);
      return getArchiveStats(db, uid);
    },

    async tartarSetShareOptIn(request) {
      const uid = requireUid(request);
      const { enabled } = request.data ?? {};
      return setShareOptIn(db, uid, Boolean(enabled));
    },

    async tartarGetProfile(request) {
      const uid = requireUid(request);
      const profile = await ensureProfile(db, uid);
      const buildSnap = await customBuildRef(db, uid).get();
      const sourcesSnap = await sourcesCol(db, uid).get();
      const fee = effectiveFeeRate(profile);
      return {
        profile,
        customBuild: buildSnap.exists ? buildSnap.data() : null,
        sources: sourcesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        platformFeeRate: PLATFORM_FEE_RATE,
        effectiveFeeRate: fee,
        hasPromo: Boolean(profile.waivePlatformMarkup),
      };
    },
  };
}

export async function handleTartarIngestionWorker(req, res, { db, platformSecrets }) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const secret = req.headers['x-tartar-worker-secret'];
  if (platformSecrets.workerSecret && secret !== platformSecrets.workerSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { uid, jobId } = req.body ?? {};
  if (!uid || !jobId) {
    res.status(400).json({ error: 'uid and jobId required' });
    return;
  }
  try {
    const result = await runIngestionJob(db, uid, jobId, platformSecrets);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: String(err.message) });
  }
}
