import { useState } from 'react';
import { Film } from 'lucide-react';
import type { SectionVideo } from '../../../lib/oregonPlantMedicine/sectionVideos';
import { useAutoplayVideo } from './useAutoplayVideo';

type Props = {
  video: SectionVideo;
  accentClass?: string;
  borderClass?: string;
};

/** Full-width section video — first block on library pages (no essay). */
export default function SectionVideoHero({
  video,
  accentClass = 'text-indigo-300',
  borderClass = 'border-indigo-500/35',
}: Props) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = video.sources[sourceIndex];
  const videoRef = useAutoplayVideo([src]);

  const tryNextSource = () => {
    if (sourceIndex < video.sources.length - 1) {
      setSourceIndex((i) => i + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <section className="mb-6">
      <article
        className={`rounded-2xl border ${borderClass} bg-slate-900/70 overflow-hidden shadow-lg`}
      >
        <div className="relative w-full aspect-video min-h-[200px] sm:min-h-[280px] lg:min-h-[360px] bg-black">
          {failed || !src ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
              <Film className="w-12 h-12 opacity-50" />
              <p className="text-sm font-bold text-slate-400">{video.title}</p>
              <p className="text-xs max-w-lg text-slate-500">
                Place <strong className="text-slate-300">ai-iridology-aibhive.mp4</strong> in{' '}
                <code className="text-indigo-300">aibhive-plants/</code> or{' '}
                <code className="text-indigo-300">public/oregon-plant-medicine/</code> — deploy copies it automatically.
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
          <p className={`text-[10px] font-black uppercase tracking-widest ${accentClass}`}>
            Featured video · {video.page}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 leading-snug">{video.title}</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">{video.caption}</p>
        </div>
      </article>
    </section>
  );
}
