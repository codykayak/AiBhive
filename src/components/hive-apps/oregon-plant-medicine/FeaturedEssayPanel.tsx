import { useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, PlayCircle, Sprout, Star, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { FeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import PostEngagementBar from './PostEngagementBar';
import ResearchTopicImage from './ResearchTopicImage';

const ACCENT = {
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-400/60',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    label: 'text-emerald-300',
    ring: 'ring-emerald-500/20',
    detailBorder: 'border-emerald-500/35',
  },
  violet: {
    border: 'border-violet-500/40 hover:border-violet-400/60',
    badge: 'bg-violet-500/20 text-violet-200 border-violet-400/40',
    label: 'text-violet-300',
    ring: 'ring-violet-500/20',
    detailBorder: 'border-violet-500/35',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-400/60',
    badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    label: 'text-cyan-300',
    ring: 'ring-cyan-500/20',
    detailBorder: 'border-cyan-500/35',
  },
  lime: {
    border: 'border-lime-500/40 hover:border-lime-400/60',
    badge: 'bg-lime-500/20 text-lime-200 border-lime-400/40',
    label: 'text-lime-300',
    ring: 'ring-lime-500/20',
    detailBorder: 'border-lime-500/35',
  },
} as const;

function ChartBlock({ text }: { text: string }) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return null;
  const rows = lines
    .filter((l) => !/^-{2,}/.test(l.trim()) && !l.includes('---'))
    .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean));
  if (rows.length < 2) {
    return (
      <pre className="text-xs text-slate-300 bg-slate-900/80 border border-slate-700 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
        {text}
      </pre>
    );
  }
  const [header, ...body] = rows;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-900 text-slate-300">
          <tr>
            {header.map((h) => (
              <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className="border-t border-slate-800 text-slate-300">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeaturedEssayDetail({
  essay,
  onClose,
  onOpenPlant,
  user,
  onSignIn,
  onAskAi,
}: {
  essay: FeaturedEssay;
  onClose: () => void;
  onOpenPlant?: (plant: PlantEntry) => void;
  user?: User | null;
  onSignIn?: () => void;
  onAskAi?: (ctx: AskAiContext) => void;
}) {
  const theme = ACCENT[essay.accent];
  const relatedPlants = useMemo(
    () =>
      essay.relatedPlantIds
        .map((id) => PLANT_LIBRARY.find((p) => p.id === id))
        .filter((p): p is PlantEntry => !!p),
    [essay.relatedPlantIds],
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`bg-slate-950 border ${theme.detailBorder} rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto shadow-2xl`}
      >
        <div className="relative">
          <ResearchTopicImage
            src={essay.imageUrl}
            alt={essay.title}
            className="w-full h-52 sm:h-64 object-cover"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${theme.badge}`}
            >
              <Star className="w-3 h-3 fill-current" />
              Featured essay
            </span>
          </div>
          {essay.imageCredit ? (
            <p className="absolute bottom-2 left-3 right-12 text-[10px] text-white/80 bg-black/55 px-2 py-1 rounded pointer-events-none">
              {essay.imageCredit}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5 text-sm text-slate-300 leading-relaxed">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.label}`}>
              {essay.categoryLabel}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-tight">{essay.title}</h2>
            <p className="mt-3 text-slate-200 font-medium text-base leading-relaxed">{essay.summary}</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Deep dive</p>
            <div className="mt-3 space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-300">
              {essay.deepDive}
            </div>
          </div>

          {essay.chartBlock ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">At a glance</p>
              <ChartBlock text={essay.chartBlock} />
            </div>
          ) : null}

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Why people explore this</p>
            <p className="mt-1">{essay.whenPeopleExplore}</p>
          </div>

          <div>
            <p className={`text-xs font-black uppercase tracking-widest ${theme.label}`}>
              Common approaches discussed
            </p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              {essay.approaches.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          {essay.videoLinks.length > 0 ? (
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${theme.label} mb-2`}>
                Videos &amp; study links
              </p>
              <ul className="space-y-2">
                {essay.videoLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 hover:border-white/20 transition-colors"
                    >
                      <PlayCircle className={`w-4 h-4 shrink-0 mt-0.5 ${theme.label}`} />
                      <span>
                        <span className="text-white font-semibold">{link.label}</span>
                        {link.description ? (
                          <span className="block text-xs text-slate-500 mt-0.5">{link.description}</span>
                        ) : null}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {relatedPlants.length > 0 && onOpenPlant ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
                Related plants &amp; fungi
              </p>
              <div className="flex flex-wrap gap-2">
                {relatedPlants.map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPlant(plant);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    {plant.commonName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {essay.safetyWarnings.length > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Safety
              </p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-amber-100/90">
                {essay.safetyWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {essay.sources.length > 0 ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Sources</p>
              <ul className="space-y-2">
                {essay.sources.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-emerald-300 hover:text-emerald-200 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {link.label}
                        {link.description ? (
                          <span className="block text-xs text-slate-500 mt-0.5">{link.description}</span>
                        ) : null}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <PostEngagementBar
            target={{ kind: 'essay', essayId: essay.id }}
            user={user ?? null}
            onSignIn={onSignIn ?? (() => {})}
            onAskAi={
              onAskAi
                ? () =>
                    onAskAi({
                      focusTitle: essay.title,
                      contextText: [essay.title, essay.summary, essay.deepDive, essay.whenPeopleExplore, ...essay.approaches].join(
                        '\n',
                      ),
                      essayId: essay.id,
                    })
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

type Props = {
  essay: FeaturedEssay;
  onOpenPlant?: (plant: PlantEntry) => void;
  /** When true, card spans two columns in a 3-col grid */
  spanGrid?: boolean;
  user?: User | null;
  onSignIn?: () => void;
  onAskAi?: (ctx: AskAiContext) => void;
  startOpen?: boolean;
  onDetailClose?: () => void;
};

/** Large featured essay card + detail modal for Living Knowledge pages. */
export default function FeaturedEssayPanel({
  essay,
  onOpenPlant,
  spanGrid = true,
  user,
  onSignIn,
  onAskAi,
  startOpen = false,
  onDetailClose,
}: Props) {
  const [open, setOpen] = useState(startOpen);
  const theme = ACCENT[essay.accent];

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        className={`group relative rounded-2xl border bg-slate-900/70 overflow-hidden cursor-pointer transition-all text-left shadow-lg ${theme.border} ring-1 ${theme.ring} ${
          spanGrid ? 'sm:col-span-2 lg:col-span-2' : ''
        }`}
      >
        <div className="grid sm:grid-cols-2 min-h-[220px]">
          <div className="relative h-48 sm:h-auto overflow-hidden">
            <ResearchTopicImage
              src={essay.imageUrl}
              alt={essay.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-slate-950/40" />
            <span
              className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${theme.badge}`}
            >
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          </div>
          <div className="p-5 sm:p-6 flex flex-col justify-center">
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.label}`}>
              {essay.categoryLabel}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 leading-snug">{essay.title}</h3>
            <p className="text-sm text-slate-400 mt-3 line-clamp-4 leading-relaxed">{essay.summary}</p>
            <p className={`mt-4 text-xs font-bold ${theme.label}`}>Read full essay →</p>
          </div>
        </div>
      </article>

      {open ? (
        <FeaturedEssayDetail
          essay={essay}
          onClose={() => {
            setOpen(false);
            onDetailClose?.();
          }}
          onOpenPlant={onOpenPlant}
          user={user}
          onSignIn={onSignIn}
          onAskAi={onAskAi}
        />
      ) : null}
    </>
  );
}
