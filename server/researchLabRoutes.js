/**
 * Research Lab — authenticated, metered utility routes.
 */
import express from 'express';
import { verifyHiveAuth } from './hiveAuth.js';
import { runOcrOnImages } from './ocr.js';
import {
  scanPage,
  crawlSite,
  downloadAsset,
  fetchImagesForOcr,
  residentialProxyStatus,
  testProxyConnection,
} from './fableScrape.js';
import { aiHarvest, translateText, scoutDigPlaces } from './fableScrapeAgent.js';
import {
  publishFindings,
  listLibrary,
  getLibraryEntry,
  submitCorrection,
  listGlossary,
  getTopicStats,
} from './fableLibrary.js';
import { providerStatus } from './fableScrapeProviders.js';
import { ensureHiveUser } from './hiveBilling.js';
import {
  chargeResearchLabUsage,
  harvestRawCost,
  requireResearchLabBudget,
  researchOcrRawCost,
  resolveResearchOcrKey,
  RESEARCH_BYOK_ORCHESTRATION_RAW,
  RESEARCH_PUBLISH_RAW,
  RESEARCH_TRANSLATE_RAW,
  scrapeRawCost,
} from './researchLabBilling.js';
import {
  assertDailySpendCap,
  beginUserJob,
  endUserJob,
  MAX_CRAWL_PAGES,
  MAX_OCR_IMAGES,
} from './costProtection.js';
import { markCostForUser } from './hiveUsage.js';
import { estimateForUser } from './researchLabEstimates.js';
import { listDomainPacks, getDomainPack } from './researchDomainPacks.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  appendProjectReceipt,
  forkLibraryEntryIntoProject,
} from './researchProjects.js';
import { parseHttpUrl } from './urlNormalize.js';
import {
  getTartarianDigPacks,
  getTartarianFindsDirectory,
  getTartarianStarterBrief,
} from './tartarianFindsDirectory.js';
import {
  getNagHammadiDigPacks,
  getNagHammadiFindsDirectory,
  getNagHammadiStarterBrief,
} from './nagHammadiFindsDirectory.js';
import { getResearchLabFablePrefs, saveResearchLabFablePrefs } from './researchLabPrefs.js';

const json2mb = express.json({ limit: '2mb' });
const json10mb = express.json({ limit: '10mb' });

async function requireResearchLabUser(req, res) {
  const authUser = await verifyHiveAuth(req);
  if (!authUser?.uid) {
    res.status(401).json({ error: 'Sign in to use Research Lab tools.' });
    return null;
  }
  return authUser;
}

function usesPlatformRouting(routing) {
  const mode = routing?.mode || 'browser';
  return mode === 'residential' || mode === 'server';
}

/**
 * Budget + daily spend + concurrency gate. Charges credits BEFORE work so
 * failed charges cannot leave platform API spend unpaid.
 */
async function gateAndCharge(db, uid, rawCost, feature, summary, { email } = {}) {
  const job = beginUserJob(uid);
  if (!job.ok) return { ok: false, status: 429, body: { error: job.reason, code: 'CONCURRENCY' } };

  try {
    await ensureHiveUser(db, uid);
    if (email) {
      await db
        .collection('hive_users')
        .doc(uid)
        .set({ email: String(email).toLowerCase() }, { merge: true });
    }
    const budget = await requireResearchLabBudget(db, uid, rawCost, feature, { email });
    if (!budget.ok) {
      endUserJob(uid);
      return { ok: false, status: 402, body: budget };
    }

    const { markedUsd: marked } = await markCostForUser(db, uid, rawCost);
    const daily = await assertDailySpendCap(db, uid, marked, { reserve: true, email });
    if (!daily.ok) {
      endUserJob(uid);
      return { ok: false, status: 429, body: { error: daily.reason, code: 'DAILY_CAP' } };
    }

    const charge = await chargeResearchLabUsage(db, uid, rawCost, feature, summary, { email });
    if (!charge.ok) {
      endUserJob(uid);
      return { ok: false, status: 402, body: charge };
    }

    return {
      ok: true,
      chargedUsd: charge.chargedUsd ?? 0,
      adminExempt: !!(daily.adminExempt || charge.adminExempt),
    };
  } catch (err) {
    endUserJob(uid);
    throw err;
  }
}

