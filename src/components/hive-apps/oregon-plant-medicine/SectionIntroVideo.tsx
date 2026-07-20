import type { SectionVideo } from '../../../lib/oregonPlantMedicine/sectionVideos';

type Props = {
  video: SectionVideo;
  className?: string;
};

/** Compact muted loop with controls — sits top-right of section intro cards. */
export default function SectionIntroVideo({ video, className = '' }: Props) {
  return (
    <figure
      className={`shrink-0 w-full sm:w-44 lg:w-52 rounded-lg overflow-hidden border border-white/15 bg-black/50 shadow-lg ${className}`}
    >
      <video
        className="w-full aspect-video object-cover bg-black"
        src={video.src}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        title={`${video.title} — ${video.page}`}
      />
      <figcaption className="px-2 py-1.5 bg-black/70 text-[10px] leading-snug">
        <p className="font-bold text-white/90 truncate">{video.title}</p>
        <p className="text-slate-400 mt-0.5 line-clamp-2">{video.caption}</p>
      </figcaption>
    </figure>
  );
}
