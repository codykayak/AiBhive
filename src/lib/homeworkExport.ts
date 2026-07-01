import type { User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import { adminFetch } from './adminApi';

export type RagExportDocument = {
  id: string;
  title: string;
  text: string;
  chars: number;
  source?: string;
  pageCount?: number | null;
};

export type RagLibraryExport = {
  ok: boolean;
  documentCount: number;
  totalChars: number;
  documents: RagExportDocument[];
};

export type RagExportFormat = 'txt' | 'md' | 'pdf';

export async function fetchRagLibraryExport(user: User): Promise<RagLibraryExport> {
  const res = await adminFetch('/api/homework/documents/export', user);
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error ?? text;
    } catch {
      /* keep text */
    }
    throw new Error(message || `Export failed (${res.status})`);
  }
  return res.json() as Promise<RagLibraryExport>;
}

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

  for (let i = 0; i < library.documents.length; i++) {
    const doc = library.documents[i];
    lines.push('='.repeat(72));
    lines.push(`Document ${i + 1} of ${library.documentCount}: ${doc.title}`);
    if (doc.pageCount) lines.push(`Pages: ${doc.pageCount}`);
    if (doc.source) lines.push(`Source: ${doc.source}`);
    lines.push('='.repeat(72));
    lines.push('');
    lines.push(doc.text);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatRagExportMarkdown(library: RagLibraryExport): string {
  const lines = [
    '# RAG Library Export',
    '',
    `- **Exported:** ${new Date().toISOString()}`,
    `- **Documents:** ${library.documentCount}`,
    `- **Total characters:** ${library.totalChars.toLocaleString()}`,
    '',
    '---',
    '',
  ];

  for (const doc of library.documents) {
    lines.push(`## ${doc.title}`);
    if (doc.pageCount) lines.push(`*${doc.pageCount} pages · ${doc.source ?? 'upload'}*`);
    lines.push('');
    lines.push(doc.text);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadRagExportPdf(library: RagLibraryExport, filename?: string) {
  const doc = new jsPDF();
  const margin = 15;
  const lineHeight = 7;
  const maxWidth = 180;
  const fullText = formatRagExportTxt(library);
  const lines = doc.splitTextToSize(fullText, maxWidth);

  let y = margin;
  for (let i = 0; i < lines.length; i++) {
    if (y > 280) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  doc.save(filename ?? `rag-library-${stampLabel()}.pdf`);
}

export function downloadRagLibrary(user: User, format: RagExportFormat): Promise<void> {
  return fetchRagLibraryExport(user).then((library) => {
    const baseName = `rag-library-${stampLabel()}`;

    if (format === 'txt') {
      const text = formatRagExportTxt(library);
      triggerBlobDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${baseName}.txt`);
      return;
    }

    if (format === 'md') {
      const text = formatRagExportMarkdown(library);
      triggerBlobDownload(new Blob([text], { type: 'text/markdown;charset=utf-8' }), `${baseName}.md`);
      return;
    }

    downloadRagExportPdf(library, `${baseName}.pdf`);
  });
}