/**
 * @param {import('express').Express} app
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export function registerResearchLabRoutes(app, db) {
  app.post('/api/research-lab/ocr', json10mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;

      const { images, format } = req.body || {};
      const pageCount = Array.isArray(images) ? images.length : 0;
      if (!pageCount) {
        return res.status(400).json({ error: 'No images provided.' });
      }
      if (pageCount > MAX_OCR_IMAGES) {
        return res.status(400).json({ error: `Maximum ${MAX_OCR_IMAGES} images per request.` });
      }

      const platformKey = process.env.GEMINI_API_KEY ?? '';
      const ocrKey = await resolveResearchOcrKey(db, authUser.uid, platformKey);
      const rawCost =
        ocrKey.billingMode === 'byok'
          ? RESEARCH_BYOK_ORCHESTRATION_RAW * pageCount
          : researchOcrRawCost(pageCount);

      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_ocr',
        `Research Lab OCR (${pageCount} pages, ${ocrKey.billingMode})`,
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);

      try {
        const text = await runOcrOnImages(images, format, ocrKey.apiKey);
        return res.json({ text, chargedUsd: gate.chargedUsd, billingMode: ocrKey.billingMode });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      console.error('[research-lab/ocr]', error);
      const status =
        error.message?.includes('Maximum') || error.message?.includes('No images') ? 400 : 500;
      return res.status(status).json({ error: error.message || 'OCR failed.' });
    }
  });

  app.get('/api/research-lab/fable-scrape/status', async (req, res) => {
    const authUser = await requireResearchLabUser(req, res);
    if (!authUser) return;
    return res.json({
      residentialProxy: residentialProxyStatus(),
      firecrawl: !!process.env.FIRECRAWL_API_KEY,
    });
  });

  app.get('/api/research-lab/fable-scrape/providers', async (req, res) => {
    const authUser = await requireResearchLabUser(req, res);
    if (!authUser) return;
    return res.json({ providers: providerStatus() });
  });

  app.post('/api/research-lab/fable-scrape/test-proxy', json2mb, async (req, res) => {
    const authUser = await requireResearchLabUser(req, res);
    if (!authUser) return;
    try {
      const result = await testProxyConnection(req.body?.routing);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Proxy test failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/scan', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const body = req.body || {};
      const { routing } = body;
      // Validate URL before charging Hive credits
      const parsed = parseHttpUrl(body.url);
      body.url = parsed.toString();
      const rawCost = scrapeRawCost(routing);
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        `Research Lab scan (${routing?.mode || 'browser'})`,
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const result = await scanPage(body);
        return res.json({ ...result, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'Scan failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/crawl', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const body = req.body || {};
      const { routing, maxPages } = body;
      const parsed = parseHttpUrl(body.url);
      body.url = parsed.toString();
      const pages = Math.max(1, Math.min(Number(maxPages) || 6, MAX_CRAWL_PAGES));
      const rawCost = scrapeRawCost(routing) * pages;
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        `Research Lab crawl (${pages} pages max)`,
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const result = await crawlSite({ ...body, maxPages: pages });
        return res.json({ ...result, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'Crawl failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/download', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const rawCost = scrapeRawCost(req.body?.routing) * 0.25;
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        'Research Lab asset download',
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const asset = await downloadAsset(req.body || {});
        return res.json({ ...asset, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'Download failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/ocr', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const { urls, routing, format } = req.body || {};
      const pageCount = Math.min(Array.isArray(urls) ? urls.length : 1, MAX_OCR_IMAGES);
      const platformKey = process.env.GEMINI_API_KEY ?? '';
      const ocrKey = await resolveResearchOcrKey(db, authUser.uid, platformKey);
      const rawCost =
        ocrKey.billingMode === 'byok'
          ? RESEARCH_BYOK_ORCHESTRATION_RAW * pageCount
          : researchOcrRawCost(pageCount) + scrapeRawCost(routing);

      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_ocr',
        `Research Lab Fable OCR (${pageCount} images)`,
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const { images, fetched, failed } = await fetchImagesForOcr({
          ...(req.body || {}),
          urls: Array.isArray(urls) ? urls.slice(0, MAX_OCR_IMAGES) : urls,
        });
        if (!images.length) {
          return res.status(400).json({ error: 'Could not fetch any images for OCR.', failed });
        }
        const text = await runOcrOnImages(images, format, ocrKey.apiKey);
        return res.json({ text, fetched, failed, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'OCR failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/scout-digs', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const body = req.body || {};
      const query = String(body.query || body.prompt || '').trim();
      if (!query) return res.status(400).json({ error: 'Describe what you want to find.' });
      // Free scout — template hubs + optional light director ranking (no harvest charge)
      const result = await scoutDigPlaces({
        query,
        count: Math.min(Number(body.count) || 3, 6),
        roles: body.roles,
        keys: body.keys,
        useDirector: body.useDirector !== false,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Scout failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/ai-harvest', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const body = req.body || {};
      const rawUrl = String(body.url || '').trim();
      const prompt = String(body.prompt || '').trim();
      if (!prompt) {
        return res.status(400).json({ error: 'Describe what you want the AI to find.' });
      }
      // URL is optional — DROC scout resolves dig sites from the prompt when blank
      if (rawUrl) {
        const parsed = parseHttpUrl(rawUrl);
        body.url = parsed.toString();
      } else {
        body.url = '';
      }
      const rawCost = harvestRawCost(
        body.keys,
        body.roles,
        usesPlatformRouting(body.routing),
        body.count,
      );
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_ai_harvest',
        'Research Lab AI harvest',
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const result = await aiHarvest({
          ...body,
          maxPages: Math.min(Number(body.maxPages) || 6, MAX_CRAWL_PAGES),
        });
        return res.json({ ...result, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'AI harvest failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/translate', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        RESEARCH_TRANSLATE_RAW,
        'research_lab_translate',
        'Research Lab translation',
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const result = await translateText(req.body || {});
        return res.json({ ...result, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'Translation failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/publish', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        RESEARCH_PUBLISH_RAW,
        'research_lab_publish',
        'Research Lab library publish',
        { email: authUser.email },
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const result = await publishFindings(db, {
          ...(req.body || {}),
          publishedBy: authUser.uid,
        });
        return res.json({ ...result, chargedUsd: gate.chargedUsd });
      } finally {
        endUserJob(authUser.uid);
      }
    } catch (error) {
      if (uid) endUserJob(uid);
      return res.status(400).json({ error: error.message || 'Publish failed.' });
    }
  });

  app.get('/api/research-lab/fable-scrape/library', async (req, res) => {
    try {
      const authUser = await verifyHiveAuth(req);
      const result = await listLibrary(db, {
        limit: req.query.limit,
        topicId: req.query.topicId,
        q: req.query.q,
        shareToken: req.query.share,
        viewerUid: authUser?.uid || null,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to load library.' });
    }
  });

  app.get('/api/research-lab/library/topics', async (_req, res) => {
    try {
      const result = await getTopicStats(db);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to load topic stats.' });
    }
  });

  app.get('/api/research-lab/library/:id', async (req, res) => {
    try {
      const authUser = await verifyHiveAuth(req);
      const entry = await getLibraryEntry(db, req.params.id, {
        viewerUid: authUser?.uid,
        shareToken: req.query.share,
      });
      if (!entry) return res.status(404).json({ error: 'Entry not found.' });
      return res.json({ ok: true, entry });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to load entry.' });
    }
  });

  app.post('/api/research-lab/library/:id/correct', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const result = await submitCorrection(db, {
        entryId: req.params.id,
        field: req.body?.field,
        original: req.body?.original,
        corrected: req.body?.corrected,
        note: req.body?.note,
        userId: authUser.uid,
        contributor: authUser.email || authUser.uid,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Correction failed.' });
    }
  });

  app.get('/api/research-lab/glossary', async (req, res) => {
    try {
      const result = await listGlossary(db, {
        topicId: req.query.topicId,
        limit: req.query.limit,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to load glossary.' });
    }
  });

  app.post('/api/research-lab/library/:id/fork', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const entry = await getLibraryEntry(db, req.params.id, {
        viewerUid: authUser.uid,
        shareToken: req.body?.share || req.query.share,
      });
      if (!entry) return res.status(404).json({ error: 'Entry not found or not accessible.' });
      await ensureHiveUser(db, authUser.uid);
      const result = await forkLibraryEntryIntoProject(db, authUser.uid, entry, {
        title: req.body?.title,
        domainPackId: req.body?.domainPackId,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Fork failed.' });
    }
  });

  app.post('/api/research-lab/estimate', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const result = await estimateForUser(db, authUser.uid, req.body?.op, req.body?.params || {});
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Estimate failed.' });
    }
  });

  app.get('/api/research-lab/domain-packs', (_req, res) => {
    return res.json({ ok: true, packs: listDomainPacks(_req.query.category) });
  });

  app.get('/api/research-lab/domain-packs/:id', (req, res) => {
    const pack = getDomainPack(req.params.id);
    if (!pack) return res.status(404).json({ error: 'Pack not found.' });
    return res.json({ ok: true, pack });
  });

  /** Documented Tartarian / Old World starter finds for assistants & UI. */
  app.get('/api/research-lab/tartarian-finds', (req, res) => {
    const maxChars = Math.min(28000, Math.max(2000, Number(req.query.maxChars) || 14000));
    const brief = req.query.brief === '1' || req.query.brief === 'true';
    const digPacks = getTartarianDigPacks();
    const markdown = brief
      ? getTartarianStarterBrief({ maxChars: Math.min(maxChars, 5500) })
      : getTartarianFindsDirectory({ maxChars });
    return res.json({
      ok: true,
      brief,
      chars: markdown.length,
      markdown,
      digPacks,
      topicId: 'tartarian',
      hint:
        'Scout mode: for vague questions present 3 digs with paste-ready URLs + probability, then ask A/B/C. Never invent quotes. Chron Am = search-results URLs only.',
    });
  });

  /** Nag Hammadi / Gnostic tractate dig packs for assistants & harvest. */
  app.get('/api/research-lab/nag-hammadi-finds', (req, res) => {
    const maxChars = Math.min(28000, Math.max(2000, Number(req.query.maxChars) || 14000));
    const brief = req.query.brief === '1' || req.query.brief === 'true';
    const digPacks = getNagHammadiDigPacks();
    const markdown = brief
      ? getNagHammadiStarterBrief({ maxChars: Math.min(maxChars, 5500) })
      : getNagHammadiFindsDirectory({ maxChars });
    return res.json({
      ok: true,
      brief,
      chars: markdown.length,
      markdown,
      digPacks,
      topicId: 'nag-hammadi',
      tractateCount: 45,
      hint:
        'Scout mode: offer Robinson English / Gospel of Thomas / Pistis Sophia Mead digs with paste-ready URLs, then ask A/B/C. Publish to topic nag-hammadi for word indexing. Never invent Coptic readings.',
    });
  });

  app.get('/api/research-lab/projects', async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const result = await listProjects(db, authUser.uid);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to list projects.' });
    }
  });

  app.post('/api/research-lab/projects', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      await ensureHiveUser(db, authUser.uid);
      const result = await createProject(db, authUser.uid, req.body || {});
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to create project.' });
    }
  });

  app.get('/api/research-lab/projects/:id', async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const project = await getProject(db, authUser.uid, req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });
      return res.json({ ok: true, project });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to load project.' });
    }
  });

  app.patch('/api/research-lab/projects/:id', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const result = await updateProject(db, authUser.uid, req.params.id, req.body || {});
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to update project.' });
    }
  });

  app.delete('/api/research-lab/projects/:id', async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      await deleteProject(db, authUser.uid, req.params.id);
      return res.json({ ok: true });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to delete project.' });
    }
  });

  app.post('/api/research-lab/projects/:id/receipt', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const result = await appendProjectReceipt(db, authUser.uid, req.params.id, req.body || {});
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to save receipt.' });
    }
  });

  app.get('/api/research-lab/fable-prefs', async (req, res) => {
    const authUser = await requireResearchLabUser(req, res);
    if (!authUser) return;
    try {
      const prefs = await getResearchLabFablePrefs(db, authUser.uid);
      return res.json(prefs);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Could not load preferences.' });
    }
  });

  app.put('/api/research-lab/fable-prefs', json2mb, async (req, res) => {
    const authUser = await requireResearchLabUser(req, res);
    if (!authUser) return;
    try {
      const prefs = await saveResearchLabFablePrefs(db, authUser.uid, req.body || {});
      return res.json(prefs);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Could not save preferences.' });
    }
  });
}
