import type { User } from 'firebase/auth';
import { adminJson } from './adminApi';
import type { HomeworkDocument } from './homeworkApi';

export type OcrFormat = 'Markdown' | 'Plain Text' | 'Preserve Layout';

/** Keep each HTTP request under Cloud Run / proxy body limits (~32MB). */
const IMAGES_PER_REQUEST = 12;

/** Compress image for OCR API (max width 1500px, JPEG 0.8). */
export function compressImageForOcr(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1500;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}

export type OcrIngestResult = {
  ok: boolean;
  document: HomeworkDocument;
  pageCount: number;
  chars: number;
};

export async function ingestHomeworkOcrBatch(
  user: User,
  opts: {
    images: string[];
    format?: OcrFormat;
    title?: string;
  }
): Promise<OcrIngestResult> {
  return adminJson<OcrIngestResult>('/api/homework/ocr-ingest', user, {
    method: 'POST',
    body: JSON.stringify({
      images: opts.images,
      format: opts.format || 'Markdown',
      title: opts.title,
    }),
  });
}

export async function compressAndIngestImageFiles(
  user: User,
  files: File[],
  opts: {
    format?: OcrFormat;
    title?: string;
    onProgress?: (pct: number, label: string) => void;
  } = {}
): Promise<OcrIngestResult> {
  const totalChunks = Math.ceil(files.length / IMAGES_PER_REQUEST);
  let lastResult: OcrIngestResult | null = null;
  let processed = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunkFiles = files.slice(
      chunkIndex * IMAGES_PER_REQUEST,
      chunkIndex * IMAGES_PER_REQUEST + IMAGES_PER_REQUEST
    );
    const base64Images: string[] = [];

    for (let i = 0; i < chunkFiles.length; i++) {
      processed += 1;
      opts.onProgress?.(
        Math.round((processed / files.length) * 40),
        `Compressing page ${processed} of ${files.length}…`
      );
      base64Images.push(await compressImageForOcr(chunkFiles[i]));
    }

    const chunkLabel =
      totalChunks > 1 ? ` (part ${chunkIndex + 1}/${totalChunks})` : '';
    const batchTitle = opts.title?.trim()
      ? `${opts.title.trim()}${chunkLabel}`
      : undefined;

    opts.onProgress?.(
      Math.round(40 + ((chunkIndex + 0.5) / totalChunks) * 55),
      totalChunks > 1
        ? `OCR batch ${chunkIndex + 1} of ${totalChunks}…`
        : 'Running OCR (this may take a minute)…'
    );

    lastResult = await ingestHomeworkOcrBatch(user, {
      images: base64Images,
      format: opts.format,
      title: batchTitle,
    });
  }

  opts.onProgress?.(100, 'Saved to your RAG library');
  if (!lastResult) {
    throw new Error('No images to process.');
  }
  return lastResult;
}
