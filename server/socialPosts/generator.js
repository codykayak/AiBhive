import { GoogleGenerativeAI } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';
import { BRAND, IMAGE_MODELS, PLATFORM_SPECS } from './brand.js';
import {
  companyBrand,
  getCompany,
  getCompanyDayPrompt,
  resolveCompanyProvider,
} from './companies.js';
import { notifyPostReady } from './notify.js';
import {
  acquireGenerationLock,
  getConfig,
  getPostByDate,
  parsePostDocId,
  postDocId,
  savePost,
  uploadSocialImage,
} from './store.js';
import { todayDateKey } from './topics.js';
import {
  grokResearchArticle,
  grokWriteCaptions,
  grokGeneratePlatformImage,
  formatPlatformSpecsForPrompt,
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

async function persistProgress(companyId, dateKey, patch) {
  await savePost(postDocId(companyId, dateKey), { companyId, date: dateKey, ...patch, updatedAt: Timestamp.now() });
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

function extractImageHeadline(captions, platform) {
  if (captions.imageHeadline) return String(captions.imageHeadline).trim().slice(0, 80);
  const caption = captions[platform]?.caption || '';
  const firstLine = caption.split('\n').find((line) => line.trim()) || '';
  if (firstLine) return firstLine.trim().slice(0, 80);
  return String(captions.imagePrompt || 'AI Automation').split('.')[0].slice(0, 80);
}

function buildPlatformImagePrompt(captions, platform, aspectHint, brand) {
  const headline = extractImageHeadline(captions, platform);
  const scene = captions.imageScene || captions.imagePrompt || 'Modern professional marketing visual';
  return `Social media marketing graphic for ${brand.name}.

MANDATORY TEXT ON IMAGE — render this EXACT headline in large, bold, highly readable typography. Spell every word exactly, no paraphrasing:
"${headline}"

Visual scene (support the headline, do not add other headline text):
${scene}

Aspect ratio: ${aspectHint}.
${brand.imageStyle}`;
}

function pickTopicForCompany(company, date = new Date()) {
  const topics = company.topics || [];
  if (!topics.length) {
    return {
      slug: 'default',
      title: `${company.name} update`,
      angle: 'practical insight for your audience',
      siteLink: company.siteUrl,
    };
  }
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );
  return topics[dayOfYear % topics.length];
}

async function researchArticle(topic, textModel, apiKey, brand = BRAND) {
  const genAI = getGenAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: textModel,
    tools: [{ googleSearch: {} }],
  });

  const prompt = `You are a content researcher for ${brand.name} (${brand.siteUrl}).

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

async function writeCaptions(topic, article, knowledge, textModel, apiKey, brand) {
  const genAI = getGenAI(apiKey);
  const model = genAI.getGenerativeModel({ model: textModel });

  const prompt = `You are the social media manager for ${brand.name} (${brand.siteUrl}).

BRAND VOICE: ${brand.voice}

SITE KNOWLEDGE:
${knowledge.slice(0, 6000)}

TODAY'S TOPIC: ${topic.title} — ${topic.angle}
SITE LINK: ${topic.siteLink}

NEWS TO COMMENT ON (do not copy — write original commentary that ties clearly to the topic):
Title: ${article.title}
Source: ${article.source}
URL: ${article.url}
Summary: ${article.summary}

