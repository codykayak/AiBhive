import type { ReactNode } from 'react';

const MP4 = '/plant-medicine-foraging-aibhive.mp4';
const WEBM = '/plant-medicine-foraging-aibhive.webm';

type Props = {
  compact?: boolean;
  actions?: ReactNode;
};

export default function OregonPlantMedicineHero({ compact = false, actions }: Props) {
  return (
    <section
      className={`relative overflow-hidden ${
        compact ? 'min-h-[200px] max-h-[240px]' : 'min-h-[min(52vh,480px)] sm:min-h-[min(58vh,520px)]'
      }`}
      aria-label="Oregon Plant Medicine"
    >
      <div className="absolute inset-0" aria-hidden>
        <video
          className="absolute inset-0 w-full h-[115%] object-cover object-center"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={WEBM} type="video/webm" />
          <source src={MP4} type="video/mp4" />
        </video>
        <div
          className={`absolute inset-0 ${
            compact
              ? 'bg-gradient-to-r from-slate-950/92 via-emerald-950/75 to-slate-950/88'
              : 'bg-gradient-to-b from-slate-950/55 via-emerald-950/45 to-slate-950/90'
          }`}
        />
      </div>

      <div
        className={`relative z-10 flex h-full flex-col justify-end ${
          compact ? 'px-4 py-4' : 'px-4 sm:px-8 py-8 sm:py-10'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-emerald-300/90">
              Private library · Eugene &amp; Florence
            </p>
            <h1
              className={`font-black text-white tracking-tight ${
                compact ? 'text-xl mt-1' : 'text-3xl sm:text-4xl lg:text-5xl mt-2'
              }`}
            >
              Oregon Plant Medicine
            </h1>
            {!compact ? (
              <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-200/90 leading-relaxed">
                Edible, medicinal, and hallucinogenic plants of the Oregon coast and Willamette Valley — holistic
                reference with multi-photo ID, PDF guides, and community field notes.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-300/90 line-clamp-2">
                Wild plants of Eugene &amp; Florence — ID photos, guides, and community notes.
              </p>
            )}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
