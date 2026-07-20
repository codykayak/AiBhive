/** Wikimedia Commons image via redirect — reliable when thumb hash URLs are unknown. */
export function commonsImage(fileName: string, width = 640): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}

/** Convert legacy upload.wikimedia.org thumb URLs to Special:FilePath redirects. */
export function normalizeWikiImageUrl(url: string, width = 960): string {
  if (!url) return url;
  if (url.includes('commons.wikimedia.org/wiki/Special:FilePath')) return url;

  const thumb = url.match(/\/commons\/thumb\/(?:[^/]+\/){2}([^/]+)\/\d+px-/i);
  if (thumb?.[1]) {
    return commonsImage(decodeURIComponent(thumb[1]), width);
  }

  const direct = url.match(/\/commons\/([^\s?#/]+\.(?:jpg|jpeg|png|webp|gif))(?:\?|$)/i);
  if (direct?.[1]) {
    return commonsImage(decodeURIComponent(direct[1]), width);
  }

  return url;
}
