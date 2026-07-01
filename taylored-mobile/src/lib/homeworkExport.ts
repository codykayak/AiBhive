import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fetchRagLibraryExport, type RagLibraryExport } from './homeworkApi';

export type RagExportFormat = 'txt' | 'md' | 'pdf';

function stampLabel() {
  return new Date().toISOString().slice(0, 10);
}

export function formatRagExportTxt(library: RagLibraryExport): string {
  const lines = [
    'RAG Library Export',
    `Exported: ${new Date().toISOString()}`,
    `Documents: ${library.documentCount}`,
    `Total characters: ${library.totalChars.toLocaleString()}`,
    '',
  ];
  library.documents.forEach((doc, i) => {
    lines.push('='.repeat(72));
    lines.push(`Document ${i + 1} of ${library.documentCount}: ${doc.title}`);
    if (doc.pageCount) lines.push(`Pages: ${doc.pageCount}`);
    lines.push('='.repeat(72));
    lines.push('');
    lines.push(doc.text);
    lines.push('');
  });
  return lines.join('\n');
}

export function formatRagExportMarkdown(library: RagLibraryExport): string {
  const lines = [
    '# RAG Library Export',
    '',
    `- **Exported:** ${new Date().toISOString()}`,
    `- **Documents:** ${library.documentCount}`,
    '',
    '---',
    '',
  ];
  for (const doc of library.documents) {
    lines.push(`## ${doc.title}`);
    lines.push('');
    lines.push(doc.text);
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

async function shareTextFile(content: string, filename: string, mimeType: string) {
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, { encoding: 'utf8' });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(path, { mimeType, dialogTitle: filename });
}

export async function downloadRagLibrary(format: RagExportFormat): Promise<void> {
  const library = await fetchRagLibraryExport();
  const baseName = `rag-library-${stampLabel()}`;

  if (format === 'txt') {
    await shareTextFile(formatRagExportTxt(library), `${baseName}.txt`, 'text/plain');
    return;
  }

  if (format === 'md') {
    await shareTextFile(formatRagExportMarkdown(library), `${baseName}.md`, 'text/markdown');
    return;
  }

  const body = formatRagExportTxt(library)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => `<p style="margin:0 0 6px;font-family:monospace;font-size:11px;white-space:pre-wrap">${line || '&nbsp;'}</p>`)
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>RAG Export</title></head><body style="padding:24px;color:#111">${body}</body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${baseName}.pdf` });
}
