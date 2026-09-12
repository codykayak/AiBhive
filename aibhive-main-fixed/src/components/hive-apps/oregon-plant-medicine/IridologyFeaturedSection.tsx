import { useState } from 'react';
import { Film, Star } from 'lucide-react';
import type { FeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { SectionVideo } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { User } from 'firebase/auth';
import { useAutoplayVideo } from './useAutoplayVideo';
import type { AskAiContext } from './AskAiBhivePanel';
import FeaturedEssayPanel from './FeaturedEssayPanel';

const ACCENT = {
  violet: {
    border: 'border-violet-500/40',
    badge: 'bg-violet-500/20 text-violet-200 border-violet-400/40',
    label: 'text-violet-300',
    link: 'text-violet-300 hover:text-violet-200',
  },
} as const;

type Props = {
  video: SectionVideo;
  essay?: FeaturedEssay;
  /** When true, show only the hero video block (no featured article card below it). */
  videoOnly?: boolean;
  onOpenPlant?: (plant: PlantEntry) => void;
  user?: User | null;
  onSignIn?: () => void;
  onAskAi?: (ctx: AskAiContext) => void;
};

/** Full-width featured video plus optional featured article summary preview (iridology landing). */
export default function IridologyFeaturedSection({
  video,
  essay,
  videoOnly = false,
  onOpenPlant,
  user,
  onSignIn,
  onAskAi,
}: Props) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const src = video.sources[sourceIndex];
  const videoRef = useAutoplayVideo([src]);
  const theme = ACCENT.violet;

  const tryNextSource = () => {
    if (sourceIndex < video.sources.length - 1) {
      setSourceIndex((i) => i + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <section className="mb-6 space-y-0">
      <article className={`rounded-2xl border ${theme.border} bg-slate-900/70 overflow-hidden shadow-lg`}>
        <div className="relative w-full aspect-video min-h-[200px] sm:min-h-[280px] lg:min-h-[360px] bg-black">
          {failed || !src ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
              <Film className="w-12 h-12 opacity-50" />
              <p className="text-sm font-bold text-slate-400">{video.title}</p>
              <p className="text-xs max-w-md">
                Place <code className="text-violet-300">ai-iridology-aibhive.mp4</code> in{' '}
                <code className="text-violet-300">aibhive-plants/</code> or{' '}
                <code className="text-violet-300">public/oregon-plant-medicine/</code> — deploy copies it
                automatically.
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
              controls
              preload="auto"
              title={`${video.title} — ${video.page}`}
              aria-label={`${video.title} — ${video.page}`}
              onError={tryNextSource}
            />
          )}
        </div>
        <div className="p-5 sm:p-6 border-t border-white/10">
          <p className={`text-[10px] font-black uppercase tracking-widest ${theme.label}`}>
            Featured video · {video.page}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 leading-snug">{video.title}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-3xl">{video.caption}</p>
        </div>
      </article>

      {!videoOnly && essay ? (
        <div className={`mt-4 rounded-2xl border ${theme.border} p-5 sm:p-6`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${theme.label} flex items-center gap-1.5`}>
            <Star className="w-3 h-3 fill-current" />
            {essay.categoryLabel}
          </p>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-snug">{essay.title}</h3>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-3xl">{essay.summary}</p>
          <button
            type="button"
            onClick={() => setArticleOpen(true)}
            className={`mt-4 text-sm font-bold ${theme.link}`}
          >
            Read full article →
          </button>
        </div>
      ) : null}

      {!videoOnly && essay && articleOpen ? (
        <FeaturedEssayPanel
          essay={essay}
          onOpenPlant={onOpenPlant}
          user={user}
          onSignIn={onSignIn}
          onAskAi={onAskAi}
          spanGrid={false}
          hideCard
          startOpen
          onDetailClose={() => setArticleOpen(false)}
        />
      ) : null}
    </section>
  );
}
