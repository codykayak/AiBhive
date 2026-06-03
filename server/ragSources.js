import { GoogleGenAI, createPartFromUri, createUserContent } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

const COLLECTION = 'rag_sources';
const MAX_PREVIEW_CHARS = 8000;
const MAX_WEBSITE_FETCH_CHARS = 12000;

const DEFAULT_SOURCES = [
  {
    title: 'Oregon Real Estate Law (ORS 696)',
    type: 'website',
    url: 'https://www.oregonlegislature.gov/bills_laws/ors/ors696.html',
    categories: ['legal'],
    builtin: true,
    description: 'Reference for Oregon real estate statutes and agency rules.',
  },
  {
    title: 'Medical Nomenclature (SNOMED CT overview)',
    type: 'website',
    url: 'https://www.nlm.nih.gov/healthit/snomedct/index.html',
    categories: ['medical'],
    builtin: true,
    description: 'NLM overview of SNOMED CT clinical terminology.',
  },
];

let aiClient;

function getGemini() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) return null;
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidPublicUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.') ||
      host.includes('ngrok')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchWebsitePreview(url) {
  const response = await axios.get(url, {
    timeout: 20000,
    maxContentLength: 5 * 1024 * 1024,
    headers: { 'User-Agent': 'AiBhive-RAG-Bot/1.0' },
    responseType: 'text',
    validateStatus: (s) => s >= 200 && s < 400,
  });
  const contentType = String(response.headers['content-type'] || '');
  let text = typeof response.data === 'string' ? response.data : '';
  if (contentType.includes('html')) {
    text = stripHtml(text);
  }
  return text.slice(0, MAX_WEBSITE_FETCH_CHARS);
}

