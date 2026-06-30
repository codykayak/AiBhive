/**
 * Social Post Hunter — find posts + reply copy + image prompts (web community app).
 */
import { GoogleGenAI } from '@google/genai';
import * as hiveUsage from './hiveUsage.js';

const MODEL = process.env.SOCIAL_HUNTER_MODEL || 'gemini-2.5-flash';
const RAW_COST = 0.018;

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function buildPostQuery(criteria) {
  const topics = String(criteria.topics || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const base = topics.length ? topics.join(' OR ') : 'real estate investing';
  const platforms = criteria.platforms?.length ? criteria.platforms.join(' OR ') : 'LinkedIn OR Reddit OR X';
  const days = criteria.dateRangeDays || 14;
  return `${base} ${platforms} post discussion last ${days} days`;
}

async function firecrawlSearch(query) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 12, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.data)) return null;
    return data.data
      .map((item) => {
        const url = item.url || item.metadata?.url || '';
        const title = item.title || item.metadata?.title || '';
        const text = item.markdown || item.description || '';
        return `TITLE: ${title}\nURL: ${url}\n${String(text).slice(0, 1200)}`;
      })
      .join('\n\n---\n\n')
      .slice(0, 22000);
  } catch {
    return null;
  }
}

function demoPosts(criteria) {
  const topic = String(criteria.topics || 'AI automation').split(',')[0].trim();
  const platforms = ['LinkedIn', 'Reddit', 'X', 'Facebook', 'LinkedIn', 'Reddit', 'X', 'LinkedIn', 'Reddit', 'X'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `demo-post-${i + 1}`,
    platform: platforms[i],
    title: `${topic} — discussion #${i + 1}`,
    url: `https://example.com/post/${i + 1}`,
    author: `user_${i + 1}`,
    date: new Date(Date.now() - i * 43200000).toISOString().slice(0, 10),
    snippet: `Sample post about ${topic}. Great thread for engaging with your audience.`,
    suggestedReply: `[Demo reply — sign in, open the link, paste this]\n\nThanks for sharing! We've been exploring ${topic} too — happy to swap notes if useful.`,
    imagePrompt: `Professional social graphic about ${topic}, modern flat design, amber accent, no text overlay, 1080x1080`,
    engagementTip: 'Reply within 2 hours for best visibility.',
  }));
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runSocialPostSearch(db, userId, criteria) {
  const gemini = getGemini();
  if (!gemini) {
    return { ok: true, posts: demoPosts(criteria), demo: true, note: 'Hive AI offline — sample posts shown.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, RAW_COST * 1.2, 'social_hunter');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.05 };
  }

  const query = buildPostQuery(criteria);
  const searchBlob = (await firecrawlSearch(query)) || '';

  if (!searchBlob.trim()) {
    return {
      ok: true,
      posts: demoPosts(criteria),
      demo: true,
      note: 'Live search unavailable — sample posts. Add FIRECRAWL_API_KEY for real results.',
    };
  }

  const prompt = `You are a social media engagement assistant. Parse search results and return EXACTLY 10 relevant posts/discussions as JSON array.

Criteria:
- Topics: ${criteria.topics || 'any'}
- Date range: last ${criteria.dateRangeDays || 14} days
- Platforms: ${criteria.platforms?.join(', ') || 'LinkedIn, Reddit, X'}
- Audience: ${criteria.audience || 'professionals'}
- Tone: ${criteria.tone || 'helpful and authentic'}
- Brand voice: ${criteria.brandVoice || 'friendly expert'}

For each post:
{
  "platform": "LinkedIn"|"Reddit"|"X"|"Facebook"|"Other",
  "title": string,
  "url": string,
  "author": string,
  "date": "YYYY-MM-DD",
  "snippet": string (1-2 sentences),
  "suggestedReply": string (ready to copy-paste, 2-4 sentences, no hashtags unless X),
  "imagePrompt": string (detailed prompt for AI image generator for a companion post graphic),
  "engagementTip": string (short tip)
}

Return ONLY JSON array.

SEARCH RESULTS:
${searchBlob}`;

  const response = await gemini.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const text = response.text || '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  let posts = [];
  try {
    posts = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return { ok: true, posts: demoPosts(criteria), demo: true, note: 'Parse error — showing samples.' };
  }

  if (!Array.isArray(posts) || !posts.length) {
    return { ok: true, posts: demoPosts(criteria), demo: true };
  }

  posts = posts.slice(0, 10).map((p, i) => ({
    id: `post-${Date.now()}-${i}`,
    platform: String(p.platform || 'Other'),
    title: String(p.title || 'Post'),
    url: String(p.url || '#'),
    author: String(p.author || ''),
    date: String(p.date || ''),
    snippet: String(p.snippet || ''),
    suggestedReply: String(p.suggestedReply || ''),
    imagePrompt: String(p.imagePrompt || ''),
    engagementTip: String(p.engagementTip || ''),
  }));

  await hiveUsage.recordTokenUsage(db, userId, RAW_COST, 'social_hunter');

  return { ok: true, posts, demo: false, query };
}

/**
 * Topic research brief for social tab.
 */
export async function runTopicResearchBrief(db, userId, topics) {
  const gemini = getGemini();
  const topicStr = String(topics || '').trim();
  if (!topicStr) return { ok: false, error: 'Enter topics first.' };
  if (!gemini) return { ok: false, error: 'Hive AI unavailable.' };

  const budget = await hiveUsage.checkTokenBudget(db, userId, 0.01, 'social_research');
  if (!budget.ok) return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.03 };

  const searchBlob = (await firecrawlSearch(`${topicStr} trends news last 7 days`)) || topicStr;

  const response = await gemini.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Summarize trending angles for social content about: ${topicStr}\n\nSources:\n${searchBlob.slice(0, 12000)}\n\nReturn 5 bullet hooks + 3 post ideas. Plain text.`,
          },
        ],
      },
    ],
  });

  await hiveUsage.recordTokenUsage(db, userId, 0.01, 'social_research');
  return { ok: true, brief: response.text || 'No brief generated.' };
}
