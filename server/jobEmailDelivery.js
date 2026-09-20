const DEFAULT_JOBS_NOTIFY_EMAIL = 'codykayak@gmail.com';
const EMPLOYEE_APP_LABEL = 'employee app';

export function jobsNotifyTo() {
  return (process.env.JOBS_NOTIFY_EMAIL || DEFAULT_JOBS_NOTIFY_EMAIL).trim().toLowerCase();
}

export function smtpConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function buildSummary(payload) {
  const {
    id,
    name,
    email,
    phone,
    productLine,
    callTime,
    callTimeNote,
    timezone,
    aboutYou,
  } = payload;
  return [
    EMPLOYEE_APP_LABEL,
    '',
    `New employee application (${id})`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Products: ${productLine}`,
    `Best call time: ${callTime}${callTimeNote ? ` — ${callTimeNote}` : ''}`,
    `Timezone: ${timezone || '—'}`,
    '',
    'What we should know:',
    aboutYou,
  ].join('\n');
}

async function sendViaSmtp(transporter, payload) {
  if (!smtpConfigured()) {
    throw new Error('SMTP not configured');
  }
  const summary = buildSummary(payload);
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: jobsNotifyTo(),
    replyTo: payload.email,
    subject: `[${EMPLOYEE_APP_LABEL}] ${payload.name} — ${payload.productLine}`,
    text: summary,
    attachments: payload.resumeBuffer
      ? [
          {
            filename: payload.resumeName,
            content: payload.resumeBuffer,
            contentType: payload.resumeContentType || 'application/octet-stream',
          },
        ]
      : [],
  });
}

async function sendViaResend(payload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const summary = buildSummary(payload);
  const body = {
    from: process.env.RESEND_FROM || 'AiBhive Jobs <onboarding@resend.dev>',
    to: [jobsNotifyTo()],
    reply_to: payload.email,
    subject: `[${EMPLOYEE_APP_LABEL}] ${payload.name} — ${payload.productLine}`,
    text: summary,
  };

  if (payload.resumeBuffer?.length) {
    body.attachments = [
      {
        filename: payload.resumeName || 'resume.pdf',
        content: Buffer.from(payload.resumeBuffer).toString('base64'),
      },
    ];
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${errText.slice(0, 200)}`);
  }
}

/** No API keys — forwards to inbox via FormSubmit (may require one-time inbox activation). */
async function sendViaFormSubmit(payload) {
  const summary = buildSummary(payload);
  const form = new FormData();
  form.append('_subject', `[${EMPLOYEE_APP_LABEL}] ${payload.name} — ${payload.productLine}`);
  form.append('_captcha', 'false');
  form.append('_template', 'table');
  form.append('name', payload.name);
  form.append('email', payload.email);
  form.append('phone', payload.phone);
  form.append('products', payload.productLine);
  form.append('message', summary);

  if (payload.resumeBuffer?.length) {
    const blob = new Blob([payload.resumeBuffer], {
      type: payload.resumeContentType || 'application/octet-stream',
    });
    form.append('attachment', blob, payload.resumeName || 'resume.pdf');
  }

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(jobsNotifyTo())}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Referer: 'https://aibhive.com/jobs',
      Origin: 'https://aibhive.com',
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`FormSubmit HTTP ${res.status}`);
  }
  if (data.success !== true && data.success !== 'true') {
    throw new Error(`FormSubmit rejected: ${JSON.stringify(data).slice(0, 200)}`);
  }
}

/**
 * Try every configured channel until one succeeds.
 * FormSubmit is last-resort when Cloud Run has no SMTP secrets.
 */
export async function deliverJobApplicationEmail(transporter, payload) {
  const attempts = [];
  if (smtpConfigured()) attempts.push(['smtp', () => sendViaSmtp(transporter, payload)]);
  if (process.env.RESEND_API_KEY?.trim()) {
    attempts.push(['resend', () => sendViaResend(payload)]);
  }
  // FormSubmit rejects Cloud Run / datacenter requests — browser fallback in JobApplicationForm.
  if (process.env.JOB_EMAIL_ALLOW_FORMSUBMIT_SERVER === '1') {
    attempts.push(['formsubmit', () => sendViaFormSubmit(payload)]);
  }

  const errors = [];
  for (const [name, fn] of attempts) {
    try {
      await fn();
      console.log(`[job-application] Email delivered via ${name} to`, jobsNotifyTo(), payload.id);
      return { channel: name };
    } catch (err) {
      const msg = err?.message || String(err);
      console.error(`[job-application] ${name} failed:`, msg);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(errors.join(' | ') || 'No email delivery methods available');
}
