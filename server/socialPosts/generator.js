import { GoogleGenerativeAI } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';
import { BRAND, IMAGE_MODELS, PLATFORM_SPECS } from './brand.js';
import { loadKnowledge } from './loadConfig.js';
import { pickTopicForDate, todayDateKey } from './topics.js';
import {
  acquireGenerationLock,
  getConfig,
  getPostByDate,
  savePost,
  uploadSocialImage,
} from './store.js';
import { notifyPostReady } from './notify.js';
import { resolveGenerationProvider } from './userProfile.js';
import {
  grokResearchArticle,
  grokWriteCaptions,
  grokGeneratePlatformImage,
} from './grokProvider.js';

function getTextModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function getImageModels(config) {
  const primary = config?.imageModel || process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const fallbacks = IMAGE_MODELS.filter((m) => m !== primary);
  return [primary, ...fallbacks];
}

function getGenAI(apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured.');
  return new GoogleGenerativeAI(key);
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

function logStep(workflowLog, entry) {
  const idx = workflowLog.findIndex((s) => s.step === entry.step);
  const row = { at: new Date().toISOString(), ...entry };
  if (idx >= 0) workflowLog[idx] = { ...workflowLog[idx], ...row };
  else workflowLog.push(row);
  return workflowLog;
}

async function persistProgress(dateKey, patch) {
  await savePost(dateKey, { ...patch, updatedAt: Timestamp.now() });
}

async function validateArticleUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
      headers: { 'User-Agent': 'AiBhive-AutoPoster/1.0' },
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

async function researchArticle(topic, textModel, apiKey) {
  const genAI = getGenAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: textModel,
    tools: [{ googleSearch: {} }],
  });

  const prompt = `You are a content researcher for ${BRAND.name} (${BRAND.siteUrl}), an AI automation company.

TOPIC: ${topic.title}
ANGLE: ${topic.angle}
SITE: ${topic.siteLink}

Search the web for ONE recent, credible, newsworthy article (published within the last 21 days if possible) related to this topic — AI automation, business operations, app development, or enterprise technology.

Return ONLY valid JSON:
{
  "title": "exact article headline",
  "url": "https://full-url-to-article",
  "source": "publication name",
  "publishedAt": "YYYY-MM-DD",
  "summary": "2-3 sentence summary",
  "whyRelevant": "1 sentence for business owners considering AI automation"
}

Rules:
- Must be a real URL from a credible source
- Do NOT invent articles or URLs
- Prefer practical business and technology sources`;

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.();
  if (!text) throw new Error('Empty research response from Gemini.');

  const article = extractJson(text);
  const urlOk = await validateArticleUrl(article.url);
  if (!urlOk) {
    throw new Error(`Article URL could not be verified: ${article.url}`);
  }
  return { article, raw: text };
}

