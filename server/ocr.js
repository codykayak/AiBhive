import { GoogleGenAI } from '@google/genai';

let aiClient;
function getGemini() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) return null;
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const FORMAT_INSTRUCTIONS = {
  Markdown:
    'Please extract all text and format it clearly in Markdown, preserving headers, lists, and structure as best as possible.',
  'Preserve Layout':
    'Please extract all text and attempt to preserve the spatial layout and table structures using spacing or ASCII formatting if necessary.',
  'Plain Text': 'Please extract all text into plain text format. Do not use Markdown.',
};

/**
 * Run Gemini vision OCR on up to 100 base64 JPEG images.
 * @param {string[]} images - base64 strings (no data-URL prefix)
 * @param {string} [format] - Markdown | Plain Text | Preserve Layout
 */
export async function runOcrOnImages(images, format = 'Markdown') {
  if (!images?.length) {
    throw new Error('No images provided.');
  }
  if (images.length > 100) {
    throw new Error('Maximum 100 images allowed per request.');
  }

  const ai = getGemini();
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
    const status = error.message?.includes('Maximum') || error.message?.includes('No images') ? 400 : 500;
    return res.status(status).json({ error: error.message || 'Failed to process images.' });
  }
};
