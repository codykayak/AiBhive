import { Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { prosAdmin as t } from './prosAdminTheme';

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
        t.demoBanner,
        'flex flex-wrap items-start gap-3 justify-between',
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sky-800">Sample shop preview</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{disclaimer}</p>
        </div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
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
    <span className={cn(t.demoBadge, className)}>
      Sample
    </span>
  );
}
