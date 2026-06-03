import { GoogleGenAI } from '@google/genai';
import {
  performRagContextAccuracyCheck,
  getRagSourcesService,
} from './ragSources.js';
import { normalizeVerificationModels } from './pipelineSettings.js';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';

// Lazy initialization of AI clients to avoid dotenv load-order issues
let openaiClient;
let aiClient;

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getGemini() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Downloads a file from a given URL to a local temporary path.
 */
async function downloadFile(url, filename) {
  // SSRF Mitigation: Ensure the URL strictly points to Firebase Storage
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'firebasestorage.googleapis.com') {
      throw new Error(`Invalid hostname: ${parsedUrl.hostname}`);
    }
  } catch (err) {
    throw new Error('Invalid file URL format or unauthorized domain.');
  }

  const filepath = path.join(os.tmpdir(), filename);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on('finish', () => resolve(filepath));
    writer.on('error', reject);
  });
}

/**
 * 1. Transcribe & Translate using OpenAI Whisper (or extract text if it's a text file)
 */
export async function transcribeAndTranslate(fileUrl, targetLanguage) {
  console.log(`Starting transcription/translation to ${targetLanguage}...`);

  // Determine if it's a text file based on common extensions in the URL or default to audio
  const isTextFile = fileUrl.includes('.txt') || fileUrl.includes('.csv') || fileUrl.includes('.md');
  const extension = isTextFile ? '.txt' : '.mp3';

  const tempFilePath = await downloadFile(fileUrl, `temp_file_${Date.now()}${extension}`);

  try {
    let originalText = "";
    const openai = getOpenAI();

    if (isTextFile) {
      // If it's a text file, just read it directly
      originalText = fs.readFileSync(tempFilePath, 'utf8');
    } else {
      // If it's audio, send to Whisper API
      // Added response_format and timestamp_granularities to preserve timestamps as requested
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      // Preserve timestamps in the original text representation
      if (transcription.segments && transcription.segments.length > 0) {
        originalText = transcription.segments.map(seg => `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`).join('\n');
      } else {
        originalText = transcription.text;
      }
    }

    // Translate text to target language using Gemini 2.5 Pro (per requirements)
    const ai = getGemini();
    const prompt = `
    You are a professional translator.
    Translate the following text to ${targetLanguage}.
    If there are timestamps (e.g. [0.00s - 5.00s]), preserve them exactly in the translated output.

    Text:
    ${originalText}
    `;

    // Update to Gemini 2.5 Pro per explicit instructions.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt
    });

    const translatedText = response.text;

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    return { originalText, translatedText };
  } catch (error) {
    console.error("Transcription/Translation Error:", error);
    // Cleanup on error
    if (fs.existsSync(tempFilePath)) {
       fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}

const MODEL_LABELS = {
  gemini: 'Google Gemini 2.5 Pro',
  claude: 'Anthropic Claude 3.5 Sonnet',
  grok: 'xAI Grok',
};

function passEntry(id, name, extra = {}) {
  return {
    id,
    name,
    status: 'pending',
    startedAt: new Date().toISOString(),
    ...extra,
  };
}

async function runGeminiTextPrompt(prompt, json = false) {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    ...(json ? { config: { responseMimeType: 'application/json' } } : {}),
  });
  return response.text?.trim() ?? '';
}

/**
 * Pass 2 — run one or more verification models (defaults to Gemini if none configured).
 */
