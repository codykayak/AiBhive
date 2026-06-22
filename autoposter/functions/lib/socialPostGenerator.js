import { GoogleGenerativeAI } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';
import { BRAND, IMAGE_MODELS, PLATFORM_SPECS } from './socialPostBrand.js';
import { loadKnowledge } from './loadConfig.js';
import { pickTopicForDate, todayDateKey } from './socialPostTopics.js';
import {
  acquireGenerationLock,
  getConfig,
  getPostByDate,
  savePost,
  uploadSocialImage,
} from './socialPostStore.js';
import { notifyPostReady } from './socialPostNotify.js';

const TEXT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  return new GoogleGenerativeAI(apiKey);
}

function extractJson(text) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }
  return JSON.parse(candidate);
}

async function validateArticleUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
      headers: { 'User-Agent': 'ManyDoorsAI-SocialBot/1.0' },
    });
    return res.ok || res.status === 403;
  } catch {
    return false;
  }
}

function trimXCaption(caption, link) {
  const max = PLATFORM_SPECS.x.charLimit;
  let text = String(caption || '').trim();
  if (text.length <= max) return text;
  const suffix = link && !text.includes(link) ? ` ${link}` : '';
  const budget = max - suffix.length - 1;
  return `${text.slice(0, Math.max(0, budget)).trim()}…${suffix}`.trim();
}

async function researchArticle(topic) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: TEXT_MODEL,
    tools: [{ googleSearch: {} }],
  });

  const prompt = `You are a content researcher for ${BRAND.name}, a multifamily property management software company.

TOPIC: ${topic.title}
ANGLE: ${topic.angle}
SITE: ${topic.siteLink}

Search the web for ONE recent, credible, newsworthy article (published within the last 21 days if possible) related to this topic in multifamily real estate, property management, or PropTech.

Return ONLY valid JSON:
{
  "title": "exact article headline",
  "url": "https://full-url-to-article",
  "source": "publication name",
  "publishedAt": "YYYY-MM-DD",
  "summary": "2-3 sentence summary",
  "whyRelevant": "1 sentence for property managers"
}

Rules:
- Must be a real URL from a credible source
- Do NOT invent articles or URLs
- Prefer multifamily, apartment, property management sources`;

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.();
  if (!text) throw new Error('Empty research response from Gemini.');

  const article = extractJson(text);
  const urlOk = await validateArticleUrl(article.url);
  if (!urlOk) {
    throw new Error(`Article URL could not be verified: ${article.url}`);
  }
  return article;
}

async function writeCaptions(topic, article, knowledge) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

  const prompt = `You are the social media manager for ${BRAND.name} (${BRAND.siteUrl}).

BRAND VOICE: ${BRAND.voice}

SITE KNOWLEDGE:
${knowledge.slice(0, 6000)}

TODAY'S TOPIC: ${topic.title} — ${topic.angle}
SITE LINK: ${topic.siteLink}

NEWS TO COMMENT ON (do not copy — write original commentary):
Title: ${article.title}
Source: ${article.source}
URL: ${article.url}
Summary: ${article.summary}

Return ONLY valid JSON:
{
  "facebook": { "caption": "${PLATFORM_SPECS.facebook.captionGuide}" },
  "instagram": { "caption": "${PLATFORM_SPECS.instagram.captionGuide}", "hashtags": ["#propertymanagement", "#multifamily", "..."] },
  "x": { "caption": "${PLATFORM_SPECS.x.captionGuide}" },
  "imagePrompt": "Short headline text for overlay + visual scene description. ${BRAND.imageStyle}"
}`;

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.();
  if (!text) throw new Error('Empty caption response from Gemini.');
  return extractJson(text);
}

async function generateImageWithModel(genAI, modelName, prompt, aspectHint) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const fullPrompt = `${prompt}

${BRAND.imageStyle}
Aspect ratio: ${aspectHint}.
Include a short, readable text headline related to the topic.
Professional social media marketing graphic for ${BRAND.name}.`;

  const result = await model.generateContent(fullPrompt);
  const parts = result?.response?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }
  throw new Error(`No image from ${modelName}`);
}

async function generateImage(prompt, aspectHint) {
  const genAI = getGenAI();
  let lastError;

  for (const modelName of IMAGE_MODELS) {
    try {
      return await generateImageWithModel(genAI, modelName, prompt, aspectHint);
    } catch (e) {
      lastError = e;
      console.warn(`[socialPostGenerator] image model ${modelName} failed:`, e.message);
    }
  }

  throw lastError || new Error('All image models failed.');
}

