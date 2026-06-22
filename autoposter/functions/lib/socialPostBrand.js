import { loadBrand } from './loadConfig.js';

export function getBrand() {
  return loadBrand();
}

export const BRAND = new Proxy(
  {},
  {
    get(_, prop) {
      return loadBrand()[prop];
    },
  },
);

export const PLATFORM_SPECS = {
  facebook: {
    label: 'Facebook',
    aspectRatio: '16:9',
    aspectHint: '16:9 landscape, 1200x675 style',
    charLimit: 63206,
    captionGuide: '150-250 words, conversational, end with a question, include site link',
  },
  instagram: {
    label: 'Instagram',
    aspectRatio: '4:5',
    aspectHint: '4:5 portrait feed post, 1080x1350 style',
    charLimit: 2200,
    captionGuide: '120-180 words, punchy hook, 12-18 hashtags on separate lines at end',
  },
  x: {
    label: 'X',
    aspectRatio: '16:9',
    aspectHint: '16:9 landscape, 1200x675 style',
    charLimit: 280,
    captionGuide: 'max 270 characters including link, sharp hook, 1-2 hashtags',
  },
};

export const IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp',
];
