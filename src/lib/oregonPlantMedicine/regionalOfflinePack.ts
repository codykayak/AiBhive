import { PLANT_LIBRARY, matchesRegion, regionLabel, type RegionFilter } from './plantLibrary';

const CACHE_NAME = 'living-knowledge-images-v1';
const META_PREFIX = 'living_knowledge_offline_pack_';

export type OfflinePackMeta = {
  region: RegionFilter;
  downloadedAt: string;
  imageCount: number;
  cachedCount: number;
};

export function getOfflinePackMeta(region: RegionFilter): OfflinePackMeta | null {
  if (typeof window === 'undefined' || region === 'all') return null;
  try {
    const raw = localStorage.getItem(`${META_PREFIX}${region}`);
    if (!raw) return null;
    return JSON.parse(raw) as OfflinePackMeta;
  } catch {
    return null;
  }
}

function collectImageUrls(region: RegionFilter): string[] {
  const urls = new Set<string>();
  for (const plant of PLANT_LIBRARY) {
    if (!matchesRegion(plant, region)) continue;
    if (plant.imageUrl) urls.add(plant.imageUrl);
    for (const img of plant.additionalImages) {
      if (img.url) urls.add(img.url);
    }
  }
  return [...urls];
}

export async function downloadRegionalPack(
  region: RegionFilter,
  onProgress?: (done: number, total: number) => void,
): Promise<OfflinePackMeta> {
  if (region === 'all') {
    throw new Error('Choose a specific region to download an offline pack.');
  }
  if (typeof caches === 'undefined') {
    throw new Error('Offline packs are not supported in this browser.');
  }

  const urls = collectImageUrls(region);
  const cache = await caches.open(CACHE_NAME);
  let cachedCount = 0;

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i]!;
    try {
      const existing = await cache.match(url);
      if (!existing) {
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (res.ok) {
          await cache.put(url, res.clone());
          cachedCount += 1;
        }
      } else {
        cachedCount += 1;
      }
    } catch {
      // Skip images that fail CORS or network — text library still works offline.
    }
    onProgress?.(i + 1, urls.length);
  }

  const meta: OfflinePackMeta = {
    region,
    downloadedAt: new Date().toISOString(),
    imageCount: urls.length,
    cachedCount,
  };
  localStorage.setItem(`${META_PREFIX}${region}`, JSON.stringify(meta));
  return meta;
}

export function offlinePackLabel(region: RegionFilter): string {
  return region === 'all' ? 'All regions' : regionLabel(region);
}
