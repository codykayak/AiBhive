import { defaultWorkspaceUid } from './leadAgent/workspaceAccess.js';
import { leadAgentVoiceWebhookPath } from './leadAgent/inboundVoice.js';
import { twilioApiKeySid, twilioApiSecret } from './twilioEnv.js';

export function twilioEnvStatus() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = Boolean(process.env.TWILIO_AUTH_TOKEN);
  const from = process.env.TWILIO_FROM_NUMBER || '';
  const apiKey = Boolean(twilioApiKeySid());
  const apiSecret = Boolean(twilioApiSecret());
  const twimlAppSid = Boolean(process.env.TWILIO_TWIML_APP_SID);
  const smsReady = Boolean(accountSid && authToken && from);
  const voiceReady = Boolean(accountSid && apiKey && apiSecret && twimlAppSid && from);
  return {
    smsReady,
    voiceReady,
    accountSidSet: Boolean(accountSid),
    authTokenSet: authToken,
    fromNumber: from ? from.replace(/(\d{4})$/, '****') : '',
    fromNumberConfigured: Boolean(from),
    apiKeySet: apiKey,
    apiSecretSet: apiSecret,
    twimlAppSidSet: twimlAppSid,
  };
}

export function twilioSetupGuide(origin = 'https://aibhive.com', businessId = 'macrorei') {
  const uid = defaultWorkspaceUid();
  const base = origin.replace(/\/$/, '');
  return {
    envVars: [
      { key: 'TWILIO_ACCOUNT_SID', required: 'SMS + voice', where: 'Twilio Console → Account Info' },
      { key: 'TWILIO_AUTH_TOKEN', required: 'SMS + webhooks', where: 'Twilio Console → Account Info (rotate if leaked)' },
      { key: 'TWILIO_FROM_NUMBER', required: 'SMS + outbound caller ID', where: 'E.164 e.g. +15413212630' },
      { key: 'TWILIO_sk_key', required: 'Browser dialer only', where: 'Console → API keys & tokens (SK… SID)' },
      { key: 'TWILIO_API_SECRET', required: 'Browser dialer only', where: 'Shown once when API key is created' },
      { key: 'TWILIO_TWIML_APP_SID', required: 'Browser dialer only', where: 'TwiML App voice URL → POST {origin}/api/employee-portal/voice/twiml' },
      { key: 'LEAD_AGENT_OWNER_UID', required: 'Webhooks', where: 'Firebase uid for lead_agent_workspaces (optional if default)' },
    ],
    twilioConsole: [
      'Phone Numbers → your number → Messaging: webhook POST → SMS URL below',
      'Phone Numbers → your number → Voice: webhook POST → Return-call voice URL below',
      'Optional TwiML App for laptop dialer: Voice Request URL → POST /api/employee-portal/voice/twiml',
    ],
    webhooks: {
      smsInbound: `${base}/api/lead-agent/twilio/inbound?businessId=${encodeURIComponent(businessId)}&uid=${encodeURIComponent(uid)}`,
      voiceReturnCalls: `${base}${leadAgentVoiceWebhookPath(businessId, uid)}`,
      employeeBrowserDialTwiml: `${base}/api/employee-portal/voice/twiml`,
    },
    localDev: 'Put the three SMS vars in repo-root .env.local, restart node on :3001, open /employee → Lines & Grok voice.',
    production: 'Same variable names on Cloud Run service aibhive (us-west1) → Edit & deploy new revision.',
  };
}

export function registerTwilioStatusRoutes(app) {
  app.get('/api/twilio/status', (req, res) => {
    const origin = process.env.PUBLIC_API_ORIGIN || `${req.protocol}://${req.get('host')}`;
    const businessId = String(req.query.businessId || 'macrorei');
    res.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      ...twilioEnvStatus(),
      guide: twilioSetupGuide(origin, businessId),
    });
  });
}
