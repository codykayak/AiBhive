import type { User } from 'firebase/auth';
import {
  ANIMAL_HEALTH_CATEGORY_ORDER,
  ANIMAL_HEALTH_LIBRARY,
  matchesAnimalHealthCategory,
} from '../../../lib/oregonPlantMedicine/animalHealthLibrary';
import { ANIMAL_HEALTH_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/animalHealthTypes';
import { ANIMAL_HEALTH_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import { getFeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import ResearchLibraryPanel from './ResearchLibraryPanel';

const ANIMAL_THEME = {
  introBorder: 'border-rose-500/30',
  introBg: 'bg-rose-500/10',
  introText: 'text-rose-100/90',
  introLabel: 'text-rose-300',
  cardHover: 'hover:border-rose-500/40',
  categoryLabel: 'text-rose-400',
  accentButton: 'bg-rose-600 hover:bg-rose-500',
  detailBorder: 'border-rose-500/30',
  sectionLabel: 'text-rose-400',
  contributeBorder: 'border-rose-500/40',
  contributeText: 'text-rose-200',
  communityAccent: 'text-rose-300',
  searchFocus: 'focus:border-rose-500/50',
  videoAccent: 'text-rose-300',
  videoBorder: 'border-rose-500/35 hover:border-rose-500/50',
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

export default function AnimalHealthPanel({
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
      library="animal-health"
      tabLabel={ANIMAL_HEALTH_TAB_LABEL}
      introText={
        <p>
          Holistic veterinary education for dogs, cats, horses, and livestock — gut health, herbal context, energy work,
          and nutrition debates. Community notes and upvotes like our plant library.{' '}
          <strong className="text-white">Not veterinary advice.</strong>
        </p>
      }
      searchPlaceholder="Search dogs, cats, horses, herbs, CBD, Reiki…"
      topics={ANIMAL_HEALTH_LIBRARY}
      categoryLabels={ANIMAL_HEALTH_CATEGORY_LABELS}
      categoryOrder={ANIMAL_HEALTH_CATEGORY_ORDER}
      matchesCategory={matchesAnimalHealthCategory}
      theme={ANIMAL_THEME}
      user={user}
      onSignIn={onSignIn}
      onOpenPlant={onOpenPlant}
      onCreatePost={onCreatePost}
      onAskAi={onAskAi}
      askScope="animal-health"
      askAccent="rose"
      featuredEssay={getFeaturedEssay('animal-health')}
      focusTopicId={focusTopicId}
      onFocusTopicConsumed={onFocusTopicConsumed}
    />
  );
}
