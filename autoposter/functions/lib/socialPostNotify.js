import { loadBrand } from './loadConfig.js';

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(phone || '').startsWith('+')) return phone;
  return `+${digits}`;
}

export async function sendTwilioSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[socialPostNotify] Twilio not configured — skipping SMS');
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
  return { sent: true, sid: data.sid };
}

export async function notifyPostReady(post, phone) {
  const brand = loadBrand();
  const topic = post.topic?.title || 'Social post';
  const date = post.date || new Date().toISOString().slice(0, 10);
  const adminUrl = post.adminBaseUrl || brand.adminBaseUrl;

  const body = [
    `${brand.name} — ${date} posts ready`,
    topic,
    '',
    adminUrl,
    '',
    'FB · IG · X ready to review',
  ].join('\n');

  return sendTwilioSms(phone, body);
}

export async function sendTestSms(phone) {
  const brand = loadBrand();
  const body = [
    `${brand.name} social factory — test OK`,
    'You will get a text like this when daily posts are ready.',
    brand.adminBaseUrl,
  ].join('\n');
  return sendTwilioSms(phone, body);
}
