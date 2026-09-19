import { sendTwilioSms as sendGlobalTwilioSms } from '../socialPosts/notify.js';

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(phone || '').startsWith('+')) return phone;
  return digits ? `+${digits}` : '';
}

export async function sendSmsViaTwilio({ to, body, twilioSid, twilioToken, twilioFrom }) {
  const sid = twilioSid || process.env.TWILIO_ACCOUNT_SID;
  const token = twilioToken || process.env.TWILIO_AUTH_TOKEN;
  const from = twilioFrom || process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return { sent: false, reason: 'twilio_not_configured' };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: normalizePhone(to), From: from, Body: body }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return { sent: true, provider: 'twilio', sid: data.sid };
}

/** Phone provider: app sends via device; server records intent only. */
export function buildPhoneSendPayload({ to, body }) {
  return {
    sent: false,
    provider: 'phone',
    pendingDeviceSend: true,
    to: normalizePhone(to),
    body,
  };
}

export async function sendLeadSms({ business, to, body }) {
  const provider = business?.smsProvider || 'phone';
  if (provider === 'twilio') {
    return sendSmsViaTwilio({
      to,
      body,
      twilioSid: business?.twilioSid,
      twilioToken: business?.twilioToken,
      twilioFrom: business?.twilioFrom,
    });
  }
  return buildPhoneSendPayload({ to, body });
}

export function isOptOutMessage(text) {
  const t = String(text || '').trim().toUpperCase();
  return ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(t);
}