async function uploadBufferToGemini(buffer, mimeType, displayName) {
  const ai = getGemini();
  if (!ai) throw new Error('GEMINI_API_KEY is not configured.');

  const ext =
    mimeType === 'application/pdf'
      ? '.pdf'
      : mimeType === 'text/plain'
        ? '.txt'
        : '.bin';
  const tmpPath = path.join(os.tmpdir(), `rag-${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  try {
    const uploaded = await ai.files.upload({
      file: tmpPath,
      config: { mimeType, displayName },
    });
    return {
      geminiFileUri: uploaded.uri,
      geminiFileName: uploaded.name,
    };
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

function serializeDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? null,
  };
}

let ragServiceSingleton = null;

export function initRagSourcesService(service) {
  ragServiceSingleton = service;
}

export function getRagSourcesService() {
  return ragServiceSingleton;
}

export function createRagSourcesService({ db, gcsBucket }) {
  const col = () => db.collection(COLLECTION);

  async function ensureSeeded() {
    const snap = await col().limit(1).get();
    if (!snap.empty) return;

    const batch = db.batch();
    for (const seed of DEFAULT_SOURCES) {
      const ref = col().doc();
      batch.set(ref, {
        ...seed,
        active: true,
        previewText: null,
        geminiFileUri: null,
        geminiFileName: null,
        mimeType: null,
        storagePath: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: 'system',
      });
    }
    await batch.commit();
    console.log('[rag] Seeded default RAG sources');
  }

  async function listSources() {
    await ensureSeeded();
    const snap = await col().orderBy('title').get();
    return snap.docs.map(serializeDoc);
  }

  async function getSource(id) {
    const doc = await col().doc(id).get();
    if (!doc.exists) return null;
    return serializeDoc(doc);
  }

  async function addWebsite({ title, url, categories }, createdBy) {
    if (!title?.trim()) throw new Error('Title is required.');
    if (!isValidPublicUrl(url)) throw new Error('A valid public https URL is required.');

    let previewText = null;
    try {
      previewText = await fetchWebsitePreview(url);
    } catch (err) {
      console.warn('[rag] Website preview fetch failed:', err.message);
      previewText = `(Preview unavailable: ${err.message}. Gemini will still use URL context at verification time.)`;
    }

    const ref = col().doc();
    await ref.set({
      title: title.trim(),
      type: 'website',
      url: url.trim(),
      categories: categories?.length ? categories : ['legal', 'medical'],
      active: true,
      builtin: false,
      description: null,
      previewText: previewText?.slice(0, MAX_PREVIEW_CHARS) ?? null,
      geminiFileUri: null,
      geminiFileName: null,
      mimeType: null,
      storagePath: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy,
    });
    return getSource(ref.id);
  }

  async function addDocument({ title, buffer, mimeType, originalFilename, categories }, createdBy) {
    if (!title?.trim()) throw new Error('Title is required.');
    if (!buffer?.length) throw new Error('File is empty.');

    const allowed = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
    ];
    if (!allowed.includes(mimeType)) {
      throw new Error('Supported types: PDF, TXT, MD, CSV, JSON.');
    }

    const safeName = (originalFilename || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    const ref = col().doc();
    const storagePath = `rag-sources/${ref.id}/${safeName}`;

    await gcsBucket.file(storagePath).save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false,
    });

    let geminiFileUri = null;
    let geminiFileName = null;
    try {
      const gemini = await uploadBufferToGemini(buffer, mimeType, title.trim());
      geminiFileUri = gemini.geminiFileUri;
      geminiFileName = gemini.geminiFileName;
    } catch (err) {
      console.error('[rag] Gemini file upload failed:', err);
      throw new Error(`Stored file but Gemini upload failed: ${err.message}`);
    }

    let previewText = null;
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
      previewText = buffer.toString('utf8').slice(0, MAX_PREVIEW_CHARS);
    } else {
      previewText = `PDF document "${safeName}" indexed in Gemini (${buffer.length} bytes). Open via storage URL or re-fetch in pipeline.`;
    }

    await ref.set({
      title: title.trim(),
      type: 'document',
      url: null,
      categories: categories?.length ? categories : ['legal', 'medical'],
      active: true,
      builtin: false,
      description: null,
      previewText,
      geminiFileUri,
      geminiFileName,
      mimeType,
      storagePath,
      originalFilename: safeName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy,
    });

    return getSource(ref.id);
  }

  async function updateSource(id, patch) {
    const ref = col().doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error('Source not found.');

    const allowed = {};
    if (typeof patch.active === 'boolean') allowed.active = patch.active;
    if (patch.title?.trim()) allowed.title = patch.title.trim();
    if (Array.isArray(patch.categories) && patch.categories.length) {
      allowed.categories = patch.categories;
    }
    allowed.updatedAt = FieldValue.serverTimestamp();

    await ref.update(allowed);
    return getSource(id);
  }

  async function deleteSource(id) {
    const ref = col().doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error('Source not found.');
    const data = doc.data();

    if (data.storagePath) {
      try {
        await gcsBucket.file(data.storagePath).delete({ ignoreNotFound: true });
      } catch (err) {
        console.warn('[rag] GCS delete failed:', err.message);
      }
    }

    if (data.geminiFileName) {
      const ai = getGemini();
      if (ai) {
        try {
          await ai.files.delete({ name: data.geminiFileName });
        } catch (err) {
          console.warn('[rag] Gemini file delete failed:', err.message);
        }
      }
    }

    await ref.delete();
    return { success: true };
  }

  async function getSignedStorageUrl(storagePath) {
    const [url] = await gcsBucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });
    return url;
  }

  async function getSourceView(id) {
    const source = await getSource(id);
    if (!source) throw new Error('Source not found.');

    let downloadUrl = null;
    if (source.storagePath) {
      try {
        downloadUrl = await getSignedStorageUrl(source.storagePath);
      } catch (err) {
        console.warn('[rag] Signed URL failed:', err.message);
      }
    }

    return {
      source,
      previewText: source.previewText,
      downloadUrl,
      externalUrl: source.type === 'website' ? source.url : null,
    };
  }

  async function loadActiveSourcesForPipeline(contextFlags) {
    await ensureSeeded();
    const snap = await col().where('active', '==', true).get();
    const sources = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return sources.filter((s) => {
      if (contextFlags.legal && s.categories?.includes('legal')) return true;
      if (contextFlags.medical && s.categories?.includes('medical')) return true;
      return false;
    });
  }

  return {
    ensureSeeded,
    listSources,
    getSource,
    addWebsite,
    addDocument,
    updateSource,
    deleteSource,
    getSourceView,
    loadActiveSourcesForPipeline,
  };
}

/**
 * Pass 3 verification using configured RAG sources (Gemini files + URL context).
 */
export async function performRagContextAccuracyCheck(
  text,
  contextFlags,
  targetLanguage,
  ragSources
) {
  const contextTypes = [];
  if (contextFlags.legal) contextTypes.push('Legal');
  if (contextFlags.medical) contextTypes.push('Medical');

  if (contextTypes.length === 0) return { checkedText: text, flags: [], citations: [] };

  const ai = getGemini();
  if (!ai) {
    console.warn('[rag] No Gemini client; skipping RAG-grounded Pass 3');
    return performFallbackContextCheck(text, contextTypes, targetLanguage);
  }

  const websites = ragSources.filter((s) => s.type === 'website' && s.url);
  const documents = ragSources.filter((s) => s.type === 'document' && s.geminiFileUri);

  const sourceManifest = ragSources.map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    url: s.url || s.storagePath || null,
  }));

  const urlLines = websites.map((w) => `- ${w.title}: ${w.url}`).join('\n');
  const docLines = documents.map((d) => `- ${d.title}`).join('\n');

  const websiteUrlPrompt = websites.map((w) => w.url).join(' ');

  const promptText = `
You are an expert ${contextTypes.join(' and ')} translator and verifier.
This is Pass 3: RAG Verification. Use the reference sources provided (documents and/or URLs) to verify terminology, statutes, and clinical terms in the translated text.

Reference sources configured for this job:
${sourceManifest.map((s) => `- [${s.type}] ${s.title}${s.url ? ` (${s.url})` : ''}`).join('\n')}

${urlLines ? `Website references (retrieve and use URL context for these pages):\n${urlLines}\n` : ''}
${websiteUrlPrompt ? `\nPublic URLs to retrieve for this verification:\n${websiteUrlPrompt}\n` : ''}
${docLines ? `Uploaded reference documents attached to this request:\n${docLines}\n` : ''}

Review the following text translated into ${targetLanguage}. Cross-check high-risk terms against the references. Flag mistranslations that could cause legal or medical harm.

Return strictly JSON:
{
  "flags": [
    {"term": "...", "warning": "...", "sourceTitle": "which reference informed this flag"}
  ],
  "correctedText": "corrected text if needed, else same as input",
  "citations": [
    {"sourceTitle": "...", "detail": "how this source was used"}
  ]
}

Text to review:
${text}
`;

  const parts = [];
  for (const doc of documents) {
    parts.push(createPartFromUri(doc.geminiFileUri, doc.mimeType || 'application/pdf'));
  }
  parts.push(promptText);

  const tools = [];
  if (websites.length > 0) {
    tools.push({ urlContext: {} });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: createUserContent(parts),
      config: {
        responseMimeType: 'application/json',
        ...(tools.length ? { tools } : {}),
      },
    });

    const result = JSON.parse(response.text);
    const urlMeta = response.candidates?.[0]?.urlContextMetadata;
    const urlCitations =
      urlMeta?.urlMetadata?.map((u) => ({
        sourceTitle: u.retrievedUrl,
        detail: u.urlRetrievalStatus || 'retrieved',
      })) ?? [];

    return {
      checkedText: result.correctedText || text,
      flags: result.flags || [],
      citations: [...(result.citations || []), ...urlCitations],
    };
  } catch (error) {
    console.error('[rag] RAG Pass 3 error:', error);
    return performFallbackContextCheck(text, contextTypes, targetLanguage);
  }
}

async function performFallbackContextCheck(text, contextTypes, targetLanguage) {
  const ai = getGemini();
  if (!ai) return { checkedText: text, flags: [], citations: [] };

  const prompt = `
  You are an expert ${contextTypes.join(' and ')} translator and verifier.
  Review the following text in ${targetLanguage} and flag high-risk terms.
  Return JSON: {"flags":[{"term":"","warning":""}],"correctedText":"..."}
  Text: ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const result = JSON.parse(response.text);
    return { checkedText: result.correctedText || text, flags: result.flags || [], citations: [] };
  } catch (err) {
    console.error('[rag] Fallback Pass 3 error:', err);
    return { checkedText: text, flags: [], citations: [] };
  }
}
