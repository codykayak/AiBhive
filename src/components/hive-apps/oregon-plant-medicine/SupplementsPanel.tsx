import type { User } from 'firebase/auth';
import {
  SUPPLEMENTS_CATEGORY_ORDER,
  SUPPLEMENTS_LIBRARY,
  matchesSupplementsCategory,
} from '../../../lib/oregonPlantMedicine/supplementsLibrary';
import { SUPPLEMENTS_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/supplementsTypes';
import { SUPPLEMENTS_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import ResearchLibraryPanel from './ResearchLibraryPanel';

const SUPPLEMENTS_THEME = {
  introBorder: 'border-teal-500/30',
  introBg: 'bg-teal-500/10',
  introText: 'text-teal-100/90',
  introLabel: 'text-teal-300',
  cardHover: 'hover:border-teal-500/40',
  categoryLabel: 'text-teal-400',
  accentButton: 'bg-teal-600 hover:bg-teal-500',
  detailBorder: 'border-teal-500/30',
  sectionLabel: 'text-teal-400',
  contributeBorder: 'border-teal-500/40',
  contributeText: 'text-teal-200',
  communityAccent: 'text-teal-300',
  searchFocus: 'focus:border-teal-500/50',
  videoAccent: 'text-teal-300',
  videoBorder: 'border-teal-500/35 hover:border-teal-500/50',
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

export default function SupplementsPanel({
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
      library="supplements"
      tabLabel={SUPPLEMENTS_TAB_LABEL}
      introText={
        <p>
          Vitamins, minerals, omega-3, probiotics, and specialty compounds — what the evidence suggests, typical dosing
          context, drug interactions, and how to read labels. Text-first library (no product photos).{' '}
          <strong className="text-white">Not medical advice — discuss with your clinician.</strong>
        </p>
      }
      searchPlaceholder="Search vitamin D, magnesium, creatine, probiotics, berberine…"
      topics={SUPPLEMENTS_LIBRARY}
      categoryLabels={SUPPLEMENTS_CATEGORY_LABELS}
      categoryOrder={SUPPLEMENTS_CATEGORY_ORDER}
      matchesCategory={matchesSupplementsCategory}
      theme={SUPPLEMENTS_THEME}
      user={user}
      onSignIn={onSignIn}
      onOpenPlant={onOpenPlant}
      onCreatePost={onCreatePost}
      onAskAi={onAskAi}
      askScope="supplements"
      askAccent="teal"
      focusTopicId={focusTopicId}
      onFocusTopicConsumed={onFocusTopicConsumed}
      hideImages
    />
  );
}
