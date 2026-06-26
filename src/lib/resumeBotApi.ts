import { getOrCreateWebHiveUserId } from './hiveWebUser';

export type ResumeGeneratePayload = {
  name: string;
  email?: string;
  phone?: string;
  history?: string;
  jobUrl?: string;
  jobDescription?: string;
  resumeBase64?: string;
  resumeMime?: string;
  jobImages?: Array<{ base64: string; mime?: string }>;
};

export type ResumeKitResult = {
  jobDetails: string;
  coverLetter: string;
  rewrittenResume: string;
  coldEmail: string;
  scrapedJob?: boolean;
};

export async function generateResumeKit(payload: ResumeGeneratePayload): Promise<ResumeKitResult> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/hive/resume/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...payload }),
  });
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.error ||
        `This needs Hive credits (~$${(data.amountUsd ?? 0.05).toFixed(2)}). Get the mobile app or add credits.`
    );
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Could not generate your application kit.');
  }
  return {
    jobDetails: data.jobDetails,
    coverLetter: data.coverLetter,
    rewrittenResume: data.rewrittenResume,
    coldEmail: data.coldEmail,
    scrapedJob: data.scrapedJob,
  };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
