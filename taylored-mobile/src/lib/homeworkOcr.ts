import * as ImageManipulator from 'expo-image-manipulator';
import { homeworkFormData, type HomeworkDocument } from './homeworkApi';

export type OcrFormat = 'Markdown' | 'Plain Text' | 'Preserve Layout';

export const OCR_UPLOAD_CHUNK_SIZE = 20;
const MAX_OCR_WIDTH = 1200;
const JPEG_QUALITY = 0.72;

export type PickedPageImage = {
  uri: string;
  name: string;
};

export async function compressPageImage(uri: string): Promise<{ uri: string; name: string }> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_OCR_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return { uri: resized.uri, name: 'page.jpg' };
}

export type OcrIngestResult = {
  ok: boolean;
  document: HomeworkDocument;
  pageCount: number;
  chars: number;
};

export async function ingestHomeworkOcrImages(
  images: PickedPageImage[],
  opts: {
    format?: OcrFormat;
    title?: string;
    onCompressProgress?: (done: number, total: number) => void;
  }
): Promise<OcrIngestResult> {
  const form = new FormData();
  for (let i = 0; i < images.length; i++) {
    opts.onCompressProgress?.(i + 1, images.length);
    const compressed = await compressPageImage(images[i].uri);
    const safeName = images[i].name.replace(/\.[^.]+$/i, '') || `page-${i + 1}`;
    form.append('files', {
      uri: compressed.uri,
      name: `${safeName}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  }
  form.append('format', opts.format || 'Markdown');
  if (opts.title?.trim()) form.append('title', opts.title.trim());
  return homeworkFormData<OcrIngestResult>('/api/homework/ocr-ingest', form);
}

export async function compressAndIngestImages(
  images: PickedPageImage[],
  opts: {
    format?: OcrFormat;
    title?: string;
    onProgress?: (pct: number, label: string) => void;
  } = {}
): Promise<OcrIngestResult> {
  if (!images.length) throw new Error('No images to process.');

  const totalChunks = Math.ceil(images.length / OCR_UPLOAD_CHUNK_SIZE);
  let lastResult: OcrIngestResult | null = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunk = images.slice(
      chunkIndex * OCR_UPLOAD_CHUNK_SIZE,
      chunkIndex * OCR_UPLOAD_CHUNK_SIZE + OCR_UPLOAD_CHUNK_SIZE
    );
    const chunkLabel = totalChunks > 1 ? ` (part ${chunkIndex + 1}/${totalChunks})` : '';
    const batchTitle = opts.title?.trim() ? `${opts.title.trim()}${chunkLabel}` : undefined;

    opts.onProgress?.(
      Math.round((chunkIndex / totalChunks) * 90),
      totalChunks > 1
        ? `Uploading batch ${chunkIndex + 1} of ${totalChunks}…`
        : `Uploading ${chunk.length} page${chunk.length === 1 ? '' : 's'}…`
    );

    lastResult = await ingestHomeworkOcrImages(chunk, {
      format: opts.format,
      title: batchTitle,
      onCompressProgress: (done, total) => {
        const filesDone = chunkIndex * OCR_UPLOAD_CHUNK_SIZE + done;
        opts.onProgress?.(
          Math.round((filesDone / images.length) * 45),
          `Compressing page ${filesDone} of ${images.length}…`
        );
        void total;
      },
    });

    opts.onProgress?.(
      Math.round(((chunkIndex + 1) / totalChunks) * 95),
      totalChunks > 1 ? `OCR batch ${chunkIndex + 1} saved…` : 'Saving to RAG…'
    );
  }

  opts.onProgress?.(100, 'All pages saved to your library');
  return lastResult!;
}
