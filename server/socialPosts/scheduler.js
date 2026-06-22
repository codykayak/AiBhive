import { runScheduledSocialPost } from './generator.js';
import { getPostByDate } from './store.js';
import { todayDateKey } from './topics.js';

const CHECK_MS = 15 * 60 * 1000;
let lastRunDate = null;
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
  const scheduleHour = Number(process.env.AUTOPOSTER_SCHEDULE_HOUR || 7);
  if (hour !== scheduleHour || minute > 14) return;

  const today = todayDateKey();
  if (lastRunDate === today) return;

  const existing = await getPostByDate(today);
  if (existing?.status === 'generating') return;
  if (existing?.facebook?.caption && !['failed', 'rejected'].includes(existing.status)) {
    lastRunDate = today;
    return;
  }

  running = true;
  try {
    console.log('[autoposter-scheduler] Running daily job for', today);
    await runScheduledSocialPost();
    lastRunDate = today;
  } catch (e) {
    console.error('[autoposter-scheduler] failed:', e);
  } finally {
    running = false;
  }
}

/** In-process scheduler — runs when Cloud Run instance is alive at 7 AM PT. */
export function startAutoposterScheduler() {
  if (process.env.DISABLE_AUTOPOSTER_SCHEDULER === 'true') {
    console.log('[autoposter-scheduler] Disabled via DISABLE_AUTOPOSTER_SCHEDULER');
    return;
  }
  console.log('[autoposter-scheduler] Started (checks every 15 min, 7 AM Pacific)');
  setInterval(() => {
    tick().catch((e) => console.error('[autoposter-scheduler] tick error:', e));
  }, CHECK_MS);
  tick().catch((e) => console.error('[autoposter-scheduler] initial tick error:', e));
}
