import type { User } from 'firebase/auth';
import { SECTION_VIDEOS } from '../../../lib/oregonPlantMedicine/sectionVideos';
import { IRIDOLOGY_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import { getFeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import {
  IRIDOLOGY_LIBRARY,
  matchesIridologyCategory,
} from '../../../lib/oregonPlantMedicine/iridologyLibrary';
import { IRIDOLOGY_CATEGORY_LABELS, IRIDOLOGY_CATEGORY_ORDER } from '../../../lib/oregonPlantMedicine/iridologyTypes';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import IridologyFeaturedSection from './IridologyFeaturedSection';
import IridologyScanPanel from './IridologyScanPanel';
import ResearchLibraryPanel from './ResearchLibraryPanel';

const IRIDOLOGY_THEME = {
  introBorder: 'border-indigo-500/30',
  introBg: 'bg-indigo-500/10',
  introText: 'text-indigo-100/90',
  introLabel: 'text-indigo-300',
  cardHover: 'hover:border-indigo-500/40',
  categoryLabel: 'text-indigo-400',
  accentButton: 'bg-indigo-600 hover:bg-indigo-500',
  detailBorder: 'border-indigo-500/30',
  sectionLabel: 'text-indigo-400',
  contributeBorder: 'border-indigo-500/40',
  contributeText: 'text-indigo-200',
  communityAccent: 'text-indigo-300',
  searchFocus: 'focus:border-indigo-500/50',
  videoAccent: 'text-indigo-300',
  videoBorder: 'border-indigo-500/35 hover:border-indigo-500/50',
};

type Props = {
  user: User | null;
  onSignIn: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onCreatePost: () => void;
  onAskAi: (ctx: AskAiContext) => void;
  focusTopicId?: string | null;
  onFocusTopicConsumed?: () => void;
};

/** AI Iridology — hero video, iris upload scanner, then topic library grid (same pattern as other Plants tabs). */
export default function IridologyPanel({
  user,
  onSignIn,
  onOpenPlant,
  onCreatePost,
  onAskAi,
  focusTopicId,
  onFocusTopicConsumed,
}: Props) {
  const featuredEssay = getFeaturedEssay('iridology');
  const video = SECTION_VIDEOS.iridology;

  return (
    <div className="space-y-6">
      <IridologyFeaturedSection
        video={video}
        videoOnly
        onOpenPlant={onOpenPlant}
        user={user}
        onSignIn={onSignIn}
        onAskAi={onAskAi}
      />

      <IridologyScanPanel user={user} onSignIn={onSignIn} />

      <ResearchLibraryPanel
        library="iridology"
        tabLabel={IRIDOLOGY_TAB_LABEL}
        introText={
          <p>
            Iridology library — integrated methodology, Jensen zones, European physical signs,
            constitutional typing, photo capture, and when the globe itself needs an eye doctor. Clear
            photos map constitution, tissue quality, and organ-zone emphasis from the classical charts.
          </p>
        }
        searchPlaceholder="Search Jensen zones, lacunae, constitutional types, photo tips, safety…"
        topics={IRIDOLOGY_LIBRARY}
        categoryLabels={IRIDOLOGY_CATEGORY_LABELS}
        categoryOrder={IRIDOLOGY_CATEGORY_ORDER}
        matchesCategory={matchesIridologyCategory}
        theme={IRIDOLOGY_THEME}
        user={user}
        onSignIn={onSignIn}
        onOpenPlant={onOpenPlant}
        onCreatePost={onCreatePost}
        onAskAi={onAskAi}
        askScope="iridology"
        askAccent="violet"
        featuredEssay={featuredEssay}
        featuredFirst
        controlsAtBottom
        focusTopicId={focusTopicId}
        onFocusTopicConsumed={onFocusTopicConsumed}
      />
    </div>
  );
}
