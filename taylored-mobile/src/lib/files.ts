import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

export function mimeTypeForUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'text/plain';
}

export async function readUriAsBase64(uri: string): Promise<string | null> {
  try {
    return await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  } catch {
    return null;
  }
}
