import {
  Apple,
  ArrowRight,
  ChevronRight,
  HeartPulse,
  Leaf,
  MessageCircle,
  PawPrint,
  Sparkles,
  Sprout,
  ThumbsUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import { HOLISTIC_LIBRARY } from '../../../lib/oregonPlantMedicine/holisticLibrary';
import { HYPNOSIS_ENERGY_LIBRARY } from '../../../lib/oregonPlantMedicine/hypnosisEnergyLibrary';
import { ANIMAL_HEALTH_LIBRARY } from '../../../lib/oregonPlantMedicine/animalHealthLibrary';
import { SEED_COMMUNITY_POSTS, type SeedCommunityPost } from '../../../lib/oregonPlantMedicine/communitySeedData';
import { SECTION_VIDEOS } from '../../../lib/oregonPlantMedicine/sectionVideos';
import { EARTH_PLANT_MEDICINE_NAME } from '../../../lib/oregonPlantMedicine/branding';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { HolisticTopic } from '../../../lib/oregonPlantMedicine/holisticTypes';
import type { HypnosisEnergyTopic } from '../../../lib/oregonPlantMedicine/hypnosisEnergyTypes';
import type { AnimalHealthTopic } from '../../../lib/oregonPlantMedicine/animalHealthTypes';
import PlantPhoto from './PlantImage';
import ResearchTopicImage from './ResearchTopicImage';
import UserAvatar from './UserAvatar';
import { useAutoplayVideo } from './useAutoplayVideo';
import { useState } from 'react';

type HomeTab =
  | 'community'
  | 'plants'
  | 'edibles'
  | 'holistic'
  | 'hypnosis'
  | 'animal-health';

type Props = {
  onNavigate: (tab: HomeTab) => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onOpenPost: (post: SeedCommunityPost) => void;
};

type SectionTheme = {
  icon: LucideIcon;
  label: string;
  headline: string;
  blurb: string;
  gradient: string;
  border: string;
  accent: string;
  button: string;
  glow: string;
};

const THEMES: Record<HomeTab, SectionTheme> = {
  community: {
    icon: Users,
    label: 'Community',
    headline: 'Real foragers, real finds',
    blurb:
      'Share photos, upvote the best IDs, and learn from harvesters across regions and seasons.',
    gradient: 'from-sky-950/80 via-slate-950/40 to-transparent',
    border: 'border-sky-500/25',
    accent: 'text-sky-300',
    button: 'bg-sky-600 hover:bg-sky-500',
    glow: 'shadow-sky-500/10',
  },
  plants: {
    icon: Sprout,
    label: 'Plant library',
    headline: 'Living field guide',
    blurb:
      'Medicinal herbs, toxic look-alikes, habitat notes, and harvest ethics — curated for the Americas.',
    gradient: 'from-emerald-950/80 via-slate-950/40 to-transparent',
    border: 'border-emerald-500/25',
    accent: 'text-emerald-300',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    glow: 'shadow-emerald-500/10',
  },
  edibles: {
    icon: Apple,
    label: 'Edibles',
    headline: 'Wild foods & mushrooms',
    blurb:
      'Berries, greens, fungi, and roots with three ID photos each — because confidence beats appetite every time.',
    gradient: 'from-lime-950/80 via-slate-950/40 to-transparent',
    border: 'border-lime-500/25',
    accent: 'text-lime-300',
    button: 'bg-lime-600 hover:bg-lime-500',
    glow: 'shadow-lime-500/10',
  },
  holistic: {
    icon: HeartPulse,
    label: 'Holistic protocols',
    headline: 'Holistic materia medica',
    blurb:
      "Devil's club, cascara, reishi, and seasonal tonics — traditions and protocols with safety notes. Not medical advice.",
    gradient: 'from-violet-950/80 via-slate-950/40 to-transparent',
    border: 'border-violet-500/25',
    accent: 'text-violet-300',
    button: 'bg-violet-600 hover:bg-violet-500',
    glow: 'shadow-violet-500/10',
  },
  hypnosis: {
    icon: Sparkles,
    label: 'Hypnosis & energy',
    headline: 'Mind-body research library',
    blurb:
      'Regression, Reiki, Solfeggio frequencies, and clinical hypnotherapy — explored with depth and clear disclaimers.',
    gradient: 'from-cyan-950/80 via-slate-950/40 to-transparent',
    border: 'border-cyan-500/25',
    accent: 'text-cyan-300',
    button: 'bg-cyan-600 hover:bg-cyan-500',
    glow: 'shadow-cyan-500/10',
  },
  'animal-health': {
    icon: PawPrint,
    label: 'Animal health',
    headline: 'Holistic pet & livestock care',
    blurb:
      'Integrative veterinary context for dogs, cats, horses, and herds — nutrition, herbs, and when to call the vet.',
    gradient: 'from-rose-950/80 via-slate-950/40 to-transparent',
    border: 'border-rose-500/25',
    accent: 'text-rose-300',
    button: 'bg-rose-600 hover:bg-rose-500',
    glow: 'shadow-rose-500/10',
  },
};

function plantForTopic(relatedPlantIds: string[]): PlantEntry | undefined {
  for (const id of relatedPlantIds) {
    const hit = PLANT_LIBRARY.find((p) => p.id === id);
    if (hit) return hit;
  }
  return undefined;
}

function SectionHeader({
  theme,
  tab,
  onNavigate,
}: {
  theme: SectionTheme;
  tab: HomeTab;
  onNavigate: (tab: HomeTab) => void;
}) {
  const Icon = theme.icon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
      <div className="max-w-2xl">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.accent} flex items-center gap-2 mb-2`}>
          <Icon className="w-4 h-4" />
          {theme.label}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{theme.headline}</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{theme.blurb}</p>
      </div>
      <button
        type="button"
        onClick={() => onNavigate(tab)}
        className={`inline-flex items-center gap-2 shrink-0 rounded-xl ${theme.button} text-white font-bold text-sm px-5 py-2.5 transition-colors shadow-lg ${theme.glow}`}
      >
        View more
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function HomeHero() {
  const video = SECTION_VIDEOS.home;
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = video.sources[sourceIndex];
  const videoRef = useAutoplayVideo([src ?? '']);

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950 mb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] lg:items-stretch lg:gap-6">
        <div className="px-6 sm:px-10 py-10 sm:py-12 lg:py-14">
          <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300 mb-4">
            <Leaf className="w-4 h-4" />
            {EARTH_PLANT_MEDICINE_NAME}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black text-white leading-[1.1] tracking-tight">
            Forage smarter.
            <span className="block text-emerald-300 mt-1">Heal deeper. Learn together.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-xl">
            A living field guide for wild plants, mushrooms, and holistic research — with community photos,
            regional filters, and libraries you can explore at your own pace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              180+ plants & mushrooms
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1">Regional filters</span>
            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1">Community feed</span>
          </div>
        </div>

        <div className="relative flex items-center px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
          {src ? (
            <video
              ref={videoRef}
              key={src}
              className="w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[360px] rounded-2xl object-cover"
              src={src}
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
              aria-label={video.title}
              onError={() => {
                if (sourceIndex < video.sources.length - 1) setSourceIndex((i) => i + 1);
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
function CommunitySection({
  onNavigate,
  onOpenPost,
}: {
  onNavigate: (tab: HomeTab) => void;
  onOpenPost: (post: SeedCommunityPost) => void;
}) {
  const theme = THEMES.community;
  const posts = [...SEED_COMMUNITY_POSTS].sort((a, b) => b.upvoteCount - a.upvoteCount).slice(0, 3);

  return (
    <section className={`rounded-2xl border ${theme.border} bg-slate-900/40 p-5 sm:p-6 mb-8`}>
      <SectionHeader theme={theme} tab="community" onNavigate={onNavigate} />
      <div className="grid sm:grid-cols-3 gap-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className={`group rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden hover:border-sky-500/40 transition-all hover:-translate-y-0.5 shadow-lg ${theme.glow}`}
          >
            <div className="relative h-36 overflow-hidden">
              {post.imageUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenPost(post)}
                  className="block w-full h-full text-left cursor-pointer"
                  aria-label={`Open post by ${post.authorDisplayName}`}
                >
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-900/40 to-slate-900" />
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} pointer-events-none`} />
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-sky-200 pointer-events-none">
                <ThumbsUp className="w-3 h-3" />
                {post.upvoteCount}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserAvatar url={post.authorAvatarUrl} name={post.authorDisplayName} className="w-7 h-7 rounded-full text-xs" />
                <span className="text-xs font-bold text-white truncate">{post.authorDisplayName}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400/90">{post.plantCommonName}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{post.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlantCardsSection({
  tab,
  plants,
  onNavigate,
  onOpenPlant,
}: {
  tab: 'plants' | 'edibles';
  plants: PlantEntry[];
  onNavigate: (tab: HomeTab) => void;
  onOpenPlant: (plant: PlantEntry) => void;
}) {
  const theme = THEMES[tab];

  return (
    <section className={`rounded-2xl border ${theme.border} bg-slate-900/40 p-5 sm:p-6 mb-8`}>
      <SectionHeader theme={theme} tab={tab} onNavigate={onNavigate} />
      <div className="grid sm:grid-cols-3 gap-4">
        {plants.map((plant) => (
          <button
            key={plant.id}
            type="button"
            onClick={() => onOpenPlant(plant)}
            className={`group rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-left transition-all hover:-translate-y-0.5 shadow-lg ${theme.glow} ${
              tab === 'edibles' ? 'hover:border-lime-500/40' : 'hover:border-emerald-500/40'
            }`}
          >
            <div className="relative h-40 overflow-hidden">
              <PlantPhoto
                src={plant.imageUrl}
                plantId={plant.id}
                scientificName={plant.scientificName}
                alt={plant.commonName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient}`} />
            </div>
            <div className="p-4">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.accent}`}>{plant.scientificName}</p>
              <h3 className="font-bold text-white mt-0.5">{plant.commonName}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plant.habitat}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function HolisticCardsSection({ onNavigate }: { onNavigate: (tab: HomeTab) => void }) {
  const theme = THEMES.holistic;
  const topics = [
    HOLISTIC_LIBRARY.find((t) => t.id === 'devils-club-pnw'),
    HOLISTIC_LIBRARY.find((t) => t.id === 'reishi-pnw'),
    HOLISTIC_LIBRARY.find((t) => t.id === 'california-poppy-nervine'),
  ].filter((t): t is HolisticTopic => !!t);

  return (
    <section className={`rounded-2xl border ${theme.border} bg-slate-900/40 p-5 sm:p-6 mb-8`}>
      <SectionHeader theme={theme} tab="holistic" onNavigate={onNavigate} />
      <div className="grid sm:grid-cols-3 gap-4">
        {topics.map((topic) => {
          const plant = plantForTopic(topic.relatedPlantIds);
          return (
            <article
              key={topic.id}
              className={`group rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden hover:border-violet-500/40 transition-all hover:-translate-y-0.5 shadow-lg ${theme.glow}`}
            >
              <div className="relative h-36 overflow-hidden">
                {plant ? (
                  <PlantPhoto
                    src={plant.imageUrl}
                    plantId={plant.id}
                    scientificName={plant.scientificName}
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/30 to-slate-900">
                    <HeartPulse className="w-10 h-10 text-violet-500/50" />
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient}`} />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white text-sm leading-snug">{topic.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{topic.summary}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ResearchCardsSection<T extends { id: string; title: string; summary: string; imageUrl: string }>({
  tab,
  topics,
  onNavigate,
}: {
  tab: 'hypnosis' | 'animal-health';
  topics: T[];
  onNavigate: (tab: HomeTab) => void;
}) {
  const theme = THEMES[tab];

  return (
    <section className={`rounded-2xl border ${theme.border} bg-slate-900/40 p-5 sm:p-6 mb-8`}>
      <SectionHeader theme={theme} tab={tab} onNavigate={onNavigate} />
      <div className="grid sm:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <article
            key={topic.id}
            className={`group rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all hover:-translate-y-0.5 shadow-lg ${theme.glow} ${
              tab === 'hypnosis' ? 'hover:border-cyan-500/40' : 'hover:border-rose-500/40'
            }`}
          >
            <div className="relative h-36 overflow-hidden">
              <ResearchTopicImage
                src={topic.imageUrl}
                alt={topic.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient}`} />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white text-sm leading-snug">{topic.title}</h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{topic.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function OregonPlantMedicineHome({ onNavigate, onOpenPlant, onOpenPost }: Props) {
  const featuredPlants = ['stinging-nettle', 'oregon-grape', 'yarrow']
    .map((id) => PLANT_LIBRARY.find((p) => p.id === id))
    .filter((p): p is PlantEntry => !!p);

  const featuredEdibles = ['chanterelle', 'morel', 'lions-mane']
    .map((id) => PLANT_LIBRARY.find((p) => p.id === id))
    .filter((p): p is PlantEntry => !!p);

  const hypnosisTopics = HYPNOSIS_ENERGY_LIBRARY.slice(0, 3) as HypnosisEnergyTopic[];
  const animalTopics = ANIMAL_HEALTH_LIBRARY.slice(0, 3) as AnimalHealthTopic[];

  return (
    <div className="pb-8">
      <HomeHero />

      <CommunitySection onNavigate={onNavigate} onOpenPost={onOpenPost} />

      <PlantCardsSection tab="plants" plants={featuredPlants} onNavigate={onNavigate} onOpenPlant={onOpenPlant} />

      <PlantCardsSection tab="edibles" plants={featuredEdibles} onNavigate={onNavigate} onOpenPlant={onOpenPlant} />

      <HolisticCardsSection onNavigate={onNavigate} />

      <ResearchCardsSection tab="hypnosis" topics={hypnosisTopics} onNavigate={onNavigate} />

      <ResearchCardsSection tab="animal-health" topics={animalTopics} onNavigate={onNavigate} />

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-violet-500/10 p-6 sm:p-8 text-center">
        <MessageCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <h2 className="text-xl font-black text-white">Ready to dig in?</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
          Pick a library above or jump straight into the community feed — every section has full depth when you are
          ready.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('community')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 transition-colors"
        >
          Explore community
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
