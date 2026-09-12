/** Featured section videos — static /public first (original), GCS proxy as fallback only. */
const PLANT_MED_GCS = '/api/plant-medicine/media/plant-medicine/videos/plant-medicine-foraging-aibhive.mp4';
const IRIDOLOGY_GCS = '/api/plant-medicine/media/plant-medicine/videos/ai-iridology-aibhive.mp4';

export const PLANT_MED_VIDEO_SOURCES = [
  '/plant-medicine-foraging-aibhive.webm',
  '/plant-medicine-foraging-aibhive.mp4',
  PLANT_MED_GCS,
] as const;

export const IRIDOLOGY_VIDEO_SOURCES = [
  '/oregon-plant-medicine/ai-iridology-aibhive.mp4',
  IRIDOLOGY_GCS,
] as const;
