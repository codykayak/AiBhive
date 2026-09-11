import type { User } from 'firebase/auth';
import {
  AUTOIMMUNE_CATEGORY_ORDER,
  AUTOIMMUNE_LIBRARY,
  matchesAutoimmuneCategory,
} from '../../../lib/oregonPlantMedicine/autoimmuneLibrary';
import { AUTOIMMUNE_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/autoimmuneTypes';
import { AUTOIMMUNE_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import { getFeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import ResearchLibraryPanel from './ResearchLibraryPanel';

const AUTOIMMUNE_THEME = {
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

export default function AutoimmunePanel({
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
      library="autoimmune"
      tabLabel={AUTOIMMUNE_TAB_LABEL}
      introText={
        <p>
          Hashimoto&apos;s, RA, lupus, MS, IBD, celiac, psoriasis, and dozens more — explored through gut terrain,
          mitochondria, morning sunlight, circadian biology (including Jack Kruse frameworks), EMF reduction, TCM,
          Ayurveda, Kampō, AIP, and plant allies. Under-researched remission paths and funding gaps included so you can
          ask better questions of your care team.{' '}
          <strong className="text-white">Not medical advice — work with specialists.</strong>
        </p>
      }
      searchPlaceholder="Search Hashimoto's, mitochondria, AIP, EMF, leaky gut, boswellia, Wahls…"
      topics={AUTOIMMUNE_LIBRARY}
      categoryLabels={AUTOIMMUNE_CATEGORY_LABELS}
      categoryOrder={AUTOIMMUNE_CATEGORY_ORDER}
      matchesCategory={matchesAutoimmuneCategory}
      theme={AUTOIMMUNE_THEME}
      user={user}
      onSignIn={onSignIn}
      onOpenPlant={onOpenPlant}
      onCreatePost={onCreatePost}
      onAskAi={onAskAi}
      askScope="autoimmune"
      askAccent="rose"
      featuredEssay={getFeaturedEssay('autoimmune')}
      featuredFirst
      focusTopicId={focusTopicId}
      onFocusTopicConsumed={onFocusTopicConsumed}
    />
  );
}
