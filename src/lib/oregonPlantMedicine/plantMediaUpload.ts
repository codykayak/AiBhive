/** Client helpers for community post images and short field videos. */

import { formatPlantImageSize } from './compressPlantImage';
import { HIVE_RESEARCH_LABEL } from './branding';

export const PLANT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export type PendingVideo = {
  file: File;
  previewUrl: string;
};

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export async function readVideoFile(file: File): Promise<{ base64: string; mimeType: string }> {
  if (!file.type.startsWith('video/')) {
    throw new Error('Please choose an MP4 or WebM video.');
  }
  if (file.size > PLANT_VIDEO_MAX_BYTES) {
    throw new Error(`Video too large — max ${formatPlantImageSize(PLANT_VIDEO_MAX_BYTES)}.`);
  }
  return {
    base64: await fileToBase64(file),
    mimeType: file.type || 'video/mp4',
  };
}

/** Grab a single JPEG frame from a video for Hive Research vision enrichment. */
export async function videoFrameForEnrichment(
  file: File,
): Promise<{ base64: string; mimeType: string } | null> {
  if (typeof document === 'undefined') return null;
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error(`Could not read video for ${HIVE_RESEARCH_LABEL}`));
    });
    const seekTo = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(1, video.duration * 0.25) : 0;
    video.currentTime = seekTo;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, video.videoWidth);
    canvas.height = Math.max(1, video.videoHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return null;
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    return { base64: btoa(binary), mimeType: 'image/jpeg' };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
