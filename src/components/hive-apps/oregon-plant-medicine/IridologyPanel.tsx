import type { User } from 'firebase/auth';
import {
  IRIDOLOGY_CATEGORY_ORDER,
  IRIDOLOGY_LIBRARY,
  matchesIridologyCategory,
} from '../../../lib/oregonPlantMedicine/iridologyLibrary';
import { IRIDOLOGY_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/iridologyTypes';
import { IRIDOLOGY_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import { getFeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import IridologyAnalyzePanel from './IridologyAnalyzePanel';
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

export default function IridologyPanel({
  user,
  onSignIn,
  onOpenPlant,
  onCreatePost,
  onAskAi,
  focusTopicId,
  onFocusTopicConsumed,
}: Props) {
  return (
    <div className="space-y-0">
      <IridologyAnalyzePanel user={user} onSignIn={onSignIn} />
      <ResearchLibraryPanel
        library="iridology"
        tabLabel={IRIDOLOGY_TAB_LABEL}
        introText={
          <p>
            Jensen zone charts, European physical signs, constitutional typing, and integrated methodology — educational
            iridology literature with photo capture guides and safety limits.{' '}
            <strong className="text-white">Not medical diagnosis.</strong>
          </p>
        }
        searchPlaceholder="Search zone chart, lacuna, lymphatic constitution, Jensen, photo tips…"
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
        focusTopicId={focusTopicId}
        onFocusTopicConsumed={onFocusTopicConsumed}
        featuredEssay={getFeaturedEssay('iridology')}
      />
    </div>
  );
}
