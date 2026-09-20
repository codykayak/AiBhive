/** Browser-only FormSubmit — Cloud Run cannot use FormSubmit server-side. */
const DEFAULT_NOTIFY = 'codykayak@gmail.com';
const EMPLOYEE_APP_LABEL = 'employee app';

export type ClientJobNotifyInput = {
  id: string;
  name: string;
  email: string;
  phone: string;
  productLine: string;
  callTime: string;
  callTimeNote: string;
  timezone: string;
  aboutYou: string;
  resume: File;
  notifyEmail?: string;
};

function buildSummary(input: ClientJobNotifyInput) {
  return [
    EMPLOYEE_APP_LABEL,
    '',
    `New employee application (${input.id})`,
    '',
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Products: ${input.productLine}`,
    `Best call time: ${input.callTime}${input.callTimeNote ? ` — ${input.callTimeNote}` : ''}`,
    `Timezone: ${input.timezone || '—'}`,
    '',
    'What we should know:',
    input.aboutYou,
  ].join('\n');
}

export async function notifyJobApplicationFromBrowser(input: ClientJobNotifyInput): Promise<void> {
  const to = (input.notifyEmail || DEFAULT_NOTIFY).trim().toLowerCase();
  const summary = buildSummary(input);
  const form = new FormData();
  form.append('_subject', `[${EMPLOYEE_APP_LABEL}] ${input.name} — ${input.productLine}`);
  form.append('_captcha', 'false');
  form.append('_template', 'table');
  form.append('name', input.name);
  form.append('email', input.email);
  form.append('phone', input.phone);
  form.append('products', input.productLine);
  form.append('message', summary);
  form.append('attachment', input.resume, input.resume.name);

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.success !== true && data.success !== 'true')) {
    throw new Error('Could not send notification email from browser.');
  }
}