export async function runPass2Verification(text, targetLanguage, verificationModels) {
  const models = normalizeVerificationModels(verificationModels);
  let currentText = text;
  const modelRuns = [];

  for (const model of models) {
    const run = { model, label: MODEL_LABELS[model] || model, status: 'running' };
    const prompt = `
      You are an expert ${targetLanguage} translator and verifier (${MODEL_LABELS[model] || model}).
      Review the following text translated into ${targetLanguage}.
      Fix technical terms, context, and grammar. Return ONLY the corrected plain text — no markdown or JSON.

      Text:
      ${currentText}
    `;

    try {
      if (model === 'gemini') {
        currentText = await runGeminiTextPrompt(prompt);
        run.status = 'completed';
        run.note = 'Primary verification engine';
      } else if (model === 'claude' && process.env.ANTHROPIC_API_KEY) {
        currentText = await runGeminiTextPrompt(
          `${prompt}\n\n(Simulated Claude pass — configure ANTHROPIC_API_KEY for native Claude.)`
        );
        run.status = 'completed';
        run.note = 'Ran via Gemini fallback until native Claude is wired';
      } else if (model === 'grok' && process.env.XAI_API_KEY) {
        currentText = await runGeminiTextPrompt(
          `${prompt}\n\n(Simulated Grok pass — configure XAI_API_KEY for native Grok.)`
        );
        run.status = 'completed';
        run.note = 'Ran via Gemini fallback until native Grok is wired';
      } else {
        currentText = await runGeminiTextPrompt(prompt);
        run.status = 'completed';
        run.note = `No API key for ${model}; used Gemini 2.5 Pro`;
      }
    } catch (err) {
      run.status = 'failed';
      run.error = err.message;
      run.stack = err.stack;
    }
    modelRuns.push(run);
  }

  return { text: currentText, modelRuns, modelsUsed: models };
}

/**
 * Pass 3 only — for admin retry or sandbox.
 */
export async function runPass3RagVerification(text, targetLanguage, contextFlags = { legal: true, medical: true }) {
  const ragService = getRagSourcesService();
  const ragSources = ragService
    ? await ragService.loadActiveSourcesForPipeline(contextFlags)
    : [];

  const checkResult = await performRagContextAccuracyCheck(
    text,
    contextFlags,
    targetLanguage,
    ragSources
  );

  return {
    ...checkResult,
    ragSourceCount: ragSources.length,
    ragSourceTitles: ragSources.map((s) => s.title),
  };
}

/**
 * 2. Scan for Legal/Medical High-Risk Terms using Gemini 1.5 Pro
 */
export async function performContextAccuracyCheck(text, contextFlags, targetLanguage) {
  console.log("Starting Context Accuracy Check with Gemini...");

  const contextTypes = [];
  if (contextFlags.legal) contextTypes.push("Legal");
  if (contextFlags.medical) contextTypes.push("Medical");

  if (contextTypes.length === 0) return { checkedText: text, flags: [] };

  const prompt = `
  You are an expert ${contextTypes.join(' and ')} translator and verifier.
  This is a High Accuracy mode check. Review the following text which has been translated into ${targetLanguage}.
  Scan the text for high-risk terms and verify they are translated correctly and used in the correct context.
  Flag any terms that could flip meaning or cause legal/medical/technical issues if mistranslated.

  Return the output strictly in this JSON format:
  {
    "flags": [
      {"term": "Original Term", "warning": "Explanation of potential mistranslation in ${targetLanguage}"}
    ],
    "correctedText": "If applicable, provide a corrected version of the text that fixes any critical mistranslations."
  }

  Text to review:
  ${text}
  `;

  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    const result = JSON.parse(response.text);
    return { checkedText: result.correctedText || text, flags: result.flags || [] };
  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
}

/**
 * 3. Generate Footer for Legal/Medical contexts
 */
export function generateFooter(flags) {
  let footer = `\n\n---\n*DISCLAIMER: This translation uses multiple LLM models to ensure specific accuracy checks. While better than humans in most cases they are not perfect and content should be reviewed. The following is not certified for court/medical use—and should be reviewed by a professional.*`;

  if (flags && flags.length > 0) {
    footer += `\n\n*Here are the high-risk words and verbiage that we flagged for your review:*`;
    flags.forEach(flag => {
      footer += `\n- **${flag.term}**: ${flag.warning}`;
    });
  }

  footer += `\n\n*Processed on ${new Date().toLocaleDateString()}.*`;
  return footer;
}

/**
 * 4. Voice Cloning using Fish Audio API
 */
