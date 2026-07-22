/** Client-side resize/compress so phone photos fit API JSON limits without quality loss on screen. */

const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const JPEG_QUALITY = 0.85;
/** Target ~1.5MB raw file before base64 (~2MB JSON) — typical cell-phone photo after resize. */
const MAX_BYTES = 1_500_000;
/** Tighter cap for Grok vision (jpg/png only, faster upload). */
const VISION_MAX_BYTES = 900_000;
const VISION_MAX_WIDTH = 1536;
const VISION_MAX_HEIGHT = 1536;

export type CompressedPlantImage = {
  file: File;
  previewUrl: string;
  mimeType: string;
  base64: string;
};

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image — try JPEG or PNG'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      'image/jpeg',
      quality,
    );
  });
}

async function encodeJpeg(
  img: HTMLImageElement,
  quality: number,
  maxWidth = MAX_WIDTH,
  maxHeight = MAX_HEIGHT,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare image');
  ctx.drawImage(img, 0, 0, width, height);
  return canvasToBlob(canvas, quality);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/**
 * Compress a user-selected image for plant-medicine uploads and Grok photo ID.
 * Skips re-encoding tiny files that are already small JPEGs.
 */
export async function compressPlantImageFile(
  file: File,
  opts?: { forVision?: boolean },
): Promise<CompressedPlantImage> {
  const forVision = opts?.forVision === true;
  const maxBytes = forVision ? VISION_MAX_BYTES : MAX_BYTES;
  const maxW = forVision ? VISION_MAX_WIDTH : MAX_WIDTH;
  const maxH = forVision ? VISION_MAX_HEIGHT : MAX_HEIGHT;

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG, or HEIC).');
  }

  if (!forVision && file.size <= 400_000 && /jpe?g$/i.test(file.name)) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    const base64 = btoa(binary);
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      mimeType: file.type || 'image/jpeg',
      base64,
    };
  }

  const img = await readImage(file);
  let quality = JPEG_QUALITY;
  let blob = await encodeJpeg(img, quality, maxW, maxH);
  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await encodeJpeg(img, quality, maxW, maxH);
  }

  const base64 = await blobToBase64(blob);
  const outFile = new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
  return {
    file: outFile,
    previewUrl: URL.createObjectURL(outFile),
    mimeType: 'image/jpeg',
    base64,
  };
}

export const PLANT_IMAGE_MAX_COUNT = 5;

export function formatPlantImageSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
