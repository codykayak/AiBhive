import { getOrCreateWebHiveUserId } from './hiveWebUser';

export type SocialHunterCriteria = {
  topics: string;
  dateRangeDays: number;
  platforms: string[];
  audience: string;
  tone: string;
  brandVoice: string;
  minEngagement: string;
};

export type SocialPostResult = {
  id: string;
  platform: string;
  title: string;
  url: string;
  author: string;
  date: string;
  snippet: string;
  suggestedReply: string;
  imagePrompt: string;
  engagementTip: string;
};

export type ImageApiSettings = {
  provider: 'gemini' | 'openai' | 'none';
  apiKey: string;
  model: string;
};

const CRITERIA_KEY = 'aibhive_social_hunter_criteria';
const IMAGE_KEY = 'aibhive_social_hunter_image_api';

export function loadSocialCriteria(): Partial<SocialHunterCriteria> {
  try {
    const raw = localStorage.getItem(CRITERIA_KEY);
    if (raw) return JSON.parse(raw) as Partial<SocialHunterCriteria>;
  } catch {
    // ignore
  }
  return {};
}

export function saveSocialCriteria(c: SocialHunterCriteria) {
  localStorage.setItem(CRITERIA_KEY, JSON.stringify(c));
}

export function loadImageApiSettings(): ImageApiSettings {
  try {
    const raw = localStorage.getItem(IMAGE_KEY);
    if (raw) return JSON.parse(raw) as ImageApiSettings;
  } catch {
    // ignore
  }
  return { provider: 'none', apiKey: '', model: 'gemini-2.5-flash-image' };
}

export function saveImageApiSettings(s: ImageApiSettings) {
  localStorage.setItem(IMAGE_KEY, JSON.stringify(s));
}

export async function searchSocialPosts(criteria: SocialHunterCriteria) {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/hive/social-hunter/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, criteria }),
  });
  const data = await res.json();
  if (res.status === 402) {
    return { ok: false as const, needPayment: true, amountUsd: data.amountUsd ?? 0.05, error: data.error };
  }
  if (!res.ok || !data.ok) {
    return { ok: false as const, error: data.error || 'Post search failed.' };
  }
  return data as {
    ok: true;
    posts: SocialPostResult[];
    demo?: boolean;
    note?: string;
  };
}

export async function researchTopics(topics: string) {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/hive/social-hunter/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, topics }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    return { ok: false as const, error: data.error || 'Research failed.' };
  }
  return { ok: true as const, brief: data.brief as string };
}
