/** Shared types, constants, and helpers for the Fable Scrape tool. */

export type Asset = {
  url: string;
  alt?: string;
  label?: string;
  filename: string;
  ext?: string;
  iconLikely?: boolean;
};

export type CrawlPage = {
  url: string;
  title: string;
  images: number;
  pdfs: number;
  documents: number;
  videos: number;
};

export type ScanResult = {
  engine: string;
  routingMode: string;
  finalUrl: string;
  startUrl?: string;
  title?: string;
  text?: string;
  textChars?: number;
  images: Asset[];
  pdfs: Asset[];
  documents: Asset[];
  videos: Asset[];
  cookies: string;
  blocked?: boolean;
  directAsset?: boolean;
  pagesVisited?: number;
  pages?: CrawlPage[];
  stoppedReason?: string | null;
  truncated?: boolean;
  chargedUsd?: number;
};

export type RouteMode = 'browser' | 'residential' | 'custom' | 'server';
export type Routing = { mode: RouteMode; proxyUrl?: string };

export type ProviderId = 'grok' | 'gemini' | 'claude' | 'kimi' | 'deepseek';
export type ProviderInfo = {
  id: ProviderId;
  label: string;
  hasServerKey: boolean;
  vision: boolean;
  defaultChatModel: string;
  defaultVisionModel: string;
};

export type RoleKey = 'director' | 'vision' | 'translator';
export type RoleConfig = { provider: ProviderId; model: string };
export type Roster = Record<RoleKey, RoleConfig>;

export type Finding = {
  url: string;
  filename: string;
  alt?: string;
  sourceUrl?: string;
  reason?: string;
  confidence?: number | null;
  ocrText?: string;
  translation?: string;
  targetLang?: string;
  mimeType?: string;
  error?: string;
};

export type HarvestResult = {
  ok: boolean;
  prompt?: string;
  strategy?: string;
  candidatesConsidered?: number;
  findings: Finding[];
  pdfs?: Asset[];
  roles?: Roster;
  warnings?: string[];
  sourceUrl?: string;
  chargedUsd?: number;
};

export type LibraryEntry = {
  id: string;
  title: string;
  prompt: string;
  sourceUrl: string;
  imageUrl: string;
  filename: string;
  ocrText: string;
  translation: string;
  targetLang: string;
  reason: string;
  confidence: number | null;
  roles: Record<string, string>;
  contributor: string;
  publishedBy?: string | null;
  topicId?: string;
  visibility?: 'private' | 'unlisted' | 'public';
  shareToken?: string | null;
  provenance?: Record<string, unknown>;
  correctionCount?: number;
  createdAt: string | null;
  updatedAt?: string | null;
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  grok: 'Grok (xAI)',
  gemini: 'Gemini',
  claude: 'Claude',
  kimi: 'Kimi',
  deepseek: 'DeepSeek',
};

export const ROLE_META: { key: RoleKey; label: string; desc: string; vision: boolean }[] = [
  { key: 'director', label: 'Director', desc: 'Interprets your request & picks targets', vision: false },
  { key: 'vision', label: 'Vision / OCR', desc: 'Reads text out of the images', vision: true },
  { key: 'translator', label: 'Translator', desc: 'Translates the findings', vision: false },
];

export const DEFAULT_ROSTER: Roster = {
  director: { provider: 'grok', model: '' },
  vision: { provider: 'gemini', model: '' },
  translator: { provider: 'gemini', model: '' },
};

export function saveBytes(bytes: BlobPart, mimeType: string, filename: string) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function saveText(text: string, filename: string) {
  saveBytes(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'text/plain', filename);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(bin);
}

/** Fetch an asset directly in the browser (uses the USER's IP). Throws on CORS/errors. */
export async function clientFetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer', credentials: 'omit' });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.blob();
}

export type FableApiOptions = {
  apiBase: string;
  ocrEndpoint: string;
  getAuthHeaders?: () => Promise<Record<string, string>>;
};

export const PUBLIC_FABLE_API: FableApiOptions = {
  apiBase: '/api/fable-scrape',
  ocrEndpoint: '/api/ocr-process',
};

export function meteredFableApi(
  getAuthHeaders: () => Promise<Record<string, string>>,
): FableApiOptions {
  return {
    apiBase: '/api/research-lab/fable-scrape',
    ocrEndpoint: '/api/research-lab/ocr',
    getAuthHeaders,
  };
}

export async function parseFableJson(res: Response) {
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.error ||
        `Need Hive credits (~$${Number(data.amountUsd ?? 5).toFixed(2)}). Add credits or start with pay-as-you-go.`,
    );
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

export async function fablePost(api: FableApiOptions, path: string, body: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (api.getAuthHeaders) Object.assign(headers, await api.getAuthHeaders());
  const res = await fetch(`${api.apiBase}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return parseFableJson(res);
}

export async function fableOcrPost(api: FableApiOptions, body: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (api.getAuthHeaders) Object.assign(headers, await api.getAuthHeaders());
  const res = await fetch(api.ocrEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return parseFableJson(res);
}

export async function fableGet(api: FableApiOptions, path: string) {
  const headers: Record<string, string> = {};
  if (api.getAuthHeaders) Object.assign(headers, await api.getAuthHeaders());
  const res = await fetch(`${api.apiBase}${path}`, { headers });
  return parseFableJson(res);
}
