/**
 * Social Post Hunter — find posts + reply copy + image prompts (web community app).
 *
 * Discovery is search-metadata only (no Reddit login, no page scraping).
 * Users open threads manually and paste edited replies themselves.
 */
import { GoogleGenAI } from '@google/genai';
import * as hiveUsage from './hiveUsage.js';
import { firecrawlWebSearch } from './intelFirecrawl.js';
import { requireFirecrawlKey } from './intelCloudKeys.js';

const MODEL = process.env.SOCIAL_HUNTER_MODEL || 'gemini-2.5-flash';
const RAW_COST = 0.018;

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function topicsList(criteria) {
  return String(criteria.topics || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Search-only queries — no scrapeOptions (safer for Reddit and platform ToS). */
function buildSearchQueries(criteria) {
  const topics = topicsList(criteria);
  const base = topics.length ? topics.join(' OR ') : 'real estate investing';
  const days = criteria.dateRangeDays || 14;
  const platforms = criteria.platforms?.length ? criteria.platforms : ['LinkedIn', 'Reddit', 'X'];
  const queries = [];

  for (const platform of platforms) {
    const p = String(platform).toLowerCase();
    if (p.includes('reddit')) {
      queries.push(`site:reddit.com ${base} discussion comment thread`);
      queries.push(`site:reddit.com/r/ ${base} last ${days} days`);
    } else if (p.includes('linkedin')) {
      queries.push(`site:linkedin.com/posts ${base} discussion`);
    } else if (p === 'x' || p.includes('twitter')) {
      queries.push(`site:twitter.com OR site:x.com ${base} post`);
    } else if (p.includes('facebook')) {
      queries.push(`site:facebook.com ${base} post discussion`);
    } else {
      queries.push(`${platform} ${base} post discussion last ${days} days`);
    }
  }

  return [...new Set(queries)].slice(0, 4);
}

async function safeDiscoverySearch(criteria) {
  const apiKey = requireFirecrawlKey();
  if (!apiKey) return '';

  const queries = buildSearchQueries(criteria);
  const blocks = [];

  for (const query of queries) {
    try {
      const result = await firecrawlWebSearch(apiKey, query, { limit: 8, timeout: 35000 });
      if (result.data?.trim()) blocks.push(`QUERY: ${query}\n${result.data}`);
    } catch (err) {
      console.warn('[social-hunter] search skipped:', query, err.message || err);
    }
  }

  return blocks.join('\n\n---\n\n').slice(0, 22000);
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

const REDDIT_REPLY_RULES = `
REDDIT-SPECIFIC (critical — avoid spam/shadowban flags):
- suggestedReply must reference something specific from the post snippet (quote or paraphrase).
- 2-3 short sentences max; conversational, imperfect human tone; no marketing speak.
- NO links, NO "DM me", NO identical CTAs across posts, NO emoji spam.
- engagementTip must say: edit before posting, wait 10+ min between comments, max ~5/day on newer accounts.
`;

const GENERAL_REPLY_RULES = `
- suggestedReply is a DRAFT — user will edit before posting.
- Vary sentence structure across posts; never reuse the same opening line.
- Be helpful first; soft expertise, not salesy.
`;

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

  const searchBlob = (await safeDiscoverySearch(criteria)) || '';
  const hasReddit = (criteria.platforms || []).some((p) => String(p).toLowerCase().includes('reddit'));

  if (!searchBlob.trim()) {
    return {
      ok: true,
      posts: demoPosts(criteria),
      demo: true,
      note: 'Live search unavailable — sample posts. Add FIRECRAWL_API_KEY for real results.',
    };
  }

  const prompt = `You are a social media engagement assistant. Parse SEARCH SNIPPETS (metadata only — not full page scrapes) and return EXACTLY 10 relevant posts/discussions as JSON array.

Criteria:
- Topics: ${criteria.topics || 'any'}
- Date range: last ${criteria.dateRangeDays || 14} days
- Platforms: ${criteria.platforms?.join(', ') || 'LinkedIn, Reddit, X'}
- Audience: ${criteria.audience || 'professionals'}
- Tone: ${criteria.tone || 'helpful and authentic'}
- Brand voice: ${criteria.brandVoice || 'friendly expert'}

${GENERAL_REPLY_RULES}
${hasReddit ? REDDIT_REPLY_RULES : ''}

For each post:
{
  "platform": "LinkedIn"|"Reddit"|"X"|"Facebook"|"Other",
  "title": string,
  "url": string (must be a real URL from search results when available),
  "author": string,
  "date": "YYYY-MM-DD",
  "snippet": string (1-2 sentences),
  "suggestedReply": string (draft only — 2-4 sentences),
  "imagePrompt": string (detailed prompt for AI image generator for a companion post graphic),
  "engagementTip": string (short tip)
}

Return ONLY JSON array.

SEARCH SNIPPETS:
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

  await hiveUsage.recordTokenUsage(db, userId, {
    rawCostUsd: RAW_COST,
    feature: 'social_hunter',
    summary: 'Social Post Hunter search',
  });

  return {
    ok: true,
    posts,
    demo: false,
    safeDiscovery: true,
    note: hasReddit
      ? 'Reddit-safe mode: search snippets only. Edit every reply before posting — never paste AI drafts verbatim.'
      : undefined,
  };
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

  let searchBlob = topicStr;
  const apiKey = requireFirecrawlKey();
  if (apiKey) {
    try {
      const result = await firecrawlWebSearch(apiKey, `${topicStr} trends news last 7 days`, {
        limit: 8,
        timeout: 35000,
      });
      searchBlob = result.data || topicStr;
    } catch {
      searchBlob = topicStr;
    }
  }

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

  await hiveUsage.recordTokenUsage(db, userId, {
    rawCostUsd: 0.01,
    feature: 'social_research',
    summary: 'Social topic research',
  });
  return { ok: true, brief: response.text || 'No brief generated.' };
}