async function generatePlatformImage(dateKey, key, imagePrompt, aspectHint) {
  try {
    const buffer = await generateImage(imagePrompt, aspectHint);
    return await uploadSocialImage(dateKey, key, buffer);
  } catch (e) {
    const buffer = await generateImage(
      `${imagePrompt}. Simpler composition, bold typography, minimal elements.`,
      aspectHint,
    );
    return await uploadSocialImage(dateKey, key, buffer);
  }
}

async function sendNotification(saved, config) {
  if (!config.notifyEnabled || !config.notifyPhone) return;

  try {
    const notifyResult = await notifyPostReady(
      { ...saved, adminBaseUrl: config.adminBaseUrl },
      config.notifyPhone,
    );
    if (notifyResult.sent) {
      await savePost(saved.id || saved.date, { notifiedAt: Timestamp.now(), notifyError: null });
    }
  } catch (e) {
    console.error('[socialPostGenerator] SMS notify failed', e);
    await savePost(saved.id || saved.date, { notifyError: e.message });
  }
}

/**
 * @param {{ force?: boolean, date?: Date, generatedBy?: string, skipNotify?: boolean }} options
 */
export async function generateDailySocialPost(options = {}) {
  const date = options.date || new Date();
  const dateKey = todayDateKey(date);
  const config = await getConfig();

  if (!options.force) {
    const existing = await getPostByDate(dateKey);
    if (existing?.status === 'generating') {
      return { post: existing, skipped: true, reason: 'in_progress' };
    }
    if (
      existing
      && !['failed', 'rejected'].includes(existing.status)
      && existing.facebook?.caption
    ) {
      return { post: existing, skipped: true, reason: 'already_exists' };
    }
  }

  const lock = await acquireGenerationLock(dateKey);
  if (!lock.acquired && !options.force) {
    return { post: lock.post, skipped: true, reason: lock.reason };
  }

  const topic = pickTopicForDate(date);
  const knowledge = loadKnowledge();
  const errors = [];

  try {
    let article;
    try {
      article = await researchArticle(topic);
    } catch (e) {
      console.error('[socialPostGenerator] research failed', e);
      article = {
        title: `${topic.title} trends in multifamily operations`,
        url: topic.siteLink,
        source: BRAND.name,
        publishedAt: dateKey,
        summary: topic.angle,
        whyRelevant: 'Industry commentary on property operations efficiency.',
      };
      errors.push(`research: ${e.message}`);
    }

    const captions = await writeCaptions(topic, article, knowledge);
    const imagePrompt = captions.imagePrompt
      || `Professional graphic for ${topic.title}. ${BRAND.imageStyle}`;

    const platformKeys = Object.keys(PLATFORM_SPECS);
    const imageResults = await Promise.all(
      platformKeys.map(async (key) => {
        const spec = PLATFORM_SPECS[key];
        try {
          const url = await generatePlatformImage(dateKey, key, imagePrompt, spec.aspectHint);
          return { key, url, error: null };
        } catch (e) {
          return { key, url: null, error: e.message };
        }
      }),
    );

    const images = {};
    for (const { key, url, error } of imageResults) {
      images[key] = url;
      if (error) errors.push(`image_${key}: ${error}`);
    }

    const xCaption = trimXCaption(captions.x?.caption || '', topic.siteLink);

    const post = {
      date: dateKey,
      topic: {
        slug: topic.slug,
        title: topic.title,
        angle: topic.angle,
        siteLink: topic.siteLink,
      },
      sourceArticle: article,
      facebook: {
        caption: captions.facebook?.caption || '',
        imageUrl: images.facebook,
        link: topic.siteLink,
      },
      instagram: {
        caption: captions.instagram?.caption || '',
        hashtags: captions.instagram?.hashtags || [],
        imageUrl: images.instagram,
        link: topic.siteLink,
      },
      x: {
        caption: xCaption,
        imageUrl: images.x,
        link: topic.siteLink,
      },
      imagePrompt,
      status: 'pending_review',
      generatedBy: options.generatedBy || 'scheduler',
      createdAt: Timestamp.now(),
      errors: errors.length ? errors : null,
      adminBaseUrl: config.adminBaseUrl,
      generationStartedAt: null,
    };

    const saved = await savePost(dateKey, post);

    if (!options.skipNotify) {
      await sendNotification(saved, config);
    }

    return { post: saved, skipped: false };
  } catch (e) {
    console.error('[socialPostGenerator] fatal', e);
    await savePost(dateKey, {
      status: 'failed',
      errors: [e.message],
      generationStartedAt: null,
      failedAt: Timestamp.now(),
    });
    throw e;
  }
}

/** Resend SMS for an existing post bundle. */
export async function resendPostNotification(postId) {
  const post = await getPostByDate(postId);
  if (!post) throw new Error('Post not found.');
  const config = await getConfig();
  await sendNotification(post, config);
  return getPostByDate(postId);
}
