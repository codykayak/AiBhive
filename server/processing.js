import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';
import { retrieveContext } from './rag.js';

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


/**
 * 2. Scan for High-Risk Terms using Multi-Model Selection and RAG
 */
export async function performContextAccuracyCheck(text, targetLanguage, modelPreference = 'gemini') {
  console.log(`Starting Context Accuracy Check with ${modelPreference}...`);

  // --- RAG INTEGRATION ---
  // In a full implementation, an initial LLM pass would extract high-risk terms here.
  // We mock this term extraction for the scaffolding.
  const extractedTerms = ['mock_legal_term', 'mock_medical_term'];
  const ragContext = await retrieveContext(extractedTerms, 'both');

  let promptContext = '';
  if (ragContext) {
      promptContext = `\n\nCRITICAL CONTEXT FROM RAG SYSTEM:\nAdhere to the following legal and medical definitions when verifying the translation:\n${ragContext}`;
  }
  // -----------------------

  const prompt = `
  You are an expert ${targetLanguage} translator and verifier.
  This is a High Accuracy mode check. Review the following text which has been translated into ${targetLanguage}.
  Scan the text specifically for high-risk terms (legal, medical, technical, or critical business terms) and verify they are translated correctly and used in the correct context.
  Ignore common, everyday words. Focus ONLY on terms that could flip meaning or cause legal/medical/technical issues if mistranslated.

  Return the output strictly in this JSON format:
  {
    "flags": [
      {"term": "Original Term", "warning": "Explanation of potential mistranslation in ${targetLanguage}"}
    ],
    "correctedText": "Provide a fully corrected version of the ENTIRE text that fixes any critical mistranslations."
  }

  Text to review:
  ${text}
  ${promptContext}
  `;

  try {
    let resultJson = "";

    if (modelPreference === 'claude') {
      console.log("Routing to Anthropic Claude (Stub)...");
      throw new Error("Claude API not yet implemented. Please use Gemini.");
    } else if (modelPreference === 'grok') {
      console.log("Routing to xAI Grok (Stub)...");
      throw new Error("Grok API not yet implemented. Please use Gemini.");
    } else {
      const ai = getGemini();
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
          }
      });
      resultJson = response.text;
    }

    const result = JSON.parse(resultJson);
    return { checkedText: result.correctedText || text, flags: result.flags || [] };
  } catch (error) {
    console.error(`${modelPreference} Scan Error:`, error);
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
export async function processLeadJob(leadData) {
  try {
    console.log(`Processing Job for Lead ID: ${leadData.id}`);

    let finalOutputText = "";
    let cleanTranslatedText = "";
    let annotatedText = "";
    let translatedTitle = "";
    let translatedSummary = "";
    let flags = [];

    const targetLanguage = leadData.languages?.to || 'English';


    // 1. Transcribe & Translate (Pass 1 - Initial translation via Whisper / GPT-4o)
    const { originalText, translatedText } = await transcribeAndTranslate(
      leadData.fileUrl,
      targetLanguage
    );

    cleanTranslatedText = translatedText;

    // 2. High-Risk Context Accuracy Check (Pass 2 - Multi-Model selection checks for mistranslated terms)
    console.log("Pass 2: High-Risk Context Accuracy Check...");

    // Fetch Global Settings from Firestore (fallback to gemini)
    let preferredModel = 'gemini';
    try {
       const admin = await import('firebase-admin');
       // Using the named database instance for environments where it's required
       let db;
       if (process.env.FIRESTORE_DATABASE_ID) {
           db = admin.default.firestore(admin.default.app(), process.env.FIRESTORE_DATABASE_ID);
       } else {
           db = admin.default.firestore();
       }
       const settingsSnap = await db.collection('system').doc('settings').get();
       if (settingsSnap.exists) {
           preferredModel = settingsSnap.data().preferredModel || 'gemini';
       }
    } catch(err) {
       console.warn("Could not fetch global settings, defaulting to gemini:", err.message);
    }

    const checkResult = await performContextAccuracyCheck(
      cleanTranslatedText,
      targetLanguage,
      preferredModel
    );

    flags = checkResult.flags;
    cleanTranslatedText = checkResult.checkedText; // The corrected text is now the clean text

    // If there are flags, generate the footer and annotated version
    if (flags && flags.length > 0) {
      const footer = generateFooter(flags);
      annotatedText = cleanTranslatedText + footer;
      finalOutputText = annotatedText;
    } else {
      annotatedText = cleanTranslatedText;
      finalOutputText = cleanTranslatedText;
    }

    // 3. Generate Title and Summary
// 4. Generate Title and Summary
    try {
      const ai = getGemini();
      const summaryPrompt = `
      Based on the following translated text in ${targetLanguage}, generate:
      1. A translated YouTube/Podcast title.
      2. A translated summary (maximum 3 sentences).

      Return strictly as JSON:
      {
        "title": "...",
        "summary": "..."
      }

      Text:
      ${cleanTranslatedText}
      `;
      const summaryResponse = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: summaryPrompt,
          config: {
              responseMimeType: "application/json",
          }
      });
      const summaryData = JSON.parse(summaryResponse.text);
      translatedTitle = summaryData.title;
      translatedSummary = summaryData.summary;
    } catch (err) {
      console.error("Failed to generate title/summary:", err);
    }

    // 3. Voice Cloning
    let clonedAudioBuffer = null;
    let voiceModelId = null;
    if (leadData.services?.voiceCloning && leadData.voiceSampleUrl) {
      // Use clean text for cloning, unless custom cloning text is provided
      const textToClone = leadData.cloningText || cleanTranslatedText;
      const cloneResult = await cloneVoiceWithFishApi(textToClone, leadData.voiceSampleUrl, leadData.id);
      clonedAudioBuffer = cloneResult.audioBuffer;
      voiceModelId = cloneResult.modelId;
    }

    return {
      success: true,
      originalText,
      cleanTranslatedText,
      annotatedText,
      translatedTitle,
      translatedSummary,
      finalOutputText, // Keep for backward compatibility or as the main text blob
      clonedAudioBuffer,
      voiceModelId,
      flags
    };

  } catch (error) {
    console.error("Pipeline Error:", error);
    return { success: false, error: error.message };
  }
}
