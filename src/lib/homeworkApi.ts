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

type DocumentsResponse = { documents: HomeworkDocument[] };
type DocumentViewResponse = { document: HomeworkDocument & { text: string } };
type CompleteResponse = {
  ok: boolean;
  text: string;
  provider: string;
  model: string;
  hadRagContext: boolean;
};

export async function listHomeworkDocuments(user: User): Promise<HomeworkDocument[]> {
  const data = await adminJson<DocumentsResponse>('/api/homework/documents', user);
  return data.documents ?? [];
}

export async function viewHomeworkDocument(
  user: User,
  id: string
): Promise<HomeworkDocument & { text: string }> {
  const data = await adminJson<DocumentViewResponse>(`/api/homework/documents/${id}/view`, user);
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
  const data = await adminFormData<{ document: HomeworkDocument }>(
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
  const data = await adminJson<{ document: HomeworkDocument }>('/api/homework/documents', user, {
    method: 'POST',
    body: JSON.stringify({ title, text }),
  });
  return data.document;
}

export async function deleteHomeworkDocument(user: User, id: string): Promise<void> {
  await adminJson('/api/homework/documents/' + id, user, { method: 'DELETE' });
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

  return adminJson<CompleteResponse>('/api/homework/complete', user, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
