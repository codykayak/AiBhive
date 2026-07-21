import { initSocialPostStore } from './store.js';
import { initSocialUserProfiles } from './userProfile.js';
import { initSocialCompanies } from './companies.js';

export { handleSocialPostsRequest } from './handler.js';
export { runScheduledSocialPost } from './generator.js';

export function initSocialPostsService({ db, bucket }) {
  initSocialPostStore({ db, bucket });
  initSocialUserProfiles(db);
  initSocialCompanies(db);
  console.log('[startup] AutoPoster service initialized (Cloud Run + GEMINI_API_KEY)');
}
