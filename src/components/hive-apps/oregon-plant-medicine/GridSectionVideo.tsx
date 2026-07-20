import { useState } from 'react';
import { Film } from 'lucide-react';
import type { SectionVideo } from '../../../lib/oregonPlantMedicine/sectionVideos';

type Props = {
  video: SectionVideo;
  accentClass?: string;
  borderClass?: string;
};

/** Large in-grid video tile (~four standard cards on lg). */
export default function GridSectionVideo({
  video,
  accentClass = 'text-emerald-300',
  borderClass = 'border-emerald-500/35 hover:border-emerald-500/50',
}: Props) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = video.sources[sourceIndex];

  const tryNextSource = () => {
    if (sourceIndex < video.sources.length - 1) {
      setSourceIndex((i) => i + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <article
      className={`group rounded-xl border bg-slate-900/70 overflow-hidden sm:col-span-2 lg:col-span-2 lg:row-span-2 flex flex-col ${borderClass} transition-colors`}
    >
      <div className="relative flex-1 min-h-[220px] sm:min-h-[260px] lg:min-h-[320px] bg-black">
        {failed || !src ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-4 text-center">
            <Film className="w-10 h-10 opacity-50" />
            <p className="text-xs">Video coming soon — {video.page}</p>
          </div>
        ) : (
          <video
            key={src}
            className="absolute inset-0 w-full h-full object-cover"
            src={src}
            muted
            loop
            playsInline
            controls
            preload="metadata"
            title={`${video.title} — ${video.page}`}
            onError={tryNextSource}
          />
        )}
      </div>
      <div className="p-4 border-t border-white/10">
        <p className={`text-[10px] font-black uppercase tracking-widest ${accentClass}`}>Featured video · {video.page}</p>
        <h3 className="font-bold text-white mt-1 leading-snug">{video.title}</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{video.caption}</p>
      </div>
    </article>
  );
}
