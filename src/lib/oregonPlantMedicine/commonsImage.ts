/** Wikimedia Commons image via redirect — reliable when thumb hash URLs are unknown. */
export function commonsImage(fileName: string, width = 640): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}
