import { generateDailySocialPost } from './socialPostGenerator.js';

/**
 * Daily social post generation — invoked by pmSocialPostScheduler in index.js.
 */
export async function runScheduledSocialPost() {
  console.log('[pmSocialPostScheduler] Starting daily generation');
  const result = await generateDailySocialPost({ generatedBy: 'scheduler' });
  if (result.skipped) {
    console.log('[pmSocialPostScheduler] Skipped:', result.reason);
  } else {
    console.log('[pmSocialPostScheduler] Generated post for', result.post?.date);
  }
  return result;
}
