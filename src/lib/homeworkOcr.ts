import type { User } from 'firebase/auth';
import { homeworkFormData, type HomeworkDocument } from './homeworkApi';

export type OcrFormat = 'Markdown' | 'Plain Text' | 'Preserve Layout';

/** Images per multipart upload (stays under Cloud Run ~32MB request cap). */
export const OCR_UPLOAD_CHUNK_SIZE = 20;

const MAX_OCR_WIDTH = 1200;
const JPEG_QUALITY = 0.72;

/** Compress image to JPEG Blob for multipart upload (no base64 JSON bloat). */
export function compressImageToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > MAX_OCR_WIDTH) {
          height = Math.round((height * MAX_OCR_WIDTH) / width);
          width = MAX_OCR_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
          'image/jpeg',
          JPEG_QUALITY
        );
      };
      img.onerror = () => reject(new Error(`Could not read image: ${file.name}`));
    };
    reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`));
  });
}

export type OcrIngestResult = {
  ok: boolean;
  document: HomeworkDocument;
  pageCount: number;
  chars: number;
};

export async function ingestHomeworkOcrFiles(
  user: User,
  files: File[],
  opts: {
    format?: OcrFormat;
    title?: string;
    onCompressProgress?: (done: number, total: number) => void;
  }
): Promise<OcrIngestResult> {
  const form = new FormData();
  for (let i = 0; i < files.length; i++) {
    opts.onCompressProgress?.(i + 1, files.length);
    const blob = await compressImageToBlob(files[i]);
    const safeName = files[i].name.replace(/\.[^.]+$/i, '') || `page-${i + 1}`;
    form.append('files', blob, `${safeName}.jpg`);
  }
  form.append('format', opts.format || 'Markdown');
  if (opts.title?.trim()) form.append('title', opts.title.trim());
  return homeworkFormData<OcrIngestResult>('/api/homework/ocr-ingest', user, form);
}

/**
 * Compress and upload images in chunks via multipart/form-data (10–50+ pages).
 * Each chunk is OCR'd and saved as a separate RAG document.
 */
export async function compressAndIngestImageFiles(
  user: User,
  files: File[],
  opts: {
    format?: OcrFormat;
    title?: string;
    onProgress?: (pct: number, label: string) => void;
  } = {}
): Promise<OcrIngestResult> {
  if (!files.length) throw new Error('No images to process.');

  const totalChunks = Math.ceil(files.length / OCR_UPLOAD_CHUNK_SIZE);
  let lastResult: OcrIngestResult | null = null;
  let filesDone = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunkFiles = files.slice(
      chunkIndex * OCR_UPLOAD_CHUNK_SIZE,
      chunkIndex * OCR_UPLOAD_CHUNK_SIZE + OCR_UPLOAD_CHUNK_SIZE
    );

    const chunkLabel = totalChunks > 1 ? ` (part ${chunkIndex + 1}/${totalChunks})` : '';
    const batchTitle = opts.title?.trim()
      ? `${opts.title.trim()}${chunkLabel}`
      : undefined;

    opts.onProgress?.(
      Math.round((chunkIndex / totalChunks) * 90),
      totalChunks > 1
        ? `Uploading batch ${chunkIndex + 1} of ${totalChunks} (${chunkFiles.length} pages)…`
        : `Uploading ${chunkFiles.length} page${chunkFiles.length === 1 ? '' : 's'}…`
    );

    lastResult = await ingestHomeworkOcrFiles(user, chunkFiles, {
      format: opts.format,
      title: batchTitle,
      onCompressProgress: (done) => {
        filesDone = chunkIndex * OCR_UPLOAD_CHUNK_SIZE + done;
        opts.onProgress?.(
          Math.round((filesDone / files.length) * 45),
          `Compressing page ${filesDone} of ${files.length}…`
        );
      },
    });

    opts.onProgress?.(
      Math.round(((chunkIndex + 1) / totalChunks) * 95),
      totalChunks > 1
        ? `OCR batch ${chunkIndex + 1} of ${totalChunks} saved to RAG…`
        : 'Running OCR and saving to RAG…'
    );
  }

  opts.onProgress?.(100, 'All pages saved to your RAG library');
  return lastResult!;
}
