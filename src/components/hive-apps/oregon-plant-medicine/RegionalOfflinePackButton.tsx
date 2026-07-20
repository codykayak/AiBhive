import { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import {
  downloadRegionalPack,
  getOfflinePackMeta,
  offlinePackLabel,
} from '../../../lib/oregonPlantMedicine/regionalOfflinePack';
import type { RegionFilter } from '../../../lib/oregonPlantMedicine/plantLibrary';

type Props = {
  region: RegionFilter;
};

export default function RegionalOfflinePackButton({ region }: Props) {
  const [meta, setMeta] = useState(() => getOfflinePackMeta(region));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  if (region === 'all') return null;

  const handleDownload = async () => {
    setBusy(true);
    setError('');
    setProgress({ done: 0, total: 0 });
    try {
      const result = await downloadRegionalPack(region, (done, total) => {
        setProgress({ done, total });
      });
      setMeta(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 text-xs text-slate-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-300">Offline image pack</p>
          <p className="mt-0.5 leading-relaxed">
            {meta
              ? `Downloaded ${meta.cachedCount}/${meta.imageCount} photos for ${offlinePackLabel(region)}.`
              : `Cache ID photos for ${offlinePackLabel(region)} — keeps the APK small while you stay offline in the field.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {progress && progress.total > 0
                ? `${progress.done}/${progress.total}`
                : 'Preparing…'}
            </>
          ) : meta ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Refresh pack
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Download pack
            </>
          )}
        </button>
      </div>
      {error ? <p className="text-amber-300 mt-2">{error}</p> : null}
    </div>
  );
}
