/**
 * Auto-Bot Resume — web + Hive Cloud generation (mirrors mobile AutoBotResumeResultScreen).
 */
import { GoogleGenAI } from '@google/genai';
import * as hiveUsage from './hiveUsage.js';

const RESUME_MODEL = process.env.RESUME_BOT_MODEL || 'gemini-2.5-flash';
const RESUME_RAW_COST = 0.012;

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function extractSection(text, start, end) {
  const pattern = end
    ? new RegExp(`\\[${start}\\]([\\s\\S]*?)\\[${end}\\]`, 'i')
    : new RegExp(`\\[${start}\\]([\\s\\S]*)`, 'i');
  const match = text.match(pattern);
  return match?.[1]?.trim() || '';
}

export async function scrapeJobPostingUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return null;

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: trimmed, formats: ['markdown'] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const markdown = data?.data?.markdown || data?.markdown;
    if (typeof markdown === 'string' && markdown.trim()) {
      return markdown.substring(0, 12000);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function generateResumeKit(db, userId, payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const phone = String(payload.phone || '').trim();
  const history = String(payload.history || '').trim();
  const jobUrl = String(payload.jobUrl || '').trim();
  const jobDescription = String(payload.jobDescription || '').trim();

  if (!name) {
    return { ok: false, error: 'Full name is required.' };
  }
  if (!jobUrl && !jobDescription && !(payload.jobImages?.length)) {
    return {
      ok: false,
      error: 'Add a job posting URL, paste the job description, or attach a screenshot.',
    };
  }
  if (!payload.resumeBase64 && !history) {
    return {
      ok: false,
      error: 'Upload a resume or add work history notes so we can tailor your application.',
    };
  }

  const gemini = getGemini();
  if (!gemini) {
    return { ok: false, error: 'Hive AI is warming up. Try again in a moment.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, RESUME_RAW_COST * 1.2, 'resume_local');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.05 };
  }

  let scrapedJob = null;
  if (jobUrl) {
    scrapedJob = await scrapeJobPostingUrl(jobUrl);
  }

  const jobSource = scrapedJob
    ? `Scraped job posting content:\n${scrapedJob}`
    : jobDescription
      ? `Pasted job description:\n${jobDescription}`
      : 'Use the attached job listing screenshot(s).';

  const prompt = `
You are an elite career coach and recruiter working for AiBhive.

Candidate:
- Name: ${name}
- Email: ${email || 'not provided'}
- Phone: ${phone || 'not provided'}
- Additional notes: ${history || 'none'}

Job source:
${jobSource}
${jobUrl ? `Original URL: ${jobUrl}` : ''}

Return exactly five sections with these headers in ALL CAPS brackets:

[JOB DETAILS]
Extract company name, role title, requirements, and keywords from the listing.

[COVER LETTER]
Write a persuasive, role-specific cover letter in first person.

[REWRITTEN RESUME]
Rewrite the resume content to match this role. Use concise bullet points and measurable outcomes.

[COLD EMAIL]
Write a 3-sentence outreach email to a hiring manager or recruiter.

[VISUAL RESUME JSON]
Return ONE JSON object only (no markdown fences) shaped exactly like:
{
  "firstName": "JANE",
  "lastName": "DOE",
  "tagline": "One-line professional headline",
  "aboutMe": "2-3 sentences about background",
  "profile": "2-3 sentences tailored to this job",
  "experience": [
    { "company": "Employer", "dates": "2020 - 2023", "role": "Title", "bullets": ["Outcome bullet"] }
  ],
  "education": [
    { "credential": "Degree or cert", "dates": "2018", "school": "School name" }
  ],
  "skills": ["Skill one", "Skill two"],
  "phone": "${phone || ''}",
  "email": "${email || ''}",
  "website": ""
}
Use the candidate's real history. Tailor profile, experience bullets, and skills to the target role. Keep JSON valid.
`;

  const parts = [{ text: prompt }];

  if (payload.resumeBase64) {
    parts.push({
      inlineData: {
        mimeType: payload.resumeMime || 'application/pdf',
        data: payload.resumeBase64,
      },
    });
  }

  for (const img of payload.jobImages || []) {
    if (img?.base64) {
      parts.push({
        inlineData: {
          mimeType: img.mime || 'image/jpeg',
          data: img.base64,
        },
      });
    }
  }

  try {
    const response = await gemini.models.generateContent({
      model: RESUME_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        temperature: 0.5,
        maxOutputTokens: 4096,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { ok: false, error: 'No response from Hive AI.' };
    }

    await hiveUsage.recordTokenUsage(db, userId, {
      rawCostUsd: RESUME_RAW_COST,
      feature: 'resume_local',
      summary: 'Auto-Bot Resume (web)',
    });

    return {
      ok: true,
      jobDetails: extractSection(text, 'JOB DETAILS', 'COVER LETTER') || 'Could not parse job details.',
      coverLetter: extractSection(text, 'COVER LETTER', 'REWRITTEN RESUME') || 'Could not parse cover letter.',
      rewrittenResume:
        extractSection(text, 'REWRITTEN RESUME', 'COLD EMAIL') || 'Could not parse resume rewrite.',
      coldEmail: extractSection(text, 'COLD EMAIL', 'VISUAL RESUME JSON') || extractSection(text, 'COLD EMAIL') || text,
      visualResumeJson:
        extractSection(text, 'VISUAL RESUME JSON') ||
        extractSection(text, 'VISUAL RESUME JSON', 'JOB DETAILS') ||
        '',
      scrapedJob: !!scrapedJob,
    };
  } catch (err) {
    console.error('[resume/generate]', err.message || err);
    return { ok: false, error: err.message || 'Generation failed.' };
  }
}
