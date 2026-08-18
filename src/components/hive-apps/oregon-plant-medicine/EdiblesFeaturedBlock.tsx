import type { User } from 'firebase/auth';
import type { FeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import { SECTION_VIDEOS } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { AskAiContext } from './AskAiBhivePanel';
import LibraryFeaturedHero from './LibraryFeaturedHero';

type Props = {
  edibleCount: number;
  essay: FeaturedEssay | undefined;
  user: User | null;
  onSignIn: () => void;
  onAskAi: (ctx: AskAiContext) => void;
  onOpenPlant: (plant: PlantEntry) => void;
};

/** Wild edibles intro, count, full-width video, and featured essay — above article grids. */
export default function EdiblesFeaturedBlock({
  edibleCount,
  essay,
  user,
  onSignIn,
  onAskAi,
  onOpenPlant,
}: Props) {
  return (
    <section className="mb-8 space-y-4">
      <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 text-sm text-lime-100/90 leading-relaxed">
        <p className="text-xs font-black uppercase tracking-widest text-lime-300 mb-2">
          Wild edible foods &amp; mushrooms
        </p>
        <p>
          Berries, greens, roots, and fungi — each entry includes ID photos, habitat notes, toxic look-alikes, and
          preparation ideas.{' '}
          <strong className="text-white">Never eat a wild plant or mushroom without 100% ID.</strong>
        </p>
      </div>

      <p className="text-xs text-slate-500">
        {edibleCount} edible wild foods &amp; mushrooms
      </p>

      {essay ? (
        <LibraryFeaturedHero
          video={SECTION_VIDEOS.edibles}
          essay={essay}
          videoAccentClass="text-lime-300"
          videoBorderClass="border-lime-500/35"
          onOpenPlant={onOpenPlant}
          user={user}
          onSignIn={onSignIn}
          onAskAi={onAskAi}
        />
      ) : null}
    </section>
  );
}
