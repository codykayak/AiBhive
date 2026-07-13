import { Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type Props = {
  disclaimer?: string;
  onDismiss?: () => void;
  className?: string;
};

export default function ProsDemoPreviewBanner({ disclaimer, onDismiss, className }: Props) {
  if (!disclaimer) return null;

  return (
    <div
      className={cn(
        'mb-6 rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-amber-500/10 px-4 py-3 flex flex-wrap items-start gap-3 justify-between',
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <Sparkles className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sky-200">Sample shop preview</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{disclaimer}</p>
        </div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 shrink-0"
          title="Hide banner"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}

export function DemoSampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 tracking-wider',
        className
      )}
    >
      Sample
    </span>
  );
}
