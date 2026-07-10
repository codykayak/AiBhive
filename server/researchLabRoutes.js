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
import { getResearchLabFablePrefs, saveResearchLabFablePrefs } from './researchLabPrefs.js';

const json2mb = express.json({ limit: '2mb' });
const json50mb = express.json({ limit: '50mb' });

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
 * @param {import('express').Express} app
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export function registerResearchLabRoutes(app, db) {
  app.post('/api/research-lab/ocr', json50mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;

      const { images, format } = req.body || {};
      const pageCount = Array.isArray(images) ? images.length : 0;
      if (!pageCount) {
        return res.status(400).json({ error: 'No images provided.' });
      }

      await ensureHiveUser(db, authUser.uid);
      const platformKey = process.env.GEMINI_API_KEY ?? '';
      const ocrKey = await resolveResearchOcrKey(db, authUser.uid, platformKey);
      const rawCost =
        ocrKey.billingMode === 'byok'
          ? RESEARCH_BYOK_ORCHESTRATION_RAW * pageCount
          : researchOcrRawCost(pageCount);

      const budget = await requireResearchLabBudget(db, authUser.uid, rawCost, 'research_lab_ocr');
      if (!budget.ok) return res.status(402).json(budget);

      const text = await runOcrOnImages(images, format, ocrKey.apiKey);
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        rawCost,
        'research_lab_ocr',
        `Research Lab OCR (${pageCount} pages, ${ocrKey.billingMode})`,
      );
      if (!charge.ok) return res.status(402).json(charge);

      return res.json({ text, chargedUsd: charge.chargedUsd, billingMode: ocrKey.billingMode });
    } catch (error) {
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
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const { routing } = req.body || {};
      const rawCost = scrapeRawCost(routing);
      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(db, authUser.uid, rawCost, 'research_lab_scrape');
      if (!budget.ok) return res.status(402).json(budget);

      const result = await scanPage(req.body || {});
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        `Research Lab scan (${routing?.mode || 'browser'})`,
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ ...result, chargedUsd: charge.chargedUsd });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Scan failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/crawl', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const { routing, maxPages } = req.body || {};
      const pages = Math.max(1, Math.min(Number(maxPages) || 6, 30));
      const rawCost = scrapeRawCost(routing) * pages;
      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(db, authUser.uid, rawCost, 'research_lab_scrape');
      if (!budget.ok) return res.status(402).json(budget);

      const result = await crawlSite(req.body || {});
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        `Research Lab crawl (${pages} pages max)`,
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ ...result, chargedUsd: charge.chargedUsd });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Crawl failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/download', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const rawCost = scrapeRawCost(req.body?.routing) * 0.25;
      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(db, authUser.uid, rawCost, 'research_lab_scrape');
      if (!budget.ok) return res.status(402).json(budget);

      const asset = await downloadAsset(req.body || {});
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        rawCost,
        'research_lab_scrape',
        'Research Lab asset download',
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ ...asset, chargedUsd: charge.chargedUsd });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Download failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/ocr', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const { urls, routing, format } = req.body || {};
      const pageCount = Array.isArray(urls) ? urls.length : 1;
      const platformKey = process.env.GEMINI_API_KEY ?? '';
      const ocrKey = await resolveResearchOcrKey(db, authUser.uid, platformKey);
      const rawCost =
        ocrKey.billingMode === 'byok'
          ? RESEARCH_BYOK_ORCHESTRATION_RAW * pageCount
          : researchOcrRawCost(pageCount) + scrapeRawCost(routing);

      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(db, authUser.uid, rawCost, 'research_lab_ocr');
      if (!budget.ok) return res.status(402).json(budget);

      const { images, fetched, failed } = await fetchImagesForOcr(req.body || {});
      if (!images.length) {
        return res.status(400).json({ error: 'Could not fetch any images for OCR.', failed });
      }
      const text = await runOcrOnImages(images, format, ocrKey.apiKey);
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        rawCost,
        'research_lab_ocr',
        `Research Lab Fable OCR (${images.length} images)`,
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ text, fetched, failed, chargedUsd: charge.chargedUsd });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'OCR failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/ai-harvest', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      const body = req.body || {};
      const rawCost = harvestRawCost(body.keys, body.roles, usesPlatformRouting(body.routing));
      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(db, authUser.uid, rawCost, 'research_lab_ai_harvest');
      if (!budget.ok) return res.status(402).json(budget);

      const result = await aiHarvest(body);
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        rawCost,
        'research_lab_ai_harvest',
        'Research Lab AI harvest',
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ ...result, chargedUsd: charge.chargedUsd });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'AI harvest failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/translate', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(
        db,
        authUser.uid,
        RESEARCH_TRANSLATE_RAW,
        'research_lab_translate',
      );
      if (!budget.ok) return res.status(402).json(budget);

      const result = await translateText(req.body || {});
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        RESEARCH_TRANSLATE_RAW,
        'research_lab_translate',
        'Research Lab translation',
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ ...result, chargedUsd: charge.chargedUsd });
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Translation failed.' });
    }
  });

  app.post('/api/research-lab/fable-scrape/publish', json2mb, async (req, res) => {
    try {
      const authUser = await requireResearchLabUser(req, res);
      if (!authUser) return;
      await ensureHiveUser(db, authUser.uid);
      const budget = await requireResearchLabBudget(
        db,
        authUser.uid,
        RESEARCH_PUBLISH_RAW,
        'research_lab_publish',
      );
      if (!budget.ok) return res.status(402).json(budget);

      const payload = {
        ...req.body,
        contributor: authUser.email || authUser.uid,
      };
      const result = await publishFindings(db, payload);
      const charge = await chargeResearchLabUsage(
        db,
        authUser.uid,
        RESEARCH_PUBLISH_RAW,
        'research_lab_publish',
        `Published ${result.published} finding(s)`,
      );
      if (!charge.ok) return res.status(402).json(charge);
      return res.json({ ...result, chargedUsd: charge.chargedUsd });
    } catch (error) {
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
      return res.status(500).json({ error: error.message || 'Library failed.' });
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
