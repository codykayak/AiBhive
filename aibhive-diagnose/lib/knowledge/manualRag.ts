import type { TradePackId } from '@/lib/packs/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export type ManualChunk = {
  id: string;
  manualId: string;
  brand: string;
  packId: TradePackId;
  title: string;
  sourceUrl?: string | null;
  modelPrefixes?: string[];
  page?: number;
  text: string;
};

export async function searchManualChunksFromServer(
  token: string,
  q: string,
  packId?: TradePackId
): Promise<ManualChunk[]> {
  if (!API_BASE || !q.trim()) return [];
  const params = new URLSearchParams({ q, limit: '6' });
  if (packId) params.set('packId', packId);
  try {
    const res = await fetch(`${API_BASE}/api/pros/knowledge/manuals/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { chunks?: ManualChunk[] };
    return data.chunks || [];
  } catch {
    return [];
  }
}

export function formatManualChunksContext(chunks: ManualChunk[]): string {
  if (!chunks.length) return '';
  const lines = chunks.map((c, i) => {
    const header = [c.brand, c.title, c.modelPrefixes?.slice(0, 3).join('/')].filter(Boolean).join(' · ');
    const excerpt = c.text.slice(0, 380).replace(/\s+/g, ' ').trim();
    return `${i + 1}. [${header}]${c.page ? ` p.${c.page}` : ''}\n${excerpt}`;
  });
  return ['\nOEM manual excerpts (server RAG):', ...lines].join('\n\n');
}

export type ManualIngestPayload = {
  brand: string;
  packId: TradePackId;
  title: string;
  manualId?: string;
  sourceUrl?: string;
  modelPrefixes?: string[];
  chunks: Array<{ page?: number; text: string }>;
  scope?: 'company' | 'global';
};

export async function ingestManualChunks(token: string, payload: ManualIngestPayload) {
  if (!API_BASE) throw new Error('API URL not configured');
  const res = await fetch(`${API_BASE}/api/pros/knowledge/manuals/ingest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || `Ingest failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) msg = parsed.error;
    } catch {
      // keep
    }
    throw new Error(msg);
  }
  return res.json() as Promise<{ success: boolean; manualId: string; chunksWritten: number }>;
}
