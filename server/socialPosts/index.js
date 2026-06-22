import { initSocialPostStore } from './store.js';

export { handleSocialPostsRequest } from './handler.js';
export { runScheduledSocialPost } from './generator.js';

export function initSocialPostsService({ db, bucket }) {
  initSocialPostStore({ db, bucket });
  console.log('[startup] AutoPoster service initialized (Cloud Run + GEMINI_API_KEY)');
}
