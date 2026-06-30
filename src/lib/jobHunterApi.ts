import { getOrCreateWebHiveUserId } from './hiveWebUser';

export type JobHunterCriteria = {
  keywords: string;
  wageType: 'hourly' | 'yearly' | 'any';
  minWage: string;
  experienceLevel: string;
  locations: string;
  remote: boolean;
  dateListedDays: number;
};

export type ResumeProfile = {
  id: string;
  label: string;
  type: 'tech' | 'real-estate' | 'general';
  fileName?: string;
  notes?: string;
};

export type JobHunterResult = {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  experienceLevel: string;
  listedDate: string;
  suggestedResumeId: string;
  suggestedResumeLabel: string;
  coverLetter: string;
  matchScore: number;
};

export type JobHunterResponse = {
  ok: boolean;
  jobs?: JobHunterResult[];
  demo?: boolean;
  note?: string;
  query?: string;
  needPayment?: boolean;
  amountUsd?: number;
  error?: string;
};

const RESUMES_KEY = 'aibhive_job_hunter_resumes';
const CRITERIA_KEY = 'aibhive_job_hunter_criteria';

export function loadResumeProfiles(): ResumeProfile[] {
  try {
    const raw = localStorage.getItem(RESUMES_KEY);
    if (raw) return JSON.parse(raw) as ResumeProfile[];
  } catch {
    // ignore
  }
  return [
    { id: 'tech', label: 'Tech resume', type: 'tech', notes: 'Software, product, engineering roles' },
    { id: 'real-estate', label: 'Real estate resume', type: 'real-estate', notes: 'Agent, investor, property mgmt' },
  ];
}

export function saveResumeProfiles(profiles: ResumeProfile[]) {
  localStorage.setItem(RESUMES_KEY, JSON.stringify(profiles));
}

export function loadJobCriteria(): Partial<JobHunterCriteria> {
  try {
    const raw = localStorage.getItem(CRITERIA_KEY);
    if (raw) return JSON.parse(raw) as Partial<JobHunterCriteria>;
  } catch {
    // ignore
  }
  return {};
}

export function saveJobCriteria(c: JobHunterCriteria) {
  localStorage.setItem(CRITERIA_KEY, JSON.stringify(c));
}

export async function searchJobs(
  criteria: JobHunterCriteria,
  resumes: ResumeProfile[]
): Promise<JobHunterResponse> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/hive/job-hunter/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, criteria, resumes }),
  });
  const data = (await res.json()) as JobHunterResponse;
  if (res.status === 402) {
    return { ok: false, needPayment: true, amountUsd: data.amountUsd ?? 0.05, error: data.error };
  }
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || 'Job search failed.' };
  }
  return data;
}
