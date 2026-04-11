import { GoogleGenAI } from '@google/genai';
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
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
      });
      originalText = transcription.text;
    }

    // Translate text to target language using standard LLM if not English
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `You are a professional translator. Translate the following text to ${targetLanguage}.` },
        { role: "user", content: originalText }
      ]
    });

    const translatedText = completion.choices[0].message.content;

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
  Review the following text which has been translated into ${targetLanguage}.
  Scan the text for high-risk terms (e.g., 'negligence', 'malpractice', 'diagnosis', 'prescription', 'liability', 'consent', 'battery', 'arrest').
  Research common mistranslations for these terms in ${targetLanguage}.
  Flag any terms that could flip meaning or cause legal/medical issues if mistranslated.

  Return the output strictly in this JSON format:
  {
    "flags": [
      {"term": "Original Term", "warning": "Explanation of potential mistranslation in ${targetLanguage}"}
    ]
  }

  Text to review:
  ${text}
  `;

  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    const result = JSON.parse(response.text);
    return { checkedText: text, flags: result.flags || [] };
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
export async function processLeadJob(leadData) {
  try {
    console.log(`Processing Job for Lead ID: ${leadData.id}`);

    let finalOutputText = "";
    let finalAudioUrl = null;
    let flags = [];

    // 1. Transcribe & Translate
    const { originalText, translatedText } = await transcribeAndTranslate(
      leadData.fileUrl,
      leadData.languages?.to || 'English'
    );

    finalOutputText = translatedText;

    // 2. Legal/Medical Accuracy Check
    if (leadData.services?.legalMedical) {
      const contextFlags = { legal: true, medical: true };
      const checkResult = await performContextAccuracyCheck(
        translatedText,
        contextFlags,
        leadData.languages?.to || 'English'
      );

      flags = checkResult.flags;
      const footer = generateFooter(flags);
      finalOutputText += footer;
    }

    // 3. Voice Cloning
    let clonedAudioBuffer = null;
    let voiceModelId = null;
    if (leadData.services?.voiceCloning && leadData.voiceSampleUrl) {
      const textToClone = leadData.cloningText || finalOutputText;
      const cloneResult = await cloneVoiceWithFishApi(textToClone, leadData.voiceSampleUrl, leadData.id);
      clonedAudioBuffer = cloneResult.audioBuffer;
      voiceModelId = cloneResult.modelId;
    }

    return {
      success: true,
      originalText,
      finalOutputText,
      clonedAudioBuffer,
      voiceModelId,
      flags
    };

  } catch (error) {
    console.error("Pipeline Error:", error);
    return { success: false, error: error.message };
  }
}
