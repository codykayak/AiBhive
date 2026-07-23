import type { User } from 'firebase/auth';
import {
  HERBS_CATEGORY_ORDER,
  HERBS_LIBRARY,
  matchesHerbsCategory,
} from '../../../lib/oregonPlantMedicine/herbsLibrary';
import { HERBS_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/herbsTypes';
import { HERBS_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import ResearchLibraryPanel from './ResearchLibraryPanel';

const HERBS_THEME = {
  introBorder: 'border-amber-500/30',
  introBg: 'bg-amber-500/10',
  introText: 'text-amber-100/90',
  introLabel: 'text-amber-300',
  cardHover: 'hover:border-amber-500/40',
  categoryLabel: 'text-amber-400',
  accentButton: 'bg-amber-600 hover:bg-amber-500',
  detailBorder: 'border-amber-500/30',
  sectionLabel: 'text-amber-400',
  contributeBorder: 'border-amber-500/40',
  contributeText: 'text-amber-200',
  communityAccent: 'text-amber-300',
  searchFocus: 'focus:border-amber-500/50',
  videoAccent: 'text-amber-300',
  videoBorder: 'border-amber-500/35 hover:border-amber-500/50',
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

export default function HerbsPanel({
  user,
  onSignIn,
  onOpenPlant,
  onCreatePost,
  onAskAi,
  focusTopicId,
  onFocusTopicConsumed,
}: Props) {
  return (
    <ResearchLibraryPanel
      library="herbs"
      tabLabel={HERBS_TAB_LABEL}
      introText={
        <p>
          Western herbalism, Chinese medicine (TCM), Ayurveda, and Pacific Northwest materia medica — what each herb is
          traditionally explored for, how it is prepared, and where caution applies. Includes Ren Shen, Huang Qi, Tulsi,
          Triphala, and regional allies like Oregon grape.{' '}
          <strong className="text-white">Not medical advice.</strong>
        </p>
      }
      searchPlaceholder="Search ashwagandha, ginseng, astragalus, reishi, valerian, TCM…"
      topics={HERBS_LIBRARY}
      categoryLabels={HERBS_CATEGORY_LABELS}
      categoryOrder={HERBS_CATEGORY_ORDER}
      matchesCategory={matchesHerbsCategory}
      theme={HERBS_THEME}
      user={user}
      onSignIn={onSignIn}
      onOpenPlant={onOpenPlant}
      onCreatePost={onCreatePost}
      onAskAi={onAskAi}
      askScope="herbs"
      askAccent="amber"
      focusTopicId={focusTopicId}
      onFocusTopicConsumed={onFocusTopicConsumed}
    />
  );
}