async function writeCaptions(topic, article, knowledge, textModel, apiKey) {
  const genAI = getGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: textModel });

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
  "instagram": { "caption": "${PLATFORM_SPECS.instagram.captionGuide}", "hashtags": ["#AI", "#automation", "..."] },
  "x": { "caption": "${PLATFORM_SPECS.x.captionGuide}" },
  "imagePrompt": "Short headline text for overlay + visual scene description. ${BRAND.imageStyle}"
}`;

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.();
  if (!text) throw new Error('Empty caption response from Gemini.');
  return { captions: extractJson(text), raw: text };
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

async function generateImage(prompt, aspectHint, imageModels, apiKey) {
  const genAI = getGenAI(apiKey);
  let lastError;

  for (const modelName of imageModels) {
    try {
      return { buffer: await generateImageWithModel(genAI, modelName, prompt, aspectHint), model: modelName };
    } catch (e) {
      lastError = e;
      console.warn(`[socialPostGenerator] image model ${modelName} failed:`, e.message);
    }
  }

  throw lastError || new Error('All image models failed.');
}

async function generatePlatformImage(dateKey, key, imagePrompt, aspectHint, imageModels, apiKey) {
  try {
    const { buffer, model } = await generateImage(imagePrompt, aspectHint, imageModels, apiKey);
    const url = await uploadSocialImage(dateKey, key, buffer);
    return { url, model, error: null };
  } catch (e) {
    const { buffer, model } = await generateImage(
      `${imagePrompt}. Simpler composition, bold typography, minimal elements.`,
      aspectHint,
      imageModels,
      apiKey,
    );
    const url = await uploadSocialImage(dateKey, key, buffer);
    return { url, model, error: e.message };
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

export async function generateDailySocialPost(options = {}) {
  const date = options.date || new Date();
  const dateKey = todayDateKey(date);
  const config = await getConfig();
  const workflowLog = [];

  let provider = 'gemini';
  let textModel = config.textModel || getTextModel();
  let imageModels = getImageModels(config);
  let apiKey = process.env.GEMINI_API_KEY;

  if (options.userProfile) {
    const resolved = resolveGenerationProvider(options.userProfile);
    provider = resolved.provider;
    apiKey = resolved.credentials.apiKey;
    textModel = resolved.credentials.textModel;
    if (provider === 'grok') {
      imageModels = [resolved.credentials.imageModel];
    } else {
      imageModels = [resolved.credentials.imageModel, ...IMAGE_MODELS.filter((m) => m !== resolved.credentials.imageModel)];
    }
  }

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

  logStep(workflowLog, {
    step: 'topic',
    label: 'Pick topic',
    status: 'done',
    output: topic,
  });

  logStep(workflowLog, {
    step: 'provider',
    label: 'AI provider',
    status: 'done',
    output: { provider, textModel, imageModel: imageModels[0] },
  });

  await persistProgress(dateKey, {
    status: 'generating',
    workflowLog,
    provider,
    modelsUsed: { provider, text: textModel, image: imageModels[0] },
  });

  try {
    let article;
    let researchRaw = '';
    logStep(workflowLog, {
      step: 'research',
      label: provider === 'grok' ? 'Grok — research article' : 'Gemini — research news',
      status: 'running',
      model: textModel,
    });
    await persistProgress(dateKey, { workflowLog });

    try {
      const researched = provider === 'grok'
        ? await grokResearchArticle(topic, BRAND, textModel, apiKey)
        : await researchArticle(topic, textModel, apiKey);
      article = researched.article;
      researchRaw = researched.raw;
      logStep(workflowLog, {
        step: 'research',
        status: 'done',
        raw: researchRaw,
        output: article,
      });
    } catch (e) {
      console.error('[socialPostGenerator] research failed', e);
      article = {
        title: `${topic.title} trends in AI automation`,
        url: topic.siteLink,
        source: BRAND.name,
        publishedAt: dateKey,
        summary: topic.angle,
        whyRelevant: 'Industry commentary on practical AI automation for businesses.',
      };
      researchRaw = e.message;
      logStep(workflowLog, {
        step: 'research',
        status: 'fallback',
        raw: researchRaw,
        output: article,
        error: e.message,
      });
      errors.push(`research: ${e.message}`);
    }
    await persistProgress(dateKey, { workflowLog, sourceArticle: article });

    let captions;
    let captionsRaw = '';
    logStep(workflowLog, {
      step: 'captions',
      label: provider === 'grok' ? 'Grok — write captions' : 'Gemini — write captions',
      status: 'running',
      model: textModel,
    });
    await persistProgress(dateKey, { workflowLog });

    const captionResult = provider === 'grok'
      ? await grokWriteCaptions(topic, article, knowledge, BRAND, PLATFORM_SPECS, textModel, apiKey)
      : await writeCaptions(topic, article, knowledge, textModel, apiKey);
    captions = captionResult.captions;
    captionsRaw = captionResult.raw;
    logStep(workflowLog, {
      step: 'captions',
      status: 'done',
      raw: captionsRaw,
      output: captions,
    });
    await persistProgress(dateKey, { workflowLog });

    const imagePrompt = captions.imagePrompt
      || `Professional graphic for ${topic.title}. ${BRAND.imageStyle}`;

    logStep(workflowLog, {
      step: 'images',
      label: provider === 'grok' ? 'Grok — generate images' : 'Gemini — generate images',
      status: 'running',
      model: imageModels[0],
      output: { imagePrompt },
    });
    await persistProgress(dateKey, { workflowLog, imagePrompt });

    const platformKeys = Object.keys(PLATFORM_SPECS);
    const imageResults = await Promise.all(
      platformKeys.map(async (key) => {
        const spec = PLATFORM_SPECS[key];
        try {
          if (provider === 'grok') {
            const result = await grokGeneratePlatformImage(
              apiKey,
              imageModels[0],
              imagePrompt,
              BRAND,
              spec.aspectHint,
            );
            const url = await uploadSocialImage(dateKey, key, result.buffer);
            return { key, url, model: result.model, error: null };
          }
          const result = await generatePlatformImage(
            dateKey,
            key,
            imagePrompt,
            spec.aspectHint,
            imageModels,
            apiKey,
          );
          return { key, url: result.url, model: result.model, error: result.error };
        } catch (e) {
          return { key, url: null, model: null, error: e.message };
        }
      }),
    );

    const images = {};
    for (const { key, url, model, error } of imageResults) {
      images[key] = url;
      if (error) errors.push(`image_${key}: ${error}`);
    }

    logStep(workflowLog, {
      step: 'images',
      status: imageResults.every((r) => r.url) ? 'done' : 'partial',
      output: imageResults,
    });

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
      workflowLog,
      provider,
      modelsUsed: {
        provider,
        text: textModel,
        image: imageResults.find((r) => r.model)?.model || imageModels[0],
      },
      status: 'pending_review',
      generatedBy: options.generatedBy || 'scheduler',
      createdAt: Timestamp.now(),
      errors: errors.length ? errors : null,
      adminBaseUrl: config.adminBaseUrl,
      generationStartedAt: null,
    };

    logStep(workflowLog, {
      step: 'review',
      label: 'Ready for review',
      status: 'done',
      output: { status: 'pending_review' },
    });

    const saved = await savePost(dateKey, post);

    if (!options.skipNotify) {
      await sendNotification(saved, config);
    }

    return { post: saved, skipped: false };
  } catch (e) {
    console.error('[socialPostGenerator] fatal', e);
    logStep(workflowLog, {
      step: 'error',
      label: 'Generation failed',
      status: 'failed',
      raw: e.message,
    });
    await savePost(dateKey, {
      status: 'failed',
      errors: [e.message],
      workflowLog,
      generationStartedAt: null,
      failedAt: Timestamp.now(),
    });
    throw e;
  }
}

export async function resendPostNotification(postId) {
  const post = await getPostByDate(postId);
  if (!post) throw new Error('Post not found.');
  const config = await getConfig();
  await sendNotification(post, config);
  return getPostByDate(postId);
}

export async function runScheduledSocialPost() {
  console.log('[autoposter-scheduler] Starting daily generation');
  const result = await generateDailySocialPost({ generatedBy: 'scheduler' });
  if (result.skipped) {
    console.log('[autoposter-scheduler] Skipped:', result.reason);
  } else {
    console.log('[autoposter-scheduler] Generated post for', result.post?.date);
  }
  return result;
}
