import type { User } from 'firebase/auth';
import { adminFetch, adminFormData, adminJson } from './adminApi';

export type HomeworkDocument = {
  id: string;
  title: string;
  chars: number;
  mimeType?: string | null;
  originalFilename?: string | null;
  source?: 'ocr' | 'upload' | 'paste';
  pageCount?: number | null;
  active: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export class HomeworkPaymentRequiredError extends Error {
  amountUsd: number;
  suggestedPlan?: string;

  constructor(message: string, amountUsd: number, suggestedPlan?: string) {
    super(message);
    this.name = 'HomeworkPaymentRequiredError';
    this.amountUsd = amountUsd;
    this.suggestedPlan = suggestedPlan;
  }
}

type DocumentsResponse = { documents: HomeworkDocument[] };
type DocumentViewResponse = { document: HomeworkDocument & { text: string } };
type CompleteResponse = {
  ok: boolean;
  text: string;
  provider: string;
  model: string;
  hadRagContext: boolean;
  chargedUsd?: number;
};

export type HomeworkChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  ok: boolean;
  reply: string;
  provider: string;
  model: string;
  hadRagContext: boolean;
  chargedUsd?: number;
};

function parsePaymentError(text: string, status: number): HomeworkPaymentRequiredError | null {
  if (status !== 402) return null;
  try {
    const data = JSON.parse(text);
    return new HomeworkPaymentRequiredError(
      data.error ||
        `Need Hive credits (~$${(data.amountUsd ?? 0.05).toFixed(2)}). Add credits to continue.`,
      data.amountUsd ?? 0.05,
      data.suggestedPlan
    );
  } catch {
    return new HomeworkPaymentRequiredError('Need Hive credits to continue.', 0.05);
  }
}

async function homeworkJson<T>(path: string, user: User, options?: RequestInit): Promise<T> {
  const res = await adminFetch(path, user, options);
  if (!res.ok) {
    const text = await res.text();
    const payment = parsePaymentError(text, res.status);
    if (payment) throw payment;
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error ?? text;
    } catch {
      /* keep text */
    }
    const err = new Error(message || `Request failed (${res.status})`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

async function homeworkFormData<T>(
  path: string,
  user: User,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'POST'
): Promise<T> {
  const token = await user.getIdToken();
  const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    const payment = parsePaymentError(text, res.status);
    if (payment) throw payment;
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error ?? text;
    } catch {
      /* keep text */
    }
    const err = new Error(message || `Request failed (${res.status})`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function listHomeworkDocuments(user: User): Promise<HomeworkDocument[]> {
  const data = await homeworkJson<DocumentsResponse>('/api/homework/documents', user);
  return data.documents ?? [];
}

export async function viewHomeworkDocument(
  user: User,
  id: string
): Promise<HomeworkDocument & { text: string }> {
  const data = await homeworkJson<DocumentViewResponse>(`/api/homework/documents/${id}/view`, user);
  return data.document;
}

export async function uploadHomeworkDocument(
  user: User,
  file: File,
  title?: string
): Promise<HomeworkDocument> {
  const form = new FormData();
  form.append('file', file);
  if (title?.trim()) form.append('title', title.trim());
  const data = await homeworkFormData<{ document: HomeworkDocument }>(
    '/api/homework/documents',
    user,
    form
  );
  return data.document;
}

export async function addHomeworkTextDocument(
  user: User,
  title: string,
  text: string
): Promise<HomeworkDocument> {
  const data = await homeworkJson<{ document: HomeworkDocument }>('/api/homework/documents', user, {
    method: 'POST',
    body: JSON.stringify({ title, text }),
  });
  return data.document;
}

export async function deleteHomeworkDocument(user: User, id: string): Promise<void> {
  await homeworkJson('/api/homework/documents/' + id, user, { method: 'DELETE' });
}

export async function completeHomeworkAssignment(
  user: User,
  opts: { assignmentText?: string; file?: File; customPrompt?: string }
): Promise<CompleteResponse> {
  const body: Record<string, string> = {};

  if (opts.customPrompt?.trim()) {
    body.customPrompt = opts.customPrompt.trim();
  }

  if (opts.assignmentText?.trim()) {
    body.assignmentText = opts.assignmentText.trim();
  } else if (opts.file) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(opts.file!);
    });
    body.assignmentBase64 = base64;
    body.assignmentName = opts.file.name;
    body.assignmentMimeType = opts.file.type || 'text/plain';
  } else {
    throw new Error('Provide assignment text or upload a file.');
  }

  return homeworkJson<CompleteResponse>('/api/homework/complete', user, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function sendHomeworkChat(
  user: User,
  opts: { message: string; history?: HomeworkChatMessage[] }
): Promise<ChatResponse> {
  return homeworkJson<ChatResponse>('/api/homework/chat', user, {
    method: 'POST',
    body: JSON.stringify({
      message: opts.message,
      history: opts.history ?? [],
    }),
  });
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

// Re-export for homeworkOcr.ts
export { homeworkFormData };
