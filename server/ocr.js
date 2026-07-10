import { GoogleGenAI } from '@google/genai';
import { MAX_OCR_IMAGES } from './costProtection.js';

const clients = new Map();

function getGemini(apiKey) {
  const key = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key) return null;
  if (!clients.has(key)) {
    clients.set(key, new GoogleGenAI({ apiKey: key }));
  }
  return clients.get(key) ?? null;
}

const FORMAT_INSTRUCTIONS = {
  Markdown:
    'Please extract all text and format it clearly in Markdown, preserving headers, lists, and structure as best as possible.',
  'Preserve Layout':
    'Please extract all text and attempt to preserve the spatial layout and table structures using spacing or ASCII formatting if necessary.',
  'Plain Text': 'Please extract all text into plain text format. Do not use Markdown.',
};

/**
 * Run Gemini vision OCR on base64 JPEG images (hard-capped for cost control).
 * @param {string[]} images - base64 strings (no data-URL prefix)
 * @param {string} [format] - Markdown | Plain Text | Preserve Layout
 * @param {string} [apiKey] - optional BYOK Gemini key
 */
export async function runOcrOnImages(images, format = 'Markdown', apiKey) {
  if (!images?.length) {
    throw new Error('No images provided.');
  }
  if (images.length > MAX_OCR_IMAGES) {
    throw new Error(`Maximum ${MAX_OCR_IMAGES} images allowed per request.`);
  }

  const ai = getGemini(apiKey);
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const formatInstruction =
    FORMAT_INSTRUCTIONS[format] ||
    'Please extract all text from these images exactly as it appears.';

  const prompt = `
      You are an expert OCR system.
      ${formatInstruction}
      Combine the extracted text from all images into a single cohesive output.
      Preserve page order as the images were provided.
    `;

  const contents = [
    { text: prompt },
    ...images.map((base64Str) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Str,
      },
    })),
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  const text = response.text?.trim() || '';
  if (!text) {
    throw new Error('OCR returned no text.');
  }
  return text;
}

export const processOcr = async (req, res) => {
  try {
    const { images, format } = req.body;
    const text = await runOcrOnImages(images, format);
    return res.status(200).json({ text });
  } catch (error) {
    console.error('OCR Processing Error:', error);
    const status =
      error.message?.includes('Maximum') || error.message?.includes('No images') ? 400 : 500;
    return res.status(status).json({ error: error.message || 'Failed to process images.' });
  }
};