Write cohesive captions where Facebook, Instagram, and X tell the SAME story with platform-appropriate length.
Return ONLY valid JSON:
{
  "facebook": { "caption": "${PLATFORM_SPECS.facebook.captionGuide}" },
  "instagram": { "caption": "${PLATFORM_SPECS.instagram.captionGuide}", "hashtags": ["#tag1", "#tag2"] },
  "x": { "caption": "${PLATFORM_SPECS.x.captionGuide}" },
  "imageHeadline": "5-8 word headline for the image — must match the post theme",
  "imageScene": "Visual scene only — no text in this field",
  "imagePrompt": "same as imageScene"
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

  const result = await model.generateContent(prompt);
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

async function generatePlatformImage(companyId, dateKey, key, captions, aspectHint, imageModels, apiKey, brand) {
  const imagePrompt = buildPlatformImagePrompt(captions, key, aspectHint, brand);
  try {
    const { buffer, model } = await generateImage(imagePrompt, aspectHint, imageModels, apiKey);
    const url = await uploadSocialImage(companyId, dateKey, key, buffer);
    return { url, model, error: null, imagePrompt };
  } catch (e) {
    const fallbackPrompt = `${imagePrompt}\nSimpler composition, bold typography, minimal elements.`;
    const { buffer, model } = await generateImage(
      fallbackPrompt,
      aspectHint,
      imageModels,
      apiKey,
    );
    const url = await uploadSocialImage(companyId, dateKey, key, buffer);
    return { url, model, error: e.message, imagePrompt: fallbackPrompt };
  }
}

async function sendNotification(saved, company, globalConfig) {
  const phone = company.notifyPhone || globalConfig.notifyPhone;
  const notifyEnabled = company.notifyEnabled !== false && globalConfig.notifyEnabled !== false;
  if (!notifyEnabled || !phone) return;

  try {
    const notifyResult = await notifyPostReady(
      {
        ...saved,
        adminBaseUrl: globalConfig.adminBaseUrl,
        companyName: company.name,
      },
      phone,
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
  const globalConfig = await getConfig();
  const workflowLog = [];

  const companyId = options.companyId || 'aibhive';
  const company = options.company || await getCompany(companyId);
  if (!company) throw new Error(`Company not found: ${companyId}`);

  const brand = companyBrand(company);
  const knowledge = company.knowledge || '';
  const docId = postDocId(companyId, dateKey);

  const textResolved = resolveCompanyProvider(company, 'text', dateKey);
  const imageResolved = resolveCompanyProvider(company, 'image', dateKey);
  const textProvider = textResolved.provider;
  const imageProvider = imageResolved.provider;
  const textModel = textResolved.credentials.textModel;
  const textApiKey = textResolved.credentials.apiKey;
  const imageApiKey = imageResolved.credentials.apiKey;
  let imageModels = imageProvider === 'grok'
    ? [imageResolved.credentials.imageModel]
    : [imageResolved.credentials.imageModel, ...IMAGE_MODELS.filter((m) => m !== imageResolved.credentials.imageModel)];

  const dayPrompt = getCompanyDayPrompt(company, dateKey);

  if (!options.force) {
    const existing = await getPostByDate(companyId, dateKey);
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

  const lock = await acquireGenerationLock(companyId, dateKey);
  if (!lock.acquired && !options.force) {
    return { post: lock.post, skipped: true, reason: lock.reason };
  }

  const topic = dayPrompt?.prompt
    ? {
        slug: `scheduled-${dateKey}`,
        title: dayPrompt.prompt.slice(0, 80),
        angle: dayPrompt.prompt,
        siteLink: company.siteUrl,
        customPrompt: dayPrompt.prompt,
      }
    : pickTopicForCompany(company, date);
  const errors = [];

  logStep(workflowLog, {
    step: 'topic',
    label: dayPrompt?.prompt ? 'Scheduled prompt' : 'Pick topic',
    status: 'done',
    output: topic,
  });

  logStep(workflowLog, {
    step: 'provider',
    label: 'AI providers',
    status: 'done',
    output: {
      textProvider,
      imageProvider,
      textModel,
      imageModel: imageModels[0],
      company: company.name,
    },
  });

  await persistProgress(companyId, dateKey, {
    status: 'generating',
    companyId,
    companyName: company.name,
    workflowLog,
    provider: textProvider,
    modelsUsed: {
      textProvider,
      imageProvider,
      text: textModel,
      image: imageModels[0],
    },
  });

  try {
    let article;
    let researchRaw = '';
    logStep(workflowLog, {
      step: 'research',
      label: textProvider === 'grok' ? 'Grok — research article' : 'Gemini — research news',
      status: 'running',
      model: textModel,
    });
    await persistProgress(companyId, dateKey, { workflowLog });

    try {
      const researched = textProvider === 'grok'
        ? await grokResearchArticle(topic, brand, textModel, textApiKey)
        : await researchArticle(topic, textModel, textApiKey, brand);
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
        title: `${topic.title}`,
        url: topic.siteLink,
        source: brand.name,
        publishedAt: dateKey,
        summary: topic.angle,
        whyRelevant: `Timely insight for ${brand.name} audience.`,
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
    await persistProgress(companyId, dateKey, { workflowLog, sourceArticle: article });

    let captions;
    let captionsRaw = '';
    logStep(workflowLog, {
      step: 'captions',
      label: textProvider === 'grok' ? 'Grok — write captions' : 'Gemini — write captions',
      status: 'running',
      model: textModel,
    });
    await persistProgress(companyId, dateKey, { workflowLog });

    const captionResult = textProvider === 'grok'
      ? await grokWriteCaptions(topic, article, knowledge, brand, PLATFORM_SPECS, textModel, textApiKey)
      : await writeCaptions(topic, article, knowledge, textModel, textApiKey, brand);
    captions = captionResult.captions || captionResult;
    captionsRaw = captionResult.raw || '';
    if (!captions?.facebook?.caption) {
      throw new Error('Caption generation returned empty content. Check API keys and models.');
    }
    logStep(workflowLog, {
      step: 'captions',
      status: 'done',
      raw: captionsRaw,
      output: captions,
    });
    await persistProgress(companyId, dateKey, { workflowLog });

    const imageHeadline = extractImageHeadline(captions, 'facebook');
    const imagePrompt = captions.imageScene || captions.imagePrompt
      || `Professional graphic for ${topic.title}. ${brand.imageStyle}`;

    logStep(workflowLog, {
      step: 'images',
      label: imageProvider === 'grok' ? 'Grok — generate images' : 'Gemini — generate images',
      status: 'running',
      model: imageModels[0],
      output: { imageHeadline, imagePrompt },
    });
    await persistProgress(companyId, dateKey, { workflowLog, imagePrompt, imageHeadline });

    const platformKeys = Object.keys(PLATFORM_SPECS);
    const imageResults = await Promise.all(
      platformKeys.map(async (key) => {
        const spec = PLATFORM_SPECS[key];
        try {
          if (imageProvider === 'grok') {
            const platformPrompt = buildPlatformImagePrompt(captions, key, spec.aspectHint, brand);
            const result = await grokGeneratePlatformImage(
              imageApiKey,
              imageModels[0],
              platformPrompt,
              brand,
              spec.aspectHint,
            );
            const url = await uploadSocialImage(companyId, dateKey, key, result.buffer);
            return { key, url, model: result.model, error: null, imagePrompt: platformPrompt };
          }
          const result = await generatePlatformImage(
            companyId,
            dateKey,
            key,
            captions,
            spec.aspectHint,
            imageModels,
            imageApiKey,
            brand,
          );
          return { key, url: result.url, model: result.model, error: result.error, imagePrompt: result.imagePrompt };
        } catch (e) {
          return { key, url: null, model: null, error: e.message };
        }
      }),
    );

    const images = {};
    for (const { key, url, error } of imageResults) {
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
      companyId,
      companyName: company.name,
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
      imageHeadline,
      workflowLog,
      provider: textProvider,
      modelsUsed: {
        textProvider,
        imageProvider,
        text: textModel,
        image: imageResults.find((r) => r.model)?.model || imageModels[0],
      },
      status: 'pending_review',
      generatedBy: options.generatedBy || 'scheduler',
      createdAt: Timestamp.now(),
      errors: errors.length ? errors : null,
      adminBaseUrl: globalConfig.adminBaseUrl,
      generationStartedAt: null,
    };

    logStep(workflowLog, {
      step: 'review',
      label: 'Ready for review',
      status: 'done',
      output: { status: 'pending_review' },
    });

    const saved = await savePost(docId, post);

    if (!options.skipNotify) {
      await sendNotification(saved, company, globalConfig);
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
    await savePost(docId, {
      companyId,
      date: dateKey,
      status: 'failed',
      errors: [e.message],
      workflowLog,
      generationStartedAt: null,
      failedAt: Timestamp.now(),
    });
    throw e;
  }
}

export async function resendPostNotification(postId, companyId = 'aibhive') {
  const { companyId: parsedCompany, dateKey } = parsePostDocId(postId);
  const resolvedCompanyId = companyId || parsedCompany;
  const post = await getPostByDate(resolvedCompanyId, dateKey);
  if (!post) throw new Error('Post not found.');
  const company = await getCompany(post.companyId || resolvedCompanyId);
  const config = await getConfig();
  await sendNotification(post, company, config);
  return getPostByDate(resolvedCompanyId, dateKey);
}

export async function runScheduledSocialPost() {
  const { listCompanies } = await import('./companies.js');
  const companies = await listCompanies();
  const enabled = companies.filter((c) => c.autoGenerateEnabled);
  console.log('[autoposter-scheduler] Running for', enabled.length, 'companies');

  const results = [];
  for (const company of enabled) {
    try {
      const result = await generateDailySocialPost({
        companyId: company.id,
        company,
        generatedBy: 'scheduler',
      });
      results.push({ companyId: company.id, ...result });
      if (result.skipped) {
        console.log(`[autoposter-scheduler] ${company.id} skipped:`, result.reason);
      } else {
        console.log(`[autoposter-scheduler] ${company.id} generated for`, result.post?.date);
      }
    } catch (e) {
      console.error(`[autoposter-scheduler] ${company.id} failed:`, e);
      results.push({ companyId: company.id, error: e.message });
    }
  }
  return results;
}
