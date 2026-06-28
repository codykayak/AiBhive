/**
 * Extract plain text from uploaded research documents (.txt, .pdf).
 */
import { GoogleGenAI } from '@google/genai';

let geminiClient;

function getGemini() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

/**
 * @param {{ name?: string, mimeType?: string, base64: string }} file
 */
export async function extractDocumentText(file) {
  const name = String(file.name || '').toLowerCase();
  const mime = String(file.mimeType || '').toLowerCase();
  const base64 = String(file.base64 || '').trim();
  if (!base64) throw new Error('Empty file.');

  if (mime.includes('text/plain') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
    const text = Buffer.from(base64, 'base64').toString('utf8').trim();
    if (!text) throw new Error('Text file is empty.');
    return text.slice(0, 120000);
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    const gemini = getGemini();
    if (!gemini) throw new Error('PDF extraction unavailable — try .txt export.');
    const response = await gemini.models.generateContent({
      model: process.env.INTEL_GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'application/pdf', data: base64 } },
            {
              text: 'Extract all readable text from this PDF for OSINT research analysis. Return plain text only — no commentary.',
            },
          ],
        },
      ],
      config: { temperature: 0.1, maxOutputTokens: 8192 },
    });
    const text = response.text?.trim() || '';
    if (!text) throw new Error('Could not extract text from PDF.');
    return text.slice(0, 120000);
  }

  throw new Error('Unsupported file type. Upload .txt or .pdf');
}
