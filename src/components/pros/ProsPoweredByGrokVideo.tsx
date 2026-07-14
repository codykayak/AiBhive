/** Sized to sit beside the Pros trade-packs grid (not full-screen hero). */
const VIDEO_SRC = '/aibhive-diagnose-powered-by-grok-trades.mp4';

type Props = {
  className?: string;
  title?: string;
  subtitle?: string;
};

export default function ProsPoweredByGrokVideo({
  className = '',
  title = 'Powered by Grok & AiBhive AI',
  subtitle = 'Field diagnosis for trades — voice, photo, and chat in the truck.',
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm flex flex-col ${className}`}
    >
      <div className="relative aspect-[4/3] w-full bg-slate-950">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/pros/hero-field-team.png"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20 pointer-events-none" />
      </div>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">{title}</p>
        <p className="text-sm text-slate-300 mt-1 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
