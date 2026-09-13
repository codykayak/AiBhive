/**
 * Mint ephemeral Grok Voice tokens for AiBhive Pros (browser Call button).
 * xAI API key stays server-side; phone line uses the same agent in Voice Agent Builder.
 */

import {
  PROS_DEFAULT_GREETING,
  PROS_VOICE_SESSION_DEFAULTS,
  PROS_VOICE_TOOLS,
  buildProsSessionConfig,
  buildProsVoiceInstructions,
  resolveProsAgentId,
  resolveProsGrokApiKey,
  resolveProsVoicePhone,
} from './prosVoiceInstructions.js';

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
    ? [
        {
          expires_after: { seconds: TOKEN_TTL_SECONDS },
          agent_id: agentId,
        },
        { expires_after: { seconds: TOKEN_TTL_SECONDS } },
      ]
    : [
        {
          expires_after: { seconds: TOKEN_TTL_SECONDS },
          model,
          session: sessionConfig,
        },
        { expires_after: { seconds: TOKEN_TTL_SECONDS } },
      ];

  let lastErr;
  for (const body of bodies) {
    const res = await fetch(XAI_CLIENT_SECRETS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
    const retryable = res.status === 400 || res.status === 422;
    if (!retryable) throw lastErr;
  }
  throw lastErr || new Error('Could not mint a Grok voice token.');
}

function realtimeUrl(agentId, model) {
  if (agentId) {
    return `wss://api.x.ai/v1/realtime?agent_id=${encodeURIComponent(agentId)}`;
  }
  return `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(model)}`;
}

export function registerProsVoiceRoutes(app) {
  app.get('/api/pros/voice/contact', (_req, res) => {
    const phone = resolveProsVoicePhone();
    const agentId = resolveProsAgentId();
    res.json({
      phoneDisplay: phone.display,
      phoneE164: phone.e164,
      tel: `tel:${phone.e164}`,
      agentId: agentId || null,
      greeting: PROS_DEFAULT_GREETING,
    });
  });

  app.post('/api/pros/voice/session', async (req, res) => {
    try {
      const apiKey = resolveProsGrokApiKey();
      if (!apiKey) {
        return res.status(503).json({
          error: 'XAI_API_KEY is not configured on the server.',
          code: 'no_key',
        });
      }

      const phone = resolveProsVoicePhone();
      const agentId = resolveProsAgentId();
      const session = buildProsSessionConfig({ phoneDisplay: phone.display });
      const model = PROS_VOICE_SESSION_DEFAULTS.model;
      const token = await mintClientSecret(apiKey, session, model, agentId);

      return res.json({
        value: token.value,
        expires_at: token.expiresAt,
        model,
        agentId: agentId || null,
        voice: PROS_VOICE_SESSION_DEFAULTS.voice,
        greeting: PROS_DEFAULT_GREETING,
        sampleRate: PROS_VOICE_SESSION_DEFAULTS.sampleRate,
        instructions: session.instructions,
        tools: PROS_VOICE_TOOLS,
        realtimeUrl: realtimeUrl(agentId, model),
        phoneDisplay: phone.display,
        phoneE164: phone.e164,
      });
    } catch (err) {
      console.error('[pros/voice/session]', err);
      const status = err.status && err.status < 500 ? err.status : 502;
      return res.status(status).json({
        error: err.message || 'Could not start a Grok voice session.',
      });
    }
  });
}

export { buildProsVoiceInstructions, PROS_DEFAULT_GREETING };
