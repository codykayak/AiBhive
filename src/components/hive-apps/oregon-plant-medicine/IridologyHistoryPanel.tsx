import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { fetchIridologyHistory, fetchIridologyAnalysis } from '../../../lib/oregonPlantMedicine/iridologyHistoryApi';
import {
  loadLocalIridologyHistory,
  mergeHistoryLists,
  saveLocalIridologyAnalysis,
  type IridologyHistoryListItem,
  type IridologySavedAnalysis,
} from '../../../lib/oregonPlantMedicine/iridologyHistoryStorage';

type Props = {
  user: User | null;
  activeId: string | null;
  onSelect: (analysis: IridologySavedAnalysis) => void;
  refreshKey?: number;
};

export default function IridologyHistoryPanel({ user, activeId, onSelect, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<IridologyHistoryListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const local = loadLocalIridologyHistory(user?.uid ?? null);
    if (!user) {
      setItems(
        local.map((l) => ({
          id: l.id,
          createdAt: l.createdAt,
          methodology: l.methodology,
          eye: l.eye,
          photoQuality: l.structured.photoQuality,
          constitutionalLabel: l.structured.constitutionalType?.label,
          summaryLine: l.structured.integratedSummary?.slice(0, 160) || l.reply.slice(0, 160),
          chatCount: l.chatMessages?.length ?? 0,
        })),
      );
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchIridologyHistory(user)
      .then((remote) => {
        if (cancelled) return;
        setItems(mergeHistoryLists(remote, local));
      })
      .catch(() => {
        if (!cancelled) {
          setItems(
            local.map((l) => ({
              id: l.id,
              createdAt: l.createdAt,
              methodology: l.methodology,
              eye: l.eye,
              photoQuality: l.structured.photoQuality,
              constitutionalLabel: l.structured.constitutionalType?.label,
              summaryLine: l.structured.integratedSummary?.slice(0, 160) || l.reply.slice(0, 160),
              chatCount: l.chatMessages?.length ?? 0,
            })),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  if (!items.length && !loading) return null;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-indigo-300" />
        <h3 className="text-sm font-bold text-white">Your saved analyses</h3>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : null}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const local = loadLocalIridologyHistory(user?.uid ?? null).find((a) => a.id === item.id);
              if (local) {
                onSelect(local);
                return;
              }
              if (!user) return;
              void fetchIridologyAnalysis(user, item.id)
                .then((remote) => {
                  saveLocalIridologyAnalysis(user.uid, {
                    ...remote,
                    structured: remote.structured,
                    chatMessages: remote.chatMessages ?? [],
                  });
                  onSelect({
                    ...remote,
                    structured: remote.structured,
                    chatMessages: remote.chatMessages ?? [],
                  });
                })
                .catch(() => {
                  /* ignore */
                });
            }}
            className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
              activeId === item.id
                ? 'border-indigo-500/50 bg-indigo-500/15'
                : 'border-slate-700 hover:border-indigo-500/30 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>{new Date(item.createdAt).toLocaleString()}</span>
              <span className="text-indigo-300">{item.eye} eye</span>
              {item.photoQuality ? <span>photo: {item.photoQuality}</span> : null}
              {item.chatCount ? <span>{item.chatCount} chat msgs</span> : null}
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {item.constitutionalLabel ? `${item.constitutionalLabel} · ` : ''}
              {item.summaryLine || 'Iris analysis'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
