/** Sends hiring alerts to codykayak@gmail.com from the applicant's browser (FormSubmit). */
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

async function sendViaFormSubmit(input: ClientJobNotifyInput): Promise<void> {
  const to = (input.notifyEmail || DEFAULT_NOTIFY).trim().toLowerCase();
  const summary = buildSummary(input);
  const form = new FormData();
  form.append('_subject', `[${EMPLOYEE_APP_LABEL}] ${input.name} — ${input.productLine}`);
  form.append('_captcha', 'false');
  form.append('_template', 'table');
  form.append('_autoresponse', 'no');
  form.append('name', input.name);
  form.append('email', input.email);
  form.append('phone', input.phone);
  form.append('products', input.productLine);
  form.append('message', summary);
  form.append('attachment', input.resume, input.resume.name);

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Referer: 'https://aibhive.com/jobs',
      Origin: 'https://aibhive.com',
    },
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
  if (!res.ok) {
    throw new Error(data.message || `FormSubmit HTTP ${res.status}`);
  }
  if (data.success !== true && data.success !== 'true') {
    const msg = data.message || JSON.stringify(data);
    if (/activation/i.test(msg)) {
      throw new Error(
        'FormSubmit needs activation — check codykayak@gmail.com for an “Activate Form” link from FormSubmit, then submit again.'
      );
    }
    throw new Error(msg || 'FormSubmit rejected the request.');
  }
}

/** Optional backup when VITE_WEB3FORMS_ACCESS_KEY is set at build time. */
async function sendViaWeb3Forms(input: ClientJobNotifyInput, accessKey: string): Promise<void> {
  const summary = buildSummary(input);
  const form = new FormData();
  form.append('access_key', accessKey);
  form.append('subject', `[${EMPLOYEE_APP_LABEL}] ${input.name} — ${input.productLine}`);
  form.append('from_name', 'AiBhive Jobs');
  form.append('email', input.email);
  form.append('name', input.name);
  form.append('phone', input.phone);
  form.append('message', summary);
  form.append('attachment', input.resume, input.resume.name);

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!res.ok || !data.success) {
    throw new Error('Web3Forms backup failed.');
  }
}

/**
 * Email Cody on every application. Runs in the browser so it works even when Cloud Run has no SMTP secrets.
 */
export async function notifyJobApplicationFromBrowser(input: ClientJobNotifyInput): Promise<void> {
  const web3Key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
  const errors: string[] = [];

  try {
    await sendViaFormSubmit(input);
    return;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  if (web3Key) {
    try {
      await sendViaWeb3Forms(input, web3Key);
      return;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(errors.join(' | ') || 'Could not send notification email.');
}
