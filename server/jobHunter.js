/**
 * Job Hunter Bot — search + cover letters + resume matching (web community app).
 */
import { GoogleGenAI } from '@google/genai';
import * as hiveUsage from './hiveUsage.js';

const MODEL = process.env.JOB_HUNTER_MODEL || 'gemini-2.5-flash';
const RAW_COST = 0.018;

let aiClient;

function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function buildSearchQuery(criteria) {
  const parts = [];
  const keywords = String(criteria.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  if (keywords.length) parts.push(keywords.join(' '));
  if (criteria.remote) parts.push('remote');
  else if (criteria.locations?.trim()) parts.push(`jobs in ${criteria.locations.trim()}`);
  if (criteria.experienceLevel?.trim()) parts.push(criteria.experienceLevel.trim());
  if (criteria.wageType === 'hourly' && criteria.minWage) parts.push(`$${criteria.minWage}+ per hour`);
  if (criteria.wageType === 'yearly' && criteria.minWage) parts.push(`$${criteria.minWage}+ salary`);
  parts.push('job opening apply site:linkedin.com OR site:indeed.com OR site:greenhouse.io');
  return parts.join(' ').trim() || 'remote software jobs hiring';
}

async function firecrawlSearch(query) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 12, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.data)) return null;
    return data.data
      .map((item) => {
        const url = item.url || item.metadata?.url || '';
        const title = item.title || item.metadata?.title || '';
        const text = item.markdown || item.description || '';
        return `TITLE: ${title}\nURL: ${url}\n${String(text).slice(0, 1500)}`;
      })
      .join('\n\n---\n\n')
      .slice(0, 24000);
  } catch {
    return null;
  }
}

function demoJobs(criteria) {
  const kw = String(criteria.keywords || 'Product Manager').split(',')[0].trim() || 'Role';
  const loc = criteria.remote ? 'Remote' : criteria.locations?.trim() || 'United States';
  return Array.from({ length: 10 }, (_, i) => ({
    id: `demo-${i + 1}`,
    title: `${kw} ${i + 1}`,
    company: ['Northwind Labs', 'Acme Corp', 'Stripe', 'Notion', 'Figma', 'Linear', 'Vercel', 'Anthropic', 'OpenAI', 'Databricks'][i],
    url: `https://example.com/jobs/${i + 1}`,
    location: loc,
    salary: criteria.wageType === 'hourly' ? `$${criteria.minWage || 45}+/hr` : `$${criteria.minWage || 120}k+`,
    experienceLevel: criteria.experienceLevel || 'Mid-level',
    listedDate: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    suggestedResumeId: i % 2 === 0 ? 'tech' : 'real-estate',
    suggestedResumeLabel: i % 2 === 0 ? 'Tech resume' : 'Real estate resume',
    coverLetter: `[Demo mode — connect Firecrawl + Gemini on the server for live listings.]\n\nDear Hiring Manager,\n\nI am excited to apply for the ${kw} role at ${['Northwind Labs', 'Acme Corp', 'Stripe', 'Notion', 'Figma', 'Linear', 'Vercel', 'Anthropic', 'OpenAI', 'Databricks'][i]}. My background aligns with your requirements for ${criteria.experienceLevel || 'experienced'} professionals in ${loc}.\n\nThank you for your consideration.`,
    matchScore: 92 - i * 2,
  }));
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runJobHunterSearch(db, userId, criteria, resumes = []) {
  const gemini = getGemini();
  if (!gemini) {
    return { ok: true, jobs: demoJobs(criteria), demo: true, note: 'Hive AI offline — showing sample results.' };
  }

  const budget = await hiveUsage.checkTokenBudget(db, userId, RAW_COST * 1.2, 'job_hunter');
  if (!budget.ok) {
    return { ok: false, needPayment: true, amountUsd: budget.amountUsd ?? 0.05 };
  }

  const query = buildSearchQuery(criteria);
  const searchBlob = (await firecrawlSearch(query)) || '';

  if (!searchBlob.trim()) {
    return {
      ok: true,
      jobs: demoJobs(criteria),
      demo: true,
      note: 'Live search unavailable — showing sample jobs. Add FIRECRAWL_API_KEY on the server for real listings.',
    };
  }

  const resumeList = Array.isArray(resumes)
    ? resumes.map((r) => `- id="${r.id}" label="${r.label}" type="${r.type || 'general'}"`).join('\n')
    : '- id="tech" label="Tech resume"\n- id="real-estate" label="Real estate resume"';

  const prompt = `You are a job search assistant. Parse the search results below and return EXACTLY 10 distinct job listings as JSON array.

User criteria:
- Keywords: ${criteria.keywords || 'any'}
- Wage: ${criteria.wageType || 'any'} ${criteria.minWage ? `min ${criteria.minWage}` : ''}
- Experience: ${criteria.experienceLevel || 'any'}
- Location: ${criteria.remote ? 'Remote only' : criteria.locations || 'any'}
- Posted within: ${criteria.dateListedDays || 30} days

Available resumes (pick best match per job):
${resumeList}

For each job output:
{
  "title": string,
  "company": string,
  "url": string (real URL from results),
  "location": string,
  "salary": string or "Not listed",
  "experienceLevel": string,
  "listedDate": "YYYY-MM-DD" or best guess,
  "suggestedResumeId": string (from resume ids),
  "suggestedResumeLabel": string,
  "coverLetter": string (150-220 words, ready to paste),
  "matchScore": number 0-100
}

Return ONLY a JSON array, no markdown fences.

SEARCH RESULTS:
${searchBlob}`;

  const response = await gemini.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const text = response.text || '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  let jobs = [];
  try {
    jobs = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return { ok: true, jobs: demoJobs(criteria), demo: true, note: 'Could not parse AI results — showing samples.' };
  }

  if (!Array.isArray(jobs) || !jobs.length) {
    return { ok: true, jobs: demoJobs(criteria), demo: true, note: 'No jobs parsed — showing samples.' };
  }

  jobs = jobs.slice(0, 10).map((j, i) => ({
    id: `job-${Date.now()}-${i}`,
    title: String(j.title || 'Role'),
    company: String(j.company || 'Company'),
    url: String(j.url || '#'),
    location: String(j.location || ''),
    salary: String(j.salary || 'Not listed'),
    experienceLevel: String(j.experienceLevel || criteria.experienceLevel || ''),
    listedDate: String(j.listedDate || ''),
    suggestedResumeId: String(j.suggestedResumeId || 'tech'),
    suggestedResumeLabel: String(j.suggestedResumeLabel || 'Tech resume'),
    coverLetter: String(j.coverLetter || ''),
    matchScore: Number(j.matchScore) || 80,
  }));

  await hiveUsage.recordTokenUsage(db, userId, RAW_COST, 'job_hunter');

  return { ok: true, jobs, demo: false, query };
}
