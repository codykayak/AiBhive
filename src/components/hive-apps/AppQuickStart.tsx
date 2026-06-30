import { useState } from 'react';
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react';

type Props = {
  appId: string;
  title?: string;
  steps: string[];
  accent?: 'sky' | 'violet';
};

const STORAGE_PREFIX = 'aibhive_quickstart_dismissed_';

export default function AppQuickStart({ appId, title = 'How to use this app', steps, accent = 'sky' }: Props) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(`${STORAGE_PREFIX}${appId}`) === '1');
  const [open, setOpen] = useState(() => localStorage.getItem(`${STORAGE_PREFIX}${appId}`) !== '1');

  const border = accent === 'violet' ? 'border-violet-500/30 bg-violet-500/5' : 'border-sky-500/30 bg-sky-500/5';
  const icon = accent === 'violet' ? 'text-violet-400' : 'text-sky-400';

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          setDismissed(false);
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${icon} hover:underline`}
      >
        <CircleHelp className="w-3.5 h-3.5" />
        How to use this app
      </button>
    );
  }

  return (
    <div className={`rounded-xl border ${border} overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <CircleHelp className={`w-4 h-4 shrink-0 ${icon}`} />
          <span className="text-white font-bold text-sm">{title}</span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(`${STORAGE_PREFIX}${appId}`, '1');
            setDismissed(true);
            setOpen(false);
          }}
          className="text-slate-500 text-xs hover:text-slate-300 shrink-0"
        >
          Got it
        </button>
      </div>
      {open && (
        <ol className="px-4 pb-4 space-y-2 list-decimal list-inside text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
