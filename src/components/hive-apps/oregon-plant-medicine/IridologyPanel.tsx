import type { User } from 'firebase/auth';
import {
  IRIDOLOGY_CATEGORY_ORDER,
  IRIDOLOGY_LIBRARY,
  matchesIridologyCategory,
} from '../../../lib/oregonPlantMedicine/iridologyLibrary';
import { IRIDOLOGY_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/iridologyTypes';
import { SECTION_VIDEOS } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import IridologyAnalyzePanel from './IridologyAnalyzePanel';
import ResearchLibraryPanel from './ResearchLibraryPanel';
import SectionVideoHero from './SectionVideoHero';

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
    <div className="space-y-8">
      <SectionVideoHero
        video={SECTION_VIDEOS.iridology}
        accentClass={IRIDOLOGY_THEME.videoAccent}
        borderClass={IRIDOLOGY_THEME.videoBorder}
      />

      <IridologyAnalyzePanel user={user} onSignIn={onSignIn} />

      <ResearchLibraryPanel
        library="iridology"
        tabLabel="AI Iridology library"
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
        featuredLayout="none"
        hideChrome
        hideGridEngagement
        sectionTitle="Iridology articles"
      />
    </div>
  );
}
