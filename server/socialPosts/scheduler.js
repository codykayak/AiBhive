import { generateDailySocialPost } from './generator.js';
import { listCompanies } from './companies.js';
import { getPostByDate } from './store.js';
import { todayDateKey } from './topics.js';

const CHECK_MS = 15 * 60 * 1000;
const lastRunByCompany = new Map();
let running = false;

function pacificHourAndMinute() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return { hour, minute };
}

async function tick() {
  if (running) return;
  const { hour, minute } = pacificHourAndMinute();
  if (minute > 14) return;

  const companies = (await listCompanies()).filter((c) => c.autoGenerateEnabled);
  const due = companies.filter((c) => (c.scheduleHour ?? 7) === hour);
  if (!due.length) return;

  const today = todayDateKey();
  running = true;
  try {
    for (const company of due) {
      if (lastRunByCompany.get(company.id) === today) continue;

      const existing = await getPostByDate(company.id, today);
      if (existing?.status === 'generating') continue;
      if (existing?.facebook?.caption && !['failed', 'rejected'].includes(existing.status)) {
        lastRunByCompany.set(company.id, today);
        continue;
      }

      console.log('[autoposter-scheduler] Running daily job for', company.id, today);
      await generateDailySocialPost({
        companyId: company.id,
        company,
        generatedBy: 'scheduler',
      });
      lastRunByCompany.set(company.id, today);
    }
  } catch (e) {
    console.error('[autoposter-scheduler] failed:', e);
  } finally {
    running = false;
  }
}

/** In-process scheduler — runs when Cloud Run instance is alive at each company's schedule hour (PT). */
export function startAutoposterScheduler() {
  if (process.env.DISABLE_AUTOPOSTER_SCHEDULER === 'true') {
    console.log('[autoposter-scheduler] Disabled via DISABLE_AUTOPOSTER_SCHEDULER');
    return;
  }
  console.log('[autoposter-scheduler] Started (checks every 15 min, per-company schedule PT)');
  setInterval(() => {
    tick().catch((e) => console.error('[autoposter-scheduler] tick error:', e));
  }, CHECK_MS);
  tick().catch((e) => console.error('[autoposter-scheduler] initial tick error:', e));
}
