import { loadTopics } from './loadConfig.js';

/** Pick topic for a given date — rotates deterministically. */
export function pickTopicForDate(date = new Date()) {
  const topics = loadTopics();
  if (!topics.length) {
    return {
      slug: 'default',
      title: 'Industry update',
      angle: 'relevant news for your audience',
      siteLink: process.env.SOCIAL_SITE_URL || 'https://example.com',
    };
  }
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );
  return topics[dayOfYear % topics.length];
}

export function todayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
