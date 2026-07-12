import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TradePackId } from '@/lib/packs/types';
import { searchFieldTips } from './fieldKnowledge';

const CACHE_KEY = 'aibhive.diagnose.remoteTips.v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export type RemoteTip = {
  id: string;
  text: string;
  packId?: string;
  scope?: string;
  score?: number;
  confirmedCount?: number;
};

type CacheBlob = {
  fetchedAt: number;
  tips: RemoteTip[];
};

async function readCache(): Promise<CacheBlob | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheBlob) : null;
  } catch {
    return null;
  }
}

async function writeCache(tips: RemoteTip[]) {
  const blob: CacheBlob = { fetchedAt: Date.now(), tips };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(blob));
}

/** Pull company + network tips and cache for offline browse / RAG. */
export async function refreshRemoteTips(
  token: string,
  packId?: TradePackId,
  query = ''
): Promise<RemoteTip[]> {
  const data = await searchFieldTips(token, query || 'fix tip', packId);
  const tips = (data.tips || []) as RemoteTip[];
  const existing = (await readCache())?.tips || [];
  const byId = new Map<string, RemoteTip>();
  for (const t of [...existing, ...tips]) {
    if (t?.id && t?.text) byId.set(t.id, t);
  }
  const merged = Array.from(byId.values()).slice(0, 80);
  await writeCache(merged);
  return tips;
}

export async function getCachedTips(packId?: TradePackId): Promise<RemoteTip[]> {
  const cache = await readCache();
  if (!cache) return [];
  const tips = cache.tips || [];
  if (!packId) return tips;
  return tips.filter((t) => !t.packId || t.packId === packId || t.packId === 'all');
}

/** Short context block for diagnose prompts (cached tips only — no network). */
export async function getCachedTipsContext(
  packId: TradePackId,
  query: string
): Promise<string> {
  const tips = await getCachedTips(packId);
  if (!tips.length) return '';
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  const scored = tips
    .map((tip) => {
      const blob = tip.text.toLowerCase();
      const hits = tokens.reduce((n, t) => n + (blob.includes(t) ? 1 : 0), 0);
      return { tip, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3);

  if (!scored.length) return '';
  return scored
    .map((s) => {
      const badge =
        typeof s.tip.confirmedCount === 'number' && s.tip.confirmedCount > 0
          ? ` (${s.tip.confirmedCount} shops confirmed)`
          : s.tip.scope === 'global'
            ? ' (network tip)'
            : ' (shop tip)';
      return `- ${s.tip.text.slice(0, 220)}${badge}`;
    })
    .join('\n');
}

export async function isRemoteCacheStale(): Promise<boolean> {
  const cache = await readCache();
  if (!cache) return true;
  return Date.now() - cache.fetchedAt > CACHE_TTL_MS;
}
