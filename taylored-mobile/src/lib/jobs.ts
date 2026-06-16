import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  copyAsync,
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';

const JOBS_KEY = 'hive_job_applications_v1';

export type JobStatus = 'draft' | 'generated' | 'submitted' | 'interviewing' | 'rejected' | 'offer';

export type JobApplication = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  candidateName: string;
  email?: string;
  phone?: string;
  jobUrl?: string;
  companyName?: string;
  roleTitle?: string;
  notes?: string;
  jobDetails?: string;
  coverLetter?: string;
  rewrittenResume?: string;
  coldEmail?: string;
  companyIntelSummary?: string;
  screenshotUris: string[];
  resumeUri?: string;
};

function newId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<JobApplication[]> {
  try {
    const raw = await AsyncStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JobApplication[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch {
    return [];
  }
}

async function writeAll(jobs: JobApplication[]) {
  await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export async function listJobs(): Promise<JobApplication[]> {
  return readAll();
}

export async function getJob(id: string): Promise<JobApplication | null> {
  const jobs = await readAll();
  return jobs.find((j) => j.id === id) ?? null;
}

async function ensureJobDir(jobId: string) {
  const dir = `${documentDirectory}jobs/${jobId}/`;
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function persistImageUri(jobId: string, uri: string, index: number): Promise<string> {
  const dir = await ensureJobDir(jobId);
  const dest = `${dir}screenshot-${index}.jpg`;
  try {
    await copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

export async function createJobDraft(input: {
  candidateName: string;
  email?: string;
  phone?: string;
  jobUrl?: string;
  notes?: string;
  resumeUri?: string;
  screenshotUris?: string[];
}): Promise<JobApplication> {
  const id = newId();
  const now = new Date().toISOString();
  const screenshots: string[] = [];
  for (let i = 0; i < (input.screenshotUris?.length ?? 0); i++) {
    const uri = input.screenshotUris![i];
    screenshots.push(await persistImageUri(id, uri, i));
  }

  const job: JobApplication = {
    id,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    candidateName: input.candidateName,
    email: input.email,
    phone: input.phone,
    jobUrl: input.jobUrl,
    notes: input.notes,
    resumeUri: input.resumeUri,
    screenshotUris: screenshots,
  };

  const jobs = await readAll();
  jobs.unshift(job);
  await writeAll(jobs);
  return job;
}

export async function saveJobGenerated(
  id: string,
  data: {
    jobDetails: string;
    coverLetter: string;
    rewrittenResume: string;
    coldEmail: string;
    companyName?: string;
    roleTitle?: string;
  }
): Promise<JobApplication | null> {
  const jobs = await readAll();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;

  const companyMatch = data.jobDetails.match(/company[:\s-]+([^\n]+)/i);
  const roleMatch = data.jobDetails.match(/role[:\s-]+([^\n]+)/i);

  jobs[idx] = {
    ...jobs[idx],
    ...data,
    companyName: data.companyName || companyMatch?.[1]?.trim() || jobs[idx].companyName,
    roleTitle: data.roleTitle || roleMatch?.[1]?.trim() || jobs[idx].roleTitle,
    status: 'generated',
    updatedAt: new Date().toISOString(),
  };
  await writeAll(jobs);
  return jobs[idx];
}

export async function updateJob(id: string, patch: Partial<JobApplication>): Promise<JobApplication | null> {
  const jobs = await readAll();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  jobs[idx] = { ...jobs[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeAll(jobs);
  return jobs[idx];
}

export async function saveCompanyIntel(id: string, summary: string): Promise<JobApplication | null> {
  return updateJob(id, { companyIntelSummary: summary, status: 'submitted' });
}

export function statusLabel(status: JobStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'generated':
      return 'Kit ready';
    case 'submitted':
      return 'Submitted';
    case 'interviewing':
      return 'Interviewing';
    case 'rejected':
      return 'Rejected';
    case 'offer':
      return 'Offer';
    default:
      return status;
  }
}
