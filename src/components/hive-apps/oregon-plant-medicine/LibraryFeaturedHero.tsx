import { useState } from 'react';
import { Film, Star } from 'lucide-react';
import type { FeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { SectionVideo } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { User } from 'firebase/auth';
import type { AskAiContext } from './AskAiBhivePanel';
import FeaturedEssayPanel from './FeaturedEssayPanel';
import { useAutoplayVideo } from './useAutoplayVideo';

const ESSAY_CHROME: Record<FeaturedEssay['accent'], { border: string; label: string; link: string }> = {
  emerald: {
    border: 'border-emerald-500/30 bg-emerald-500/5',
    label: 'text-emerald-300',
    link: 'text-emerald-300 hover:text-emerald-200',
  },
  violet: {
    border: 'border-violet-500/30 bg-violet-500/5',
    label: 'text-violet-300',
    link: 'text-violet-300 hover:text-violet-200',
  },
  cyan: {
    border: 'border-cyan-500/30 bg-cyan-500/5',
    label: 'text-cyan-300',
    link: 'text-cyan-300 hover:text-cyan-200',
  },
  lime: {
    border: 'border-lime-500/30 bg-lime-500/5',
    label: 'text-lime-300',
    link: 'text-lime-300 hover:text-lime-200',
  },
  amber: {
    border: 'border-amber-500/30 bg-amber-500/5',
    label: 'text-amber-300',
    link: 'text-amber-300 hover:text-amber-200',
  },
  rose: {
    border: 'border-rose-500/30 bg-rose-500/5',
    label: 'text-rose-300',
    link: 'text-rose-300 hover:text-rose-200',
  },
};

type Props = {
  video: SectionVideo;
  essay: FeaturedEssay;
  videoAccentClass?: string;
  videoBorderClass?: string;
  onOpenPlant?: (plant: PlantEntry) => void;
  user?: User | null;
  onSignIn?: () => void;
  onAskAi?: (ctx: AskAiContext) => void;
};

/** Full-width featured video with essay preview text below — sits above library tile grids. */
export default function LibraryFeaturedHero({
  video,
  essay,
  videoAccentClass = 'text-indigo-300',
  videoBorderClass = 'border-indigo-500/35',
  onOpenPlant,
  user,
  onSignIn,
  onAskAi,
}: Props) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = video.sources[sourceIndex];
  const videoRef = useAutoplayVideo([src]);
  const [essayOpen, setEssayOpen] = useState(false);
  const chrome = ESSAY_CHROME[essay.accent];

  const tryNextSource = () => {
    if (sourceIndex < video.sources.length - 1) {
      setSourceIndex((i) => i + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <section className="mb-6 space-y-0">
      <article
        className={`rounded-2xl border ${videoBorderClass} bg-slate-900/70 overflow-hidden shadow-lg`}
      >
        <div className="relative w-full aspect-video min-h-[200px] sm:min-h-[280px] lg:min-h-[360px] bg-black">
          {failed || !src ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
              <Film className="w-12 h-12 opacity-50" />
              <p className="text-sm font-bold text-slate-400">{video.title}</p>
              <p className="text-xs max-w-md">
                Add <code className="text-indigo-300">ai-iridology-aibhive.webm</code> and{' '}
                <code className="text-indigo-300">.mp4</code> to{' '}
                <code className="text-indigo-300">public/oregon-plant-medicine/</code>
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              key={src}
              className="absolute inset-0 w-full h-full object-cover"
              src={src}
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
              title={`${video.title} — ${video.page}`}
              aria-label={`${video.title} — ${video.page}`}
              onError={tryNextSource}
            />
          )}
        </div>
        <div className="p-5 sm:p-6 border-t border-white/10">
          <p className={`text-[10px] font-black uppercase tracking-widest ${videoAccentClass}`}>
            Featured video · {video.page}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 leading-snug">{video.title}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-3xl">{video.caption}</p>
        </div>
      </article>

      <div className={`mt-4 rounded-2xl border ${chrome.border} p-5 sm:p-6`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${chrome.label} flex items-center gap-1.5`}>
          <Star className="w-3 h-3 fill-current" />
          {essay.categoryLabel}
        </p>
        <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-snug">{essay.title}</h3>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-3xl">{essay.summary}</p>
        <button
          type="button"
          onClick={() => setEssayOpen(true)}
          className={`mt-4 text-sm font-bold ${chrome.link}`}
        >
          Read full article →
        </button>
      </div>

      {essayOpen ? (
        <FeaturedEssayPanel
          essay={essay}
          onOpenPlant={onOpenPlant}
          user={user}
          onSignIn={onSignIn}
          onAskAi={onAskAi}
          spanGrid={false}
          hideCard
          startOpen
          onDetailClose={() => setEssayOpen(false)}
        />
      ) : null}
    </section>
  );
}
