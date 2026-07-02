import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, KeyRound, Library, Lock, Unlock } from 'lucide-react';
import {
  PAYWALL_BYPASS_TIPS,
  buildSourceDirectory,
  type SourceAccess,
  type SourceDirectoryTarget,
} from '../../lib/intelSourceDirectory';

type Props = {
  target: SourceDirectoryTarget;
};

const ACCESS_META: Record<SourceAccess, { label: string; className: string; Icon: typeof Lock }> = {
  free: {
    label: 'Free',
    className: 'bg-emerald-500/20 text-emerald-300',
    Icon: Unlock,
  },
  signin: {
    label: 'Sign-in',
    className: 'bg-sky-500/20 text-sky-300',
    Icon: KeyRound,
  },
  paid: {
    label: 'Paywall',
    className: 'bg-amber-500/20 text-amber-300',
    Icon: Lock,
  },
};

/**
 * Methodical, clickable directory of external research sources — including the
 * paywalled/sign-in databases the app can't fetch directly — with pre-filled
 * links and tips for getting past walls.
 */
export default function IntelSourceDirectory({ target }: Props) {
  const categories = useMemo(() => buildSourceDirectory(target), [target]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(categories.map((c) => c.id)));
  const [tipsOpen, setTipsOpen] = useState(false);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSources = categories.reduce((n, c) => n + c.sources.length, 0);

  return (
    <section className="rounded-xl border border-bee-amber/30 bg-bee-amber/[0.04] overflow-hidden">
      <div className="p-4 border-b border-bee-amber/20">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-bee-amber shrink-0" />
          <p className="text-sm font-black text-bee-amber uppercase tracking-widest">
            Research playbook — {totalSources} sources
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Every link below is pre-filled for <strong className="text-slate-200">{target.label || 'your target'}</strong> and
          opens in a new tab. Work top to bottom — the steps are ordered like a real investigation.
          Badges show what it takes to get in:{' '}
          <span className="text-emerald-300 font-semibold">Free</span>,{' '}
          <span className="text-sky-300 font-semibold">Sign-in</span> (free account), or{' '}
          <span className="text-amber-300 font-semibold">Paywall</span> — and paywalled items include a way in.
        </p>
      </div>

      {/* Paywall / sign-in bypass tips */}
      <div className="border-b border-bee-amber/20">
        <button
          type="button"
          onClick={() => setTipsOpen((o) => !o)}
          className="w-full flex items-center gap-2 p-3.5 text-left hover:bg-white/[0.03]"
        >
          <Unlock className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="text-sm font-bold text-white flex-1">
            Hit a paywall or sign-in? Get past it
          </span>
          {tipsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {tipsOpen ? (
          <ul className="px-4 pb-4 space-y-2">
            {PAYWALL_BYPASS_TIPS.map((tip) => (
              <li key={tip.name} className="flex items-start gap-2.5 text-xs">
                <a
                  href={tip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-bee-amber hover:underline shrink-0 min-w-[7.5rem]"
                >
                  <ExternalLink className="w-3 h-3" />
                  {tip.name}
                </a>
                <span className="text-slate-400 leading-relaxed">{tip.note}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Ordered source categories */}
      <div className="divide-y divide-white/5">
        {categories.map((cat) => {
          const isOpen = openIds.has(cat.id);
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center gap-2 p-4 text-left hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{cat.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cat.blurb}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{cat.sources.length}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {isOpen ? (
                <ul className="px-4 pb-4 grid sm:grid-cols-2 gap-2">
                  {cat.sources.map((src) => {
                    const meta = ACCESS_META[src.access];
                    const { Icon } = meta;
                    return (
                      <li key={src.name}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col gap-1 h-full p-3 rounded-lg border border-white/10 bg-black/20 hover:border-bee-amber/40 hover:bg-bee-amber/5 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-bee-amber truncate">
                              {src.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${meta.className}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                              {meta.label}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-bee-amber ml-auto shrink-0" />
                          </span>
                          <span className="text-xs text-slate-500 leading-relaxed">{src.description}</span>
                          {src.accessTip ? (
                            <span className="flex items-start gap-1.5 text-[11px] text-emerald-300/80 leading-relaxed mt-0.5">
                              <KeyRound className="w-3 h-3 mt-0.5 shrink-0" />
                              {src.accessTip}
                            </span>
                          ) : null}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
