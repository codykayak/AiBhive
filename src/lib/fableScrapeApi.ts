export type FableScrapeFileTypes = {
  images: boolean;
  text: boolean;
  pdfs: boolean;
};

export type FableScrapeRequest = {
  url?: string;
  query?: string;
  superStealth?: boolean;
  massResearch?: boolean;
  keywords?: string[];
  fileTypes?: FableScrapeFileTypes;
};

export type FableScrapeResponse = {
  summary: string;
  text: string;
  pages: Array<{ url: string; chars: number; keywordHits: string[] }>;
  assets: { images: string[]; pdfs: string[]; textUrls: string[] };
  errors?: Array<{ url: string; error: string }>;
  modes: { superStealth: boolean; massResearch: boolean };
  fileTypes: FableScrapeFileTypes;
  error?: string;
};

export async function runFableScrape(req: FableScrapeRequest): Promise<FableScrapeResponse> {
  const res = await fetch('/api/fable-scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = (await res.json()) as FableScrapeResponse & { error?: string };
  if (!res.ok) throw new Error(data.error || 'Fable Scrape failed');
  return data;
}
