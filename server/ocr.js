import { GoogleGenAI } from '@google/genai';

// Instantiate here so we don't need to touch server/processing.js exports
let aiClient;
function getGemini() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export const processOcr = async (req, res) => {
  try {
    const { images, format } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided.' });
    }

    if (images.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 images allowed per request.' });
    }

    const ai = getGemini();

    // Construct the instruction prompt based on format preference
    let formatInstruction = 'Please extract all text from these images exactly as it appears.';
    if (format === 'Markdown') {
      formatInstruction = 'Please extract all text and format it clearly in Markdown, preserving headers, lists, and structure as best as possible.';
    } else if (format === 'Preserve Layout') {
      formatInstruction = 'Please extract all text and attempt to preserve the spatial layout and table structures using spacing or ASCII formatting if necessary.';
    } else if (format === 'Plain Text') {
      formatInstruction = 'Please extract all text into plain text format. Do not use Markdown.';
    }

    const prompt = `
      You are an expert OCR system.
      ${formatInstruction}
      Combine the extracted text from all images into a single cohesive output.
    `;

    // Construct contents array for Gemini
    // Gemini 2.5 flash accepts multiple parts including text and base64 inlineData
    const contents = [
      { text: prompt },
      ...images.map(base64Str => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Str
        }
      }))
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents
    });

    const text = response.text || '';

    return res.status(200).json({ text });

  } catch (error) {
    console.error('OCR Processing Error:', error);
    return res.status(500).json({ error: 'Failed to process images.' });
  }
};
