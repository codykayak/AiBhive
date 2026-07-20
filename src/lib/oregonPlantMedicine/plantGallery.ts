import type { PlantEntry, PlantImage } from './types';
import { PLANT_IMAGE_MANIFEST } from './plantImageManifest';
import { LOCAL_PLANT_IMAGE_IDS } from './localPlantImageIds';
import { commonsImage } from './commonsImage';

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
  const url = (file: string) => commonsImage(file, 900);
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

/** Apply verified manifest URLs when available (from resolve-plant-wiki-images.mjs). */
export function applyManifestImages(entry: PlantEntry): PlantEntry {
  const credit = entry.imageCredit ?? 'Wikimedia Commons';
  if (LOCAL_PLANT_IMAGE_IDS.has(entry.id)) {
    return { ...entry, ...gallery(entry.id, credit) };
  }
  const hit = PLANT_IMAGE_MANIFEST[entry.id];
  if (!hit) return entry;
  return {
    ...entry,
    imageUrl: hit.imageUrl,
    imageCredit: hit.imageCredit,
    additionalImages: hit.additionalImages,
  };
}
