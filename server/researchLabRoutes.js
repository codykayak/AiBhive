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
import { aiHarvest, translateText } from './fableScrapeAgent.js';
import { publishFindings, listLibrary } from './fableLibrary.js';
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
import { applyTokenMarkup } from './hivePlans.js';

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
async function gateAndCharge(db, uid, rawCost, feature, summary) {
  const job = beginUserJob(uid);
  if (!job.ok) return { ok: false, status: 429, body: { error: job.reason, code: 'CONCURRENCY' } };

  try {
    await ensureHiveUser(db, uid);
    const budget = await requireResearchLabBudget(db, uid, rawCost, feature);
    if (!budget.ok) {
      endUserJob(uid);
      return { ok: false, status: 402, body: budget };
    }

    const marked = applyTokenMarkup(rawCost);
    const daily = await assertDailySpendCap(db, uid, marked, { reserve: true });
    if (!daily.ok) {
      endUserJob(uid);
      return { ok: false, status: 429, body: { error: daily.reason, code: 'DAILY_CAP' } };
    }

    const charge = await chargeResearchLabUsage(db, uid, rawCost, feature, summary);
    if (!charge.ok) {
      endUserJob(uid);
      return { ok: false, status: 402, body: charge };
    }

    return { ok: true, chargedUsd: charge.chargedUsd };
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
      const { routing } = req.body || {};
      const rawCost = scrapeRawCost(routing);
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        `Research Lab scan (${routing?.mode || 'browser'})`,
      );
      if (!gate.ok) return res.status(gate.status).json(gate.body);
      try {
        const result = await scanPage(req.body || {});
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
      const pages = Math.max(1, Math.min(Number(maxPages) || 6, MAX_CRAWL_PAGES));
      const rawCost = scrapeRawCost(routing) * pages;
      const gate = await gateAndCharge(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        `Research Lab crawl (${pages} pages max)`,
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

  app.post('/api/research-lab/fable-scrape/ai-harvest', json2mb, async (req, res) => {
    let uid = null;
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      uid = authUser.uid;
      const body = req.body || {};
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
    const authUser = await requireResearchLabUser(req, res);
    if (!authUser) return;
    try {
      const result = await listLibrary(db, { limit: req.query.limit });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to load library.' });
    }
  });
}
