import type { User } from 'firebase/auth';
import {
  HYPNOSIS_ENERGY_CATEGORY_ORDER,
  HYPNOSIS_ENERGY_LIBRARY,
  matchesHypnosisEnergyCategory,
} from '../../../lib/oregonPlantMedicine/hypnosisEnergyLibrary';
import { HYPNOSIS_ENERGY_CATEGORY_LABELS } from '../../../lib/oregonPlantMedicine/hypnosisEnergyTypes';
import { HYPNOSIS_ENERGY_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import { SECTION_VIDEOS } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import ResearchLibraryPanel from './ResearchLibraryPanel';

const HYPNOSIS_THEME = {
  introBorder: 'border-cyan-500/30',
  introBg: 'bg-cyan-500/10',
  introText: 'text-cyan-100/90',
  introLabel: 'text-cyan-300',
  cardHover: 'hover:border-cyan-500/40',
  categoryLabel: 'text-cyan-400',
  accentButton: 'bg-cyan-600 hover:bg-cyan-500',
  detailBorder: 'border-cyan-500/30',
  sectionLabel: 'text-cyan-400',
  contributeBorder: 'border-cyan-500/40',
  contributeText: 'text-cyan-200',
  communityAccent: 'text-cyan-300',
  searchFocus: 'focus:border-cyan-500/50',
  videoAccent: 'text-cyan-300',
  videoBorder: 'border-cyan-500/35 hover:border-cyan-500/50',
};

type Props = {
  user: User | null;
  onSignIn: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onContribute: (topicTitle?: string) => void;
};

export default function HypnosisEnergyPanel({ user, onSignIn, onOpenPlant, onContribute }: Props) {
  return (
    <ResearchLibraryPanel
      library="hypnosis"
      tabLabel={HYPNOSIS_ENERGY_TAB_LABEL}
      introText={
        <p>
          Past life regression, Edgar Cayce, Dolores Cannon&apos;s QHHT, modern clinical hypnotherapy, Reiki, chakra
          work, tuning forks, singing bowls, and healing frequencies — researched in depth with community contributions.{' '}
          <strong className="text-white">Not therapy or medical care.</strong>
        </p>
      }
      searchPlaceholder="Search regression, Reiki, Solfeggio, QHHT…"
      topics={HYPNOSIS_ENERGY_LIBRARY}
      categoryLabels={HYPNOSIS_ENERGY_CATEGORY_LABELS}
      categoryOrder={HYPNOSIS_ENERGY_CATEGORY_ORDER}
      matchesCategory={matchesHypnosisEnergyCategory}
      theme={HYPNOSIS_THEME}
      user={user}
      onSignIn={onSignIn}
      onOpenPlant={onOpenPlant}
      onContribute={onContribute}
      gridVideo={SECTION_VIDEOS.hypnosis}
    />
  );
}
