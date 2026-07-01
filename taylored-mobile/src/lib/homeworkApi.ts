import { auth } from '../firebaseConfig';

const HIVE_API_BASE = 'https://aibhive.com';

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

export type RagLibraryExport = {
  ok: boolean;
  documentCount: number;
  totalChars: number;
  documents: Array<{
    id: string;
    title: string;
    text: string;
    chars: number;
    source?: string;
    pageCount?: number | null;
  }>;
};

export class HomeworkPaymentRequiredError extends Error {
  amountUsd: number;

  constructor(message: string, amountUsd: number) {
    super(message);
    this.name = 'HomeworkPaymentRequiredError';
    this.amountUsd = amountUsd;
  }
}

async function requireSignedInUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with Google to use Homework Bot.');
  return user;
}

function parsePaymentError(status: number, text: string): HomeworkPaymentRequiredError | null {
  if (status !== 402) return null;
  try {
    const data = JSON.parse(text);
    return new HomeworkPaymentRequiredError(
      data.error || `Need Hive credits (~$${(data.amountUsd ?? 0.05).toFixed(2)}).`,
      data.amountUsd ?? 0.05
    );
  } catch {
    return new HomeworkPaymentRequiredError('Need Hive credits to continue.', 0.05);
  }
}

async function homeworkFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = await requireSignedInUser();
  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${HIVE_API_BASE}${path}`, { ...options, headers });
}

async function homeworkJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await homeworkFetch(path, options);
  const text = await res.text();
  if (!res.ok) {
    const payment = parsePaymentError(res.status, text);
    if (payment) throw payment;
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error ?? text;
    } catch {
      /* keep text */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return JSON.parse(text) as T;
}

export async function listHomeworkDocuments(): Promise<HomeworkDocument[]> {
  const data = await homeworkJson<{ documents: HomeworkDocument[] }>('/api/homework/documents');
  return data.documents ?? [];
}

export async function viewHomeworkDocument(id: string): Promise<HomeworkDocument & { text: string }> {
  const data = await homeworkJson<{ document: HomeworkDocument & { text: string } }>(
    `/api/homework/documents/${id}/view`
  );
  return data.document;
}

export async function deleteHomeworkDocument(id: string): Promise<void> {
  await homeworkJson(`/api/homework/documents/${id}`, { method: 'DELETE' });
}

export async function fetchRagLibraryExport(): Promise<RagLibraryExport> {
  return homeworkJson<RagLibraryExport>('/api/homework/documents/export');
}

export async function completeHomeworkAssignment(opts: {
  assignmentText?: string;
  customPrompt?: string;
  assignmentUri?: string;
  assignmentName?: string;
  assignmentMimeType?: string;
}): Promise<{ text: string; provider: string; model: string; hadRagContext: boolean }> {
  const body: Record<string, string> = {};
  if (opts.customPrompt?.trim()) body.customPrompt = opts.customPrompt.trim();
  if (opts.assignmentText?.trim()) {
    body.assignmentText = opts.assignmentText.trim();
  } else if (opts.assignmentUri) {
    const FileSystem = await import('expo-file-system');
    const base64 = await FileSystem.readAsStringAsync(opts.assignmentUri, {
      encoding: 'base64',
    });
    body.assignmentBase64 = base64;
    body.assignmentName = opts.assignmentName || 'assignment.txt';
    body.assignmentMimeType = opts.assignmentMimeType || 'text/plain';
  } else {
    throw new Error('Provide assignment text or upload a file.');
  }
  return homeworkJson('/api/homework/complete', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function homeworkFormData<T>(path: string, form: FormData): Promise<T> {
  const user = await requireSignedInUser();
  const token = await user.getIdToken();
  const res = await fetch(`${HIVE_API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    const payment = parsePaymentError(res.status, text);
    if (payment) throw payment;
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error ?? text;
    } catch {
      /* keep text */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return JSON.parse(text) as T;
}
