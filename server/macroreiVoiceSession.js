/**
 * MacroREI Grok Voice — browser test calls + PSTN via xAI Voice Agent Builder.
 * Configure MACROREI_GROK_AGENT_ID and attach that agent to your inbound number in xAI.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { normalizePhone } from './leadAgent/smsProvider.js';
import { defaultWorkspaceUid } from './leadAgent/workspaceAccess.js';
import {
  MACROREI_DEFAULT_GREETING,
  MACROREI_VOICE_SESSION_DEFAULTS,
  MACROREI_VOICE_TOOLS,
  buildMacroreiSessionConfig,
  buildMacroreiVoiceInstructions,
  buildWorkModeGuide,
  resolveMacroreiAgentId,
  resolveMacroreiGrokApiKey,
  resolveMacroreiGrokVoicePhone,
  resolveMacroreiMarketingPhone,
} from './macroreiVoiceInstructions.js';

const XAI_CLIENT_SECRETS = 'https://api.x.ai/v1/realtime/client_secrets';
const TOKEN_TTL_SECONDS = 1800;

function extractToken(data) {
  if (!data || typeof data !== 'object') return { value: '', expiresAt: 0 };
  const value =
    data.value ||
    data.client_secret?.value ||
    data.client_secret ||
    data.secret ||
    '';
  const expiresAt = Number(data.expires_at || data.client_secret?.expires_at || 0);
  return { value: String(value), expiresAt };
}

async function mintClientSecret(apiKey, sessionConfig, model, agentId) {
  const bodies = agentId
    ? [{ expires_after: { seconds: TOKEN_TTL_SECONDS }, agent_id: agentId }, { expires_after: { seconds: TOKEN_TTL_SECONDS } }]
    : [
        { expires_after: { seconds: TOKEN_TTL_SECONDS }, model, session: sessionConfig },
        { expires_after: { seconds: TOKEN_TTL_SECONDS } },
      ];

  let lastErr;
  for (const body of bodies) {
    const res = await fetch(XAI_CLIENT_SECRETS, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const token = extractToken(data);
      if (token.value) return token;
      lastErr = new Error('xAI returned an empty voice token.');
      continue;
    }
    lastErr = new Error(data?.error?.message || data?.message || `xAI token error (${res.status})`);
    lastErr.status = res.status;
    if (res.status !== 400 && res.status !== 422) throw lastErr;
  }
  throw lastErr || new Error('Could not mint a Grok voice token.');
}

function realtimeUrl(agentId, model) {
  if (agentId) return `wss://api.x.ai/v1/realtime?agent_id=${encodeURIComponent(agentId)}`;
  return `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(model)}`;
}

export function registerMacroreiVoiceRoutes(app, db) {
  app.get('/api/macrorei/voice/contact', (_req, res) => {
    const marketing = resolveMacroreiMarketingPhone();
    const grok = resolveMacroreiGrokVoicePhone();
    const agentId = resolveMacroreiAgentId();
    res.json({
      marketingPhoneDisplay: marketing.display,
      marketingPhoneE164: marketing.e164,
      grokVoiceDisplay: grok.display,
      grokVoiceE164: grok.e164,
      tel: `tel:${grok.e164}`,
      agentId: agentId || null,
      greeting: MACROREI_DEFAULT_GREETING,
      workMode: buildWorkModeGuide(),
    });
  });

  app.get('/api/macrorei/voice/work-mode', (_req, res) => {
    res.json(buildWorkModeGuide());
  });

  app.post('/api/macrorei/voice/session', async (req, res) => {
    try {
      const apiKey = resolveMacroreiGrokApiKey();
      if (!apiKey) {
        return res.status(503).json({ error: 'XAI_API_KEY is not configured on the server.', code: 'no_key' });
      }

      const grok = resolveMacroreiGrokVoicePhone();
      const agentId = resolveMacroreiAgentId();
      const session = buildMacroreiSessionConfig({ phoneDisplay: grok.display });
      const model = MACROREI_VOICE_SESSION_DEFAULTS.model;
      const token = await mintClientSecret(apiKey, session, model, agentId);

      return res.json({
        value: token.value,
        expires_at: token.expiresAt,
        model,
        agentId: agentId || null,
        voice: MACROREI_VOICE_SESSION_DEFAULTS.voice,
        greeting: MACROREI_DEFAULT_GREETING,
        sampleRate: MACROREI_VOICE_SESSION_DEFAULTS.sampleRate,
        instructions: session.instructions,
        tools: MACROREI_VOICE_TOOLS,
        realtimeUrl: realtimeUrl(agentId, model),
        grokVoiceDisplay: grok.display,
        grokVoiceE164: grok.e164,
        workMode: buildWorkModeGuide(),
      });
    } catch (err) {
      console.error('[macrorei/voice/session]', err);
      const status = err.status && err.status < 500 ? err.status : 502;
      return res.status(status).json({ error: err.message || 'Could not start MacroREI Grok voice session.' });
    }
  });

  /** Tool handler — log seller interest to Lead Agent workspace */
  app.post('/api/macrorei/voice/log-interest', async (req, res) => {
    const body = req.body || {};
    console.info('[macrorei/voice/log-interest]', body);
    let leadId = null;
    if (db) {
      try {
        const uid = defaultWorkspaceUid();
        const businessId = 'macrorei';
        const phone = normalizePhone(body.phone || body.callbackPhone || '');
        const leadsCol = db
          .collection('lead_agent_workspaces')
          .doc(uid)
          .collection('businesses')
          .doc(businessId)
          .collection('leads');
        if (phone) {
          const q = await leadsCol.where('phone', '==', phone).limit(1).get();
          if (!q.empty) leadId = q.docs[0].id;
        }
        if (!leadId) {
          leadId = db.collection('_').doc().id;
          await leadsCol.doc(leadId).set({
            phone: phone || '',
            name: String(body.name || '').slice(0, 200),
            propertyAddress: String(body.address || '').slice(0, 500),
            status: 'callback',
            needsHuman: true,
            grokVoiceInterest: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          await leadsCol.doc(leadId).set(
            {
              status: 'callback',
              needsHuman: true,
              grokVoiceInterest: true,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
        await leadsCol
          .doc(leadId)
          .collection('messages')
          .add({
            direction: 'inbound',
            channel: 'voice',
            body: String(body.summary || 'Grok voice — seller interest').slice(0, 500),
            at: FieldValue.serverTimestamp(),
            via: 'grok-voice-log-interest',
          });
      } catch (e) {
        console.error('[macrorei/voice/log-interest] firestore', e);
      }
    }
    res.json({
      ok: true,
      logged: true,
      leadId,
      message: 'Seller interest recorded — team will follow up.',
    });
  });
}

export { buildMacroreiVoiceInstructions, MACROREI_DEFAULT_GREETING, buildWorkModeGuide };
