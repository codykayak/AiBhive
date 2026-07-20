import type { PlantEntry, PlantImage } from './types';

/** Local public folder images (downloaded via fetch-oregon-plant-images.mjs). */
export function gallery(
  id: string,
  credit: string,
  captions: [string, string] = ['Habitat & growth habit', 'Flowers, fruit, or ID detail'],
): Pick<PlantEntry, 'imageUrl' | 'imageCredit' | 'additionalImages'> {
  return {
    imageUrl: `/oregon-plant-medicine/${id}.jpg`,
    imageCredit: credit,
    additionalImages: [
      { url: `/oregon-plant-medicine/${id}-2.jpg`, credit, caption: captions[0] },
      { url: `/oregon-plant-medicine/${id}-3.jpg`, credit, caption: captions[1] },
    ],
  };
}

/** Wikimedia Commons hotlink (Special:FilePath — no local download required). */
export function wikiGallery(
  files: [string, string, string],
  credit = 'Wikimedia Commons',
  captions: [string, string] = ['Habitat & growth habit', 'Flowers, fruit, or ID detail'],
): Pick<PlantEntry, 'imageUrl' | 'imageCredit' | 'additionalImages'> {
  const url = (file: string) =>
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;
  return {
    imageUrl: url(files[0]),
    imageCredit: credit,
    additionalImages: [
      { url: url(files[1]), credit, caption: captions[0] },
      { url: url(files[2]), credit, caption: captions[1] },
    ],
  };
}

export function mergeImages(
  base: Pick<PlantEntry, 'imageUrl' | 'imageCredit' | 'additionalImages'>,
  extra?: PlantImage[],
): Pick<PlantEntry, 'imageUrl' | 'imageCredit' | 'additionalImages'> {
  if (!extra?.length) return base;
  return { ...base, additionalImages: [...base.additionalImages, ...extra] };
}
