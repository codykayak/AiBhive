/**
 * AiBhive Diagnose Web — consumer Grok proxy billed via Hive credits.
 * Pack library runs client-side; live AI requires sign-in + credit balance.
 */
import express from 'express';
import { verifyHiveAuth } from './hiveAuth.js';
import { ensureHiveUser, getHiveAccount, createCreditsCheckout } from './hiveBilling.js';
import * as hiveUsage from './hiveUsage.js';
import { markCostForUser } from './hiveUsage.js';

const CHAT_RAW_COST = Number(process.env.DIAGNOSE_WEB_CHAT_RAW_COST ?? 0.01);
const VISION_RAW_COST = Number(process.env.DIAGNOSE_WEB_VISION_RAW_COST ?? 0.022);
const FEATURE_ID = 'diagnose_web_grok';

export function resolveDiagnoseWebHiveUserId(firebaseUid) {
  return `web_${firebaseUid}`;
}

function platformGrokKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

/**
 * @param {import('express').Express} app
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {{ stripe?: import('stripe').default }} deps
 */
export function registerDiagnoseWebRoutes(app, db, deps = {}) {
  const { stripe } = deps;

  app.get('/api/diagnose-web/account', async (req, res) => {
    try {
      const authUser = await verifyHiveAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Sign in required', code: 'auth_required' });
      }
      const hiveUserId = resolveDiagnoseWebHiveUserId(authUser.uid);
      await ensureHiveUser(db, hiveUserId);
      await db.collection('hive_users').doc(hiveUserId).set(
        {
          email: authUser.email || null,
          firebaseUid: authUser.uid,
          product: 'diagnose_web',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      const account = await getHiveAccount(db, hiveUserId);
      return res.json({
        hiveUserId,
        account,
        welcomeCreditUsd: Number(process.env.HIVE_WEB_WELCOME_CREDIT_USD ?? 2),
      });
    } catch (err) {
      console.error('[diagnose-web/account]', err);
      return res.status(500).json({ error: err.message || 'Could not load account' });
    }
  });

  app.post('/api/diagnose-web/checkout', express.json(), async (req, res) => {
    try {
      const authUser = await verifyHiveAuth(req);
      if (!authUser) return res.status(401).json({ error: 'Sign in required' });
      if (!stripe) return res.status(503).json({ error: 'Payments not configured' });

      const hiveUserId = resolveDiagnoseWebHiveUserId(authUser.uid);
      await ensureHiveUser(db, hiveUserId);
      const { amountUsd = 10, successUrl, cancelUrl } = req.body || {};
      const session = await createCreditsCheckout(stripe, {
        userId: hiveUserId,
        amountUsd,
        taskId: 'diagnose-web',
        successUrl: successUrl || `${req.protocol}://${req.get('host')}/diagnose/app/account?credits=added`,
        cancelUrl: cancelUrl || `${req.protocol}://${req.get('host')}/diagnose/app/account`,
      });
      return res.json({ checkoutUrl: session.url });
    } catch (err) {
      console.error('[diagnose-web/checkout]', err);
      return res.status(500).json({ error: err.message || 'Checkout failed' });
    }
  });

  app.post('/api/diagnose-web/chat', express.json({ limit: '8mb' }), async (req, res) => {
    try {
      const authUser = await verifyHiveAuth(req);
      if (!authUser) {
        return res.status(401).json({
          error: 'Sign in to use live Grok diagnosis',
          code: 'auth_required',
        });
      }

      const apiKey = platformGrokKey();
      if (!apiKey) {
        return res.status(503).json({
          error: 'Live AI is temporarily unavailable',
          code: 'no_key',
        });
      }

      const hiveUserId = resolveDiagnoseWebHiveUserId(authUser.uid);
      await ensureHiveUser(db, hiveUserId);

      const {
        systemPrompt = '',
        localContext = '',
        userText = '',
        messages = [],
        attachment = null,
        packId = 'property',
      } = req.body || {};

      const hasImage = Boolean(attachment?.base64);
      const rawCost = hasImage ? VISION_RAW_COST : CHAT_RAW_COST;
      const { markedUsd: markedEstimate } = await markCostForUser(db, hiveUserId, rawCost);

      const budget = await hiveUsage.checkTokenBudget(db, hiveUserId, markedEstimate, FEATURE_ID, {
        email: authUser.email,
      });
      if (!budget.ok) {
        return res.status(402).json({
          ok: false,
          needPayment: true,
          code: 'credits_depleted',
          error: 'Hive credits depleted — add credits or join a Pros company for unlimited team AI.',
          amountUsd: budget.amountUsd ?? markedEstimate,
          budget: budget.budget,
          suggestedPlan: budget.suggestedPlan ?? 'starter',
        });
      }

      const { getCachedGrokChatModel, getCachedGrokVisionModel } = await import('./grokModelResolver.js');
      const { buildGrokUserContent } = await import('./prosGrokMessage.js');
      const { grokChatMessages } = await import('./socialPosts/grokProvider.js');

      const model = hasImage
        ? process.env.GROK_DIAGNOSE_VISION_MODEL || getCachedGrokVisionModel()
        : process.env.GROK_DIAGNOSE_MODEL || process.env.GROK_CHAT_MODEL || getCachedGrokChatModel();

      const history = (Array.isArray(messages) ? messages : [])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

      const system = [
        String(systemPrompt || '').slice(0, 4500),
        localContext
          ? `\nLocal library context (use only if it matches the user's equipment):\n${String(localContext).slice(0, 2500)}`
          : '',
        `\nActive packId: ${packId}. Stay on-topic for that trade pack.`,
        '\nCRITICAL: Answer for the equipment the user named only. Prefer matching local library context. If off-topic, ignore library context. Give practical field steps with safety first.',
      ].join('');

      const userContent = buildGrokUserContent(userText, attachment);

      const reply = await grokChatMessages(
        apiKey,
        model,
        [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: userContent },
        ],
        { temperature: 0.25, max_tokens: 3500 }
      );

      const usage = await hiveUsage.recordTokenUsage(db, hiveUserId, {
        rawCostUsd: rawCost,
        feature: FEATURE_ID,
        summary: `Diagnose Web Grok (${packId}${hasImage ? ', vision' : ''})`,
        email: authUser.email,
      });

      if (!usage.ok) {
        const status = usage.needUpgrade ? 402 : 500;
        return res.status(status).json({
          ok: false,
          needPayment: !!usage.needUpgrade,
          code: usage.needUpgrade ? 'credits_depleted' : 'billing_failed',
          error: usage.needUpgrade
            ? 'Hive credits depleted'
            : usage.error || 'Could not record usage',
          budget: usage.budget,
        });
      }

      const account = await getHiveAccount(db, hiveUserId);

      return res.json({
        ok: true,
        reply,
        source: 'grok',
        provider: 'grok',
        model,
        chargedUsd: usage.chargedUsd ?? markedEstimate,
        budget: usage.budget,
        account: {
          creditBalanceUsd: account.creditBalanceUsd,
          usage: account.usage,
        },
      });
    } catch (err) {
      console.error('[diagnose-web/chat]', err);
      return res.status(500).json({
        error: err?.message || 'Diagnose AI failed',
        code: 'diagnose_failed',
      });
    }
  });
}