export async function cloneVoiceWithFishApi(textToSpeak, voiceSampleUrl, leadId) {
  console.log("Starting Voice Cloning with Fish Audio API...");

  const FISH_API_KEY = process.env.FISH_API_KEY;
  let tempAudioPath = null;
  let modelId = null;

  try {
    // 1. Download the voice sample
    console.log("Downloading voice sample for cloning...");
    const urlParts = new URL(voiceSampleUrl);
    const filename = path.basename(urlParts.pathname);
    tempAudioPath = await downloadFile(voiceSampleUrl, filename);

    // 2. Create the voice model
    console.log("Creating voice model with Fish API...");
    const form = new FormData();
    form.append('type', 'tts');
    form.append('title', `Customer Voice ${leadId}`);
    form.append('train_mode', 'fast');
    form.append('voices.0.items', fs.createReadStream(tempAudioPath));

    const modelResponse = await axios.post('https://api.fish.audio/model', form, {
      headers: {
        'Authorization': `Bearer ${FISH_API_KEY}`,
        ...form.getHeaders()
      }
    });

    modelId = modelResponse.data._id;
    console.log(`Model created successfully with ID: ${modelId}`);

    // 3. Generate Speech
    console.log("Generating cloned speech...");
    const ttsResponse = await axios.post('https://api.fish.audio/tts', {
      model_id: modelId,
      text: textToSpeak
    }, {
      headers: {
        'Authorization': `Bearer ${FISH_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer' // We need to receive the audio binary
    });

    console.log("Speech generation successful.");

    // Clean up downloaded voice sample
    if (fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }

    return {
      audioBuffer: Buffer.from(ttsResponse.data),
      modelId: modelId
    };

  } catch (error) {
    console.error("Fish API Error:", error.response?.data || error.message);
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
    throw error;
  }
}

/**
 * Master Pipeline Function
 */
export async function processLeadJob(leadData, options = {}) {
  const pipelineRun = { passes: [], startedAt: new Date().toISOString() };
  const verificationModels = normalizeVerificationModels(options.verificationModels);

  try {
    console.log(`Processing Job for Lead ID: ${leadData.id}`);

    let finalOutputText = '';
    let cleanTranslatedText = '';
    let annotatedText = '';
    let translatedTitle = '';
    let translatedSummary = '';
    let flags = [];
    let ragCitations = [];

    const targetLanguage = leadData.languages?.to || 'English';

    const pass1 = passEntry('pass1', 'Transcribe & Translate', {
      models: ['whisper-1', 'gemini-2.5-pro'],
    });
    pipelineRun.passes.push(pass1);

    let originalText;
    const fileUrl = leadData.fileUrl || leadData.fileUrls?.[0];
    if (!fileUrl) {
      throw new Error('Lead is missing an uploaded file URL.');
    }

    try {
      const transcribed = await transcribeAndTranslate(fileUrl, targetLanguage);
      originalText = transcribed.originalText;
      cleanTranslatedText = transcribed.translatedText;
      pass1.status = 'completed';
      pass1.completedAt = new Date().toISOString();
    } catch (err) {
      pass1.status = 'failed';
      pass1.error = err.message;
      pass1.stack = err.stack;
      throw err;
    }

    const pass2 = passEntry('pass2', 'Context verification (Pass 2)', {
      models: verificationModels,
    });
    pipelineRun.passes.push(pass2);

    try {
      const pass2Result = await runPass2Verification(
        cleanTranslatedText,
        targetLanguage,
        verificationModels
      );
      cleanTranslatedText = pass2Result.text;
      pass2.status = 'completed';
      pass2.modelRuns = pass2Result.modelRuns;
      pass2.completedAt = new Date().toISOString();
    } catch (err) {
      pass2.status = 'failed';
      pass2.error = err.message;
      pass2.stack = err.stack;
    }

    finalOutputText = cleanTranslatedText;

    const pass3 = passEntry('pass3', 'RAG legal/medical verification (Pass 3)', {
      models: ['gemini-2.5-pro'],
    });
    pipelineRun.passes.push(pass3);

    if (leadData.services?.legalMedical) {
      try {
        const checkResult = await runPass3RagVerification(
          cleanTranslatedText,
          targetLanguage
        );
        flags = checkResult.flags || [];
        ragCitations = checkResult.citations || [];
        cleanTranslatedText = checkResult.checkedText;
        pass3.status = 'completed';
        pass3.ragSourceCount = checkResult.ragSourceCount;
        pass3.ragSourceTitles = checkResult.ragSourceTitles;
        pass3.citationCount = ragCitations.length;
        pass3.flagCount = flags.length;
        pass3.completedAt = new Date().toISOString();
        const footer = generateFooter(flags);
        annotatedText = cleanTranslatedText + footer;
        finalOutputText = annotatedText;
      } catch (err) {
        pass3.status = 'failed';
        pass3.error = err.message;
        pass3.stack = err.stack;
        annotatedText = cleanTranslatedText;
      }
    } else {
      pass3.status = 'skipped';
      pass3.note = 'Legal/medical service not selected';
      annotatedText = cleanTranslatedText;
    }

    const pass4 = passEntry('pass4', 'Title & summary generation', {
      models: ['gemini-2.5-pro'],
    });
    pipelineRun.passes.push(pass4);

    try {
      const summaryPrompt = `
      Based on the following translated text in ${targetLanguage}, generate:
      1. A translated YouTube/Podcast title.
      2. A translated summary (maximum 3 sentences).

      Return strictly as JSON:
      { "title": "...", "summary": "..." }

      Text:
      ${cleanTranslatedText}
      `;
      const summaryJson = await runGeminiTextPrompt(summaryPrompt, true);
      const summaryData = JSON.parse(summaryJson);
      translatedTitle = summaryData.title;
      translatedSummary = summaryData.summary;
      pass4.status = 'completed';
      pass4.completedAt = new Date().toISOString();
    } catch (err) {
      pass4.status = 'failed';
      pass4.error = err.message;
      console.error('Failed to generate title/summary:', err);
    }

    const pass5 = passEntry('pass5', 'Voice cloning', { models: ['fish-audio'] });
    pipelineRun.passes.push(pass5);

    let clonedAudioBuffer = null;
    let voiceModelId = null;
    if (leadData.services?.voiceCloning && leadData.voiceSampleUrl) {
      try {
        const textToClone = leadData.cloningText || cleanTranslatedText;
        const cloneResult = await cloneVoiceWithFishApi(
          textToClone,
          leadData.voiceSampleUrl,
          leadData.id
        );
        clonedAudioBuffer = cloneResult.audioBuffer;
        voiceModelId = cloneResult.modelId;
        pass5.status = 'completed';
        pass5.completedAt = new Date().toISOString();
      } catch (err) {
        pass5.status = 'failed';
        pass5.error = err.message;
        pass5.stack = err.stack;
      }
    } else {
      pass5.status = 'skipped';
      pass5.note = 'Voice cloning not requested';
    }

    pipelineRun.completedAt = new Date().toISOString();

    return {
      success: true,
      originalText,
      cleanTranslatedText,
      annotatedText,
      translatedTitle,
      translatedSummary,
      finalOutputText,
      clonedAudioBuffer,
      voiceModelId,
      flags,
      ragCitations,
      pipelineRun,
    };
  } catch (error) {
    console.error('Pipeline Error:', error);
    pipelineRun.completedAt = new Date().toISOString();
    pipelineRun.failed = true;
    return {
      success: false,
      error: error.message,
      errorStack: error.stack,
      pipelineRun,
    };
  }
}

/**
 * Re-run Pass 3 on existing clean text (admin retry).
 */
export async function rerunPass3Only(leadData, cleanText) {
  const targetLanguage = leadData.languages?.to || 'English';
  const pass3Log = passEntry('pass3', 'RAG legal/medical verification (retry)', {
    models: ['gemini-2.5-pro'],
  });

  try {
    const checkResult = await runPass3RagVerification(cleanText, targetLanguage);
    const flags = checkResult.flags || [];
    const ragCitations = checkResult.citations || [];
    const corrected = checkResult.checkedText;
    const footer = generateFooter(flags);
    pass3Log.status = 'completed';
    pass3Log.ragSourceCount = checkResult.ragSourceCount;
    pass3Log.ragSourceTitles = checkResult.ragSourceTitles;
    pass3Log.completedAt = new Date().toISOString();

    return {
      success: true,
      cleanTranslatedText: corrected,
      annotatedText: corrected + footer,
      flags,
      ragCitations,
      pipelinePass: pass3Log,
    };
  } catch (err) {
    pass3Log.status = 'failed';
    pass3Log.error = err.message;
    pass3Log.stack = err.stack;
    return { success: false, error: err.message, errorStack: err.stack, pipelinePass: pass3Log };
  }
}
