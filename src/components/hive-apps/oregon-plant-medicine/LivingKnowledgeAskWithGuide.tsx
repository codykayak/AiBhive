import type { ReactNode } from 'react';
import { PLANT_ASK_GUIDE_IMAGE } from '../../../lib/oregonPlantMedicine/branding';

type Accent = 'emerald' | 'lime';

const BORDER: Record<Accent, string> = {
  emerald: 'border-emerald-500/25 shadow-emerald-950/40',
  lime: 'border-lime-500/25 shadow-lime-950/40',
};

type Props = {
  accent?: Accent;
  intro?: ReactNode;
  askAgent: ReactNode;
  filters?: ReactNode;
  className?: string;
};

/** Field guide intro + Ask AI + optional filters on the left; guide image on the right (lg+). */
export default function LivingKnowledgeAskWithGuide({
  accent = 'emerald',
  intro,
  askAgent,
  filters,
  className = 'mb-5',
}: Props) {
  const border = BORDER[accent];

  return (
    <div className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start ${className}`}>
      <div className="space-y-4 min-w-0">
        {intro}
        {askAgent}
        {filters}
      </div>

      <div className="hidden lg:block sticky top-24">
        <img
          src={PLANT_ASK_GUIDE_IMAGE}
          alt="Edible plant identification and Ask AI field guide"
          className={`w-full rounded-2xl border shadow-xl object-cover ${border}`}
          loading="lazy"
        />
      </div>

      <img
        src={PLANT_ASK_GUIDE_IMAGE}
        alt=""
        aria-hidden
        className={`lg:hidden w-full max-w-sm mx-auto rounded-2xl border object-cover ${border}`}
        loading="lazy"
      />
    </div>
  );
}
