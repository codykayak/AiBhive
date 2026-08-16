import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  FlaskConical,
  HeartPulse,
  Leaf,
  LogOut,
  MapPin,
  Sparkles,
  Sprout,
  Star,
  Eye,
  Home,
  User as UserIcon,
  X,
  PlusCircle,
  PawPrint,
  Users,
} from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import {
  PLANT_LIBRARY,
  matchesRegion,
  regionLabel,
  REGION_FILTER_OPTIONS,
  type RegionFilter,
} from '../../lib/oregonPlantMedicine/plantLibrary';
import type { PlantEntry, PlantImage, PlantUse } from '../../lib/oregonPlantMedicine/types';
import { getPdfGuidesForPlant } from '../../lib/oregonPlantMedicine/guidePdfs';
import { fetchMyProfile, type PlantMedicineProfile } from '../../lib/oregonPlantMedicine/plantMedicineApi';
import PlantCommunityPanel from './oregon-plant-medicine/PlantCommunityPanel';
import AskAiBhivePanel, { type AskAiContext } from './oregon-plant-medicine/AskAiBhivePanel';
import PostEngagementBar from './oregon-plant-medicine/PostEngagementBar';
import LivingKnowledgeSiteSearch from './oregon-plant-medicine/LivingKnowledgeSiteSearch';
import CreateCommunityPostModal from './oregon-plant-medicine/CreateCommunityPostModal';
import RegionalOfflinePackButton from './oregon-plant-medicine/RegionalOfflinePackButton';
import OregonPlantMedicineHero from './oregon-plant-medicine/OregonPlantMedicineHero';
import ContributeModal from './oregon-plant-medicine/ContributeModal';
import LocationOnboardingModal from './oregon-plant-medicine/LocationOnboardingModal';
import ProfileModal from './oregon-plant-medicine/ProfileModal';
import PlantPhoto from './oregon-plant-medicine/PlantImage';
import FullscreenImageViewer from './oregon-plant-medicine/FullscreenImageViewer';
import UserAvatar from './oregon-plant-medicine/UserAvatar';
import HolisticRemediesPanel from './oregon-plant-medicine/HolisticRemediesPanel';
import HolisticDisclaimerModal from './oregon-plant-medicine/HolisticDisclaimerModal';
import HypnosisEnergyPanel from './oregon-plant-medicine/HypnosisEnergyPanel';
import HypnosisEnergyDisclaimerModal from './oregon-plant-medicine/HypnosisEnergyDisclaimerModal';
import AnimalHealthPanel from './oregon-plant-medicine/AnimalHealthPanel';
import HerbsPanel from './oregon-plant-medicine/HerbsPanel';
import SupplementsPanel from './oregon-plant-medicine/SupplementsPanel';
import IridologyPanel from './oregon-plant-medicine/IridologyPanel';
import AnimalHealthDisclaimerModal from './oregon-plant-medicine/AnimalHealthDisclaimerModal';
import HerbsDisclaimerModal from './oregon-plant-medicine/HerbsDisclaimerModal';
import SupplementsDisclaimerModal from './oregon-plant-medicine/SupplementsDisclaimerModal';
import IridologyDisclaimerModal from './oregon-plant-medicine/IridologyDisclaimerModal';
import FieldGuidePanel from './oregon-plant-medicine/FieldGuidePanel';
import ResourcesPanel from './oregon-plant-medicine/ResourcesPanel';
import LivingKnowledgeFooter, { type FooterView } from './oregon-plant-medicine/LivingKnowledgeFooter';
import LivingKnowledgeAppBar from './oregon-plant-medicine/LivingKnowledgeAppBar';
import LibraryFeaturedHero from './oregon-plant-medicine/LibraryFeaturedHero';
import CommunityFeedPanel from './oregon-plant-medicine/CommunityFeedPanel';
import CommunityPostModal, { type CommunityPostView } from './oregon-plant-medicine/CommunityPostModal';
import OregonPlantMedicineHome from './oregon-plant-medicine/OregonPlantMedicineHome';
import { SECTION_VIDEOS } from '../../lib/oregonPlantMedicine/sectionVideos';
import { getFeaturedEssay, getFeaturedEssayById } from '../../lib/oregonPlantMedicine/featuredEssays';
import type { SiteSearchResult } from '../../lib/oregonPlantMedicine/siteSearch';
import type { TopicLibraryId } from '../../lib/oregonPlantMedicine/plantMedicineApi';
import FeaturedEssayPanel from './oregon-plant-medicine/FeaturedEssayPanel';
import HolisticAskAgent from './oregon-plant-medicine/HolisticAskAgent';
import LivingKnowledgeAskWithGuide from './oregon-plant-medicine/LivingKnowledgeAskWithGuide';
import LivingKnowledgeThemeToggle from './oregon-plant-medicine/LivingKnowledgeThemeToggle';
import LivingKnowledgeAskFab from './oregon-plant-medicine/LivingKnowledgeAskFab';
import {
  LivingKnowledgeThemeProvider,
  useLivingKnowledgeTheme,
} from './oregon-plant-medicine/LivingKnowledgeThemeContext';
import {
  LIVING_KNOWLEDGE_OPEN_ASK_EVENT,
  livingKnowledgeScopeForTab,
} from '../../lib/oregonPlantMedicine/livingKnowledgeAsk';
import './oregon-plant-medicine/livingKnowledgeTheme.css';
import {
  EARTH_PLANT_MEDICINE_NAME,
  HOLISTIC_REMEDIES_PATH,
  HOLISTIC_TAB_SHORT_LABEL,
  HYPNOSIS_ENERGY_PATH,
  HYPNOSIS_ENERGY_TAB_SHORT_LABEL,
  ANIMAL_HEALTH_PATH,
  ANIMAL_HEALTH_TAB_SHORT_LABEL,
  HERBS_PATH,
  HERBS_TAB_SHORT_LABEL,
  SUPPLEMENTS_PATH,
  SUPPLEMENTS_TAB_SHORT_LABEL,
  IRIDOLOGY_PATH,
  IRIDOLOGY_TAB_SHORT_LABEL,
  STATE_CONTRIBUTION_USD,
} from '../../lib/oregonPlantMedicine/branding';
import { hasAcceptedHolisticDisclaimer } from '../../lib/oregonPlantMedicine/holisticDisclaimer';
import { hasAcceptedHypnosisEnergyDisclaimer } from '../../lib/oregonPlantMedicine/hypnosisEnergyDisclaimer';
import { hasAcceptedAnimalHealthDisclaimer } from '../../lib/oregonPlantMedicine/animalHealthDisclaimer';
import { hasAcceptedHerbsDisclaimer } from '../../lib/oregonPlantMedicine/herbsDisclaimer';
import { hasAcceptedSupplementsDisclaimer } from '../../lib/oregonPlantMedicine/supplementsDisclaimer';
import { hasAcceptedIridologyDisclaimer } from '../../lib/oregonPlantMedicine/iridologyDisclaimer';
import {
  isSupportedLocation,
  locationLabel,
  subRegionLabel,
  type UserLocation,
} from '../../lib/oregonPlantMedicine/regions';
import { loadUserLocation, saveUserLocation } from '../../lib/oregonPlantMedicine/userLocation';

type Props = { expanded?: boolean; initialTab?: Tab };

type Tab = 'home' | 'community' | 'plants' | 'holistic' | 'hypnosis' | 'animal-health' | 'herbs' | 'supplements' | 'iridology' | 'guide' | 'resources';
type UseFilter = 'all' | PlantUse;

function tabAskAccent(tab: Tab): 'emerald' | 'violet' | 'cyan' | 'rose' | 'amber' | 'teal' {
  switch (tab) {
    case 'holistic':
      return 'violet';
    case 'hypnosis':
      return 'cyan';
    case 'animal-health':
      return 'rose';
    case 'herbs':
      return 'amber';
    case 'supplements':
      return 'teal';
    case 'iridology':
      return 'violet';
    default:
      return 'emerald';
  }
}

const TAB_PAGE_LABELS: Record<Tab, string> = {
  home: 'Home',
  community: 'Community',
  plants: 'Plants & foraging',
  herbs: 'Herbs',
  supplements: 'Supplements',
  iridology: 'AI Iridology',
  holistic: 'Holistic protocols',
  hypnosis: 'Hypnosis & energy',
  'animal-health': 'Animal health',
  guide: 'Field guide',
  resources: 'Resources',
};

const NAV_GROUPS = [
  {
    id: 'browse',
    label: 'Browse',
    items: [
      ['home', 'Home', Home],
      ['community', 'Community', Users],
      ['plants', 'Plants', Sprout],
    ],
  },
  {
    id: 'libraries',
    label: 'Libraries',
    items: [
      ['herbs', HERBS_TAB_SHORT_LABEL, Leaf],
      ['supplements', SUPPLEMENTS_TAB_SHORT_LABEL, FlaskConical],
      ['iridology', IRIDOLOGY_TAB_SHORT_LABEL, Eye],
      ['holistic', HOLISTIC_TAB_SHORT_LABEL, HeartPulse],
      ['hypnosis', HYPNOSIS_ENERGY_TAB_SHORT_LABEL, Sparkles],
      ['animal-health', ANIMAL_HEALTH_TAB_SHORT_LABEL, PawPrint],
    ],
  },
] as const;

function isResearchNavTab(id: string) {
  return id === 'holistic' || id === 'hypnosis' || id === 'animal-health' || id === 'herbs' || id === 'supplements' || id === 'iridology';
}

function navTabShortLabel(id: string, label: string) {
  if (id === 'animal-health') return 'Animals';
  if (id === 'supplements') return 'Supps';
  return label.split(' ')[0];
}

const FAVORITES_KEY = 'oregon_plant_medicine_favorites';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
}

function useLabel(u: PlantUse): string {
  if (u === 'both') return 'Edible & Medicinal';
  if (u === 'edible') return 'Edible';
  if (u === 'medicinal') return 'Medicinal';
  return 'Hallucinogenic';
}

function useBadgeClass(u: PlantUse): string {
  if (u === 'both') return 'bg-emerald-500/20 text-emerald-300';
  if (u === 'edible') return 'bg-lime-500/20 text-lime-300';
  if (u === 'medicinal') return 'bg-teal-500/20 text-teal-300';
  return 'bg-violet-500/20 text-violet-300';
}

function allImages(plant: PlantEntry): PlantImage[] {
  return [
    { url: plant.imageUrl, credit: plant.imageCredit, caption: 'Primary ID photo' },
    ...plant.additionalImages,
  ];
}

function DetailSection({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</p>
      <p className="text-sm text-slate-300 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function ImageGallery({
  images,
  name,
  scientificName,
}: {
  images: PlantImage[];
  name: string;
  scientificName: string;
}) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const current = images[active] ?? images[0];
  if (!current) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="block w-full text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label={`View full size photo of ${name}`}
      >
        <PlantPhoto
          src={current.url}
          scientificName={scientificName}
          alt={`${name} — ${current.caption ?? 'identification photo'}`}
          className="w-full h-48 sm:h-56 object-cover pointer-events-none"
        />
      </button>
      <p className="absolute bottom-2 left-3 right-3 text-[10px] text-white/80 bg-black/50 px-2 py-1 rounded pointer-events-none z-[1]">
        {current.caption ? `${current.caption} · ` : ''}
        {current.credit}
        <span className="opacity-75"> · Tap image for full screen</span>
      </p>
      {images.length > 1 ? (
        <div className="flex gap-2 p-3 bg-slate-900/80 overflow-x-auto border-t border-white/5">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? 'border-emerald-400' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <PlantPhoto
                src={img.url}
                scientificName={scientificName}
                alt=""
                className="w-20 h-14 object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {fullscreen ? (
        <FullscreenImageViewer
          src={current.url}
          scientificName={scientificName}
          alt={name}
          caption={current.caption}
          credit={current.credit}
          onClose={() => setFullscreen(false)}
        />
      ) : null}
    </>
  );
}

function PlantDetail({
  plant,
  onClose,
  user,
  onSignIn,
  onAskAi,
}: {
  plant: PlantEntry;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  onAskAi: () => void;
}) {
  const images = allImages(plant);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-950 border border-emerald-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative">
          <ImageGallery images={images} name={plant.commonName} scientificName={plant.scientificName} />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">{plant.scientificName}</p>
            <h2 className="text-2xl font-black text-white mt-1">{plant.commonName}</h2>
            {plant.alsoKnownAs?.length ? (
              <p className="text-sm text-slate-400 mt-1">Also: {plant.alsoKnownAs.join(', ')}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${useBadgeClass(plant.uses)}`}>
                {useLabel(plant.uses)}
              </span>
              {plant.regions.map((r) => (
                <span key={r} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                  {regionLabel(r)}
                </span>
              ))}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 capitalize">
                {plant.category}
              </span>
            </div>
          </div>

          <PostEngagementBar
            target={{ kind: 'plant', plantId: plant.id }}
            user={user}
            onSignIn={onSignIn}
            onAskAi={onAskAi}
          />

          <DetailSection title="Habitat" text={plant.habitat} />
          <DetailSection title="Identification" text={plant.identification} />

          {plant.lookalikes && plant.lookalikes.length > 0 ? (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-red-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Toxic look-alikes
              </p>
              <ul className="space-y-2 text-sm text-red-100/90 list-disc list-inside leading-relaxed">
                {plant.lookalikes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {plant.edibleNotes ? <DetailSection title="Edible uses" text={plant.edibleNotes} /> : null}
          {plant.medicinalNotes ? <DetailSection title="Medicinal uses" text={plant.medicinalNotes} /> : null}
          {plant.holisticNotes ? <DetailSection title="Holistic notes" text={plant.holisticNotes} /> : null}
          {plant.preparation ? <DetailSection title="Preparation" text={plant.preparation} /> : null}
          <DetailSection title="Harvest season" text={plant.harvestSeason} />

          {plant.safetyWarnings.length > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Safety
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-100/90 list-disc list-inside">
                {plant.safetyWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {getPdfGuidesForPlant(plant.id).length > 0 ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-2">PDF guides</p>
              <div className="space-y-2">
                {getPdfGuidesForPlant(plant.id).map((g) => (
                  <a
                    key={g.id}
                    href={g.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    {g.title} (PDF)
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">External references</p>
            <div className="space-y-2">
              {plant.externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <PlantCommunityPanel plantId={plant.id} user={user} onSignIn={onSignIn} />
        </div>
      </div>
    </div>
  );
}

/** Living Knowledge Plants and Medicine — community foraging & herbal living knowledge base. */
function OregonPlantMedicineWebAppContent({ expanded, initialTab = 'home' }: Props) {
  const { theme } = useLivingKnowledgeTheme();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [useFilter, setUseFilter] = useState<UseFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [selected, setSelected] = useState<PlantEntry | null>(null);
  const [selectedCommunityPost, setSelectedCommunityPost] = useState<CommunityPostView | null>(null);
  const [seedVotesVersion, setSeedVotesVersion] = useState(0);
  const [askAiContext, setAskAiContext] = useState<AskAiContext | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [openEssayId, setOpenEssayId] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<{ library: TopicLibraryId; topicId: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlantMedicineProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddState, setShowAddState] = useState(false);
  const [holisticDisclaimerOpen, setHolisticDisclaimerOpen] = useState(false);
  const [holisticDisclaimerReview, setHolisticDisclaimerReview] = useState(false);
  const [holisticAccepted, setHolisticAccepted] = useState(() => hasAcceptedHolisticDisclaimer());
  const [pendingHolisticTab, setPendingHolisticTab] = useState(false);
  const [hypnosisDisclaimerOpen, setHypnosisDisclaimerOpen] = useState(false);
  const [hypnosisDisclaimerReview, setHypnosisDisclaimerReview] = useState(false);
  const [hypnosisAccepted, setHypnosisAccepted] = useState(() => hasAcceptedHypnosisEnergyDisclaimer());
  const [pendingHypnosisTab, setPendingHypnosisTab] = useState(false);
  const [animalDisclaimerOpen, setAnimalDisclaimerOpen] = useState(false);
  const [animalDisclaimerReview, setAnimalDisclaimerReview] = useState(false);
  const [animalAccepted, setAnimalAccepted] = useState(() => hasAcceptedAnimalHealthDisclaimer());
  const [pendingAnimalTab, setPendingAnimalTab] = useState(false);
  const [herbsDisclaimerOpen, setHerbsDisclaimerOpen] = useState(false);
  const [herbsDisclaimerReview, setHerbsDisclaimerReview] = useState(false);
  const [herbsAccepted, setHerbsAccepted] = useState(() => hasAcceptedHerbsDisclaimer());
  const [pendingHerbsTab, setPendingHerbsTab] = useState(false);
  const [supplementsDisclaimerOpen, setSupplementsDisclaimerOpen] = useState(false);
  const [supplementsDisclaimerReview, setSupplementsDisclaimerReview] = useState(false);
  const [supplementsAccepted, setSupplementsAccepted] = useState(() => hasAcceptedSupplementsDisclaimer());
  const [pendingSupplementsTab, setPendingSupplementsTab] = useState(false);
  const [iridologyDisclaimerOpen, setIridologyDisclaimerOpen] = useState(false);
  const [iridologyDisclaimerReview, setIridologyDisclaimerReview] = useState(false);
  const [iridologyAccepted, setIridologyAccepted] = useState(() => hasAcceptedIridologyDisclaimer());
  const [pendingIridologyTab, setPendingIridologyTab] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => loadUserLocation());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [askFallbackOpen, setAskFallbackOpen] = useState(false);
  const [locationModalStep, setLocationModalStep] = useState<'location' | 'welcome' | 'add-state'>('location');
  const [authError, setAuthError] = useState('');

  const bumpSeedVotes = useCallback(() => {
    setSeedVotesVersion((v) => v + 1);
  }, []);

  const handleCommunityUpvoteChange = useCallback(
    (postId: string, result: { upvoteCount: number; viewerHasUpvoted: boolean }, isSeed: boolean) => {
      if (isSeed) bumpSeedVotes();
      setSelectedCommunityPost((prev) =>
        prev && prev.id === postId
          ? { ...prev, upvoteCount: result.upvoteCount, viewerHasUpvoted: result.viewerHasUpvoted }
          : prev,
      );
    },
    [bumpSeedVotes],
  );

  const regionSupported = userLocation ? isSupportedLocation(userLocation) : true;
  const userId = user?.uid ?? null;

  useEffect(() => {
    setHolisticAccepted(hasAcceptedHolisticDisclaimer(userId));
    setHypnosisAccepted(hasAcceptedHypnosisEnergyDisclaimer(userId));
    setAnimalAccepted(hasAcceptedAnimalHealthDisclaimer(userId));
    setHerbsAccepted(hasAcceptedHerbsDisclaimer(userId));
    setSupplementsAccepted(hasAcceptedSupplementsDisclaimer(userId));
    setIridologyAccepted(hasAcceptedIridologyDisclaimer(userId));
  }, [userId]);

  useEffect(() => {
    if (tab !== 'plants') {
      setShowLocationModal(false);
      return;
    }
    if (!userLocation) {
      setLocationModalStep('location');
      setShowLocationModal(true);
    }
  }, [tab, userLocation]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ fallback?: boolean }>).detail;
      if (detail?.fallback) setAskFallbackOpen(true);
    };
    window.addEventListener(LIVING_KNOWLEDGE_OPEN_ASK_EVENT, onOpen);
    return () => window.removeEventListener(LIVING_KNOWLEDGE_OPEN_ASK_EVENT, onOpen);
  }, []);

  useEffect(() => {
    setTab(initialTab);
    if (initialTab === 'holistic' && !hasAcceptedHolisticDisclaimer(userId)) {
      setHolisticDisclaimerReview(false);
      setHolisticDisclaimerOpen(true);
      setPendingHolisticTab(true);
    }
    if (initialTab === 'hypnosis' && !hasAcceptedHypnosisEnergyDisclaimer(userId)) {
      setHypnosisDisclaimerReview(false);
      setHypnosisDisclaimerOpen(true);
      setPendingHypnosisTab(true);
    }
    if (initialTab === 'animal-health' && !hasAcceptedAnimalHealthDisclaimer(userId)) {
      setAnimalDisclaimerReview(false);
      setAnimalDisclaimerOpen(true);
      setPendingAnimalTab(true);
    }
    if (initialTab === 'herbs' && !hasAcceptedHerbsDisclaimer(userId)) {
      setHerbsDisclaimerReview(false);
      setHerbsDisclaimerOpen(true);
      setPendingHerbsTab(true);
    }
    if (initialTab === 'supplements' && !hasAcceptedSupplementsDisclaimer(userId)) {
      setSupplementsDisclaimerReview(false);
      setSupplementsDisclaimerOpen(true);
      setPendingSupplementsTab(true);
    }
    if (initialTab === 'iridology' && !hasAcceptedIridologyDisclaimer(userId)) {
      setIridologyDisclaimerReview(false);
      setIridologyDisclaimerOpen(true);
      setPendingIridologyTab(true);
    }
  }, [initialTab, userId]);

  const openHolisticTab = useCallback(() => {
    if (!holisticAccepted) {
      setHolisticDisclaimerReview(false);
      setPendingHolisticTab(true);
      setHolisticDisclaimerOpen(true);
      return;
    }
    setTab('holistic');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', HOLISTIC_REMEDIES_PATH);
    }
  }, [expanded, holisticAccepted]);

  const openHypnosisTab = useCallback(() => {
    if (!hypnosisAccepted) {
      setHypnosisDisclaimerReview(false);
      setPendingHypnosisTab(true);
      setHypnosisDisclaimerOpen(true);
      return;
    }
    setTab('hypnosis');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', HYPNOSIS_ENERGY_PATH);
    }
  }, [expanded, hypnosisAccepted]);

  const openAnimalHealthTab = useCallback(() => {
    if (!animalAccepted) {
      setAnimalDisclaimerReview(false);
      setPendingAnimalTab(true);
      setAnimalDisclaimerOpen(true);
      return;
    }
    setTab('animal-health');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', ANIMAL_HEALTH_PATH);
    }
  }, [expanded, animalAccepted]);

  const openHerbsTab = useCallback(() => {
    if (!herbsAccepted) {
      setHerbsDisclaimerReview(false);
      setPendingHerbsTab(true);
      setHerbsDisclaimerOpen(true);
      return;
    }
    setTab('herbs');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', HERBS_PATH);
    }
  }, [expanded, herbsAccepted]);

  const openSupplementsTab = useCallback(() => {
    if (!supplementsAccepted) {
      setSupplementsDisclaimerReview(false);
      setPendingSupplementsTab(true);
      setSupplementsDisclaimerOpen(true);
      return;
    }
    setTab('supplements');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', SUPPLEMENTS_PATH);
    }
  }, [expanded, supplementsAccepted]);

  const openIridologyTab = useCallback(() => {
    if (!iridologyAccepted) {
      setIridologyDisclaimerReview(false);
      setPendingIridologyTab(true);
      setIridologyDisclaimerOpen(true);
      return;
    }
    setTab('iridology');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', IRIDOLOGY_PATH);
    }
  }, [expanded, iridologyAccepted]);

  const selectTab = useCallback(
    (id: Tab) => {
      if (id === 'holistic') {
        openHolisticTab();
        return;
      }
      if (id === 'hypnosis') {
        openHypnosisTab();
        return;
      }
      if (id === 'animal-health') {
        openAnimalHealthTab();
        return;
      }
      if (id === 'herbs') {
        openHerbsTab();
        return;
      }
      if (id === 'supplements') {
        openSupplementsTab();
        return;
      }
      if (id === 'iridology') {
        openIridologyTab();
        return;
      }
      setTab(id);
      if (expanded && typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/plants');
      }
    },
    [expanded, openHolisticTab, openHypnosisTab, openAnimalHealthTab, openHerbsTab, openSupplementsTab, openIridologyTab],
  );

  const footerView: FooterView =
    tab === 'guide' ? 'guide' : tab === 'resources' ? 'resources' : null;

  const navigateFooter = useCallback(
    (view: FooterView) => {
      if (!view) return;
      setTab(view);
      if (expanded && typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/plants');
      }
    },
    [expanded],
  );

  useEffect(() => {
    if (!userLocation?.subRegion || userLocation.subRegion === 'all') return;
    setRegion(userLocation.subRegion);
  }, [userLocation]);

  const handleLocationComplete = useCallback((loc: UserLocation) => {
    saveUserLocation(loc);
    setUserLocation(loc);
    setShowLocationModal(false);
    if (loc.subRegion && loc.subRegion !== 'all') {
      setRegion(loc.subRegion);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setProfile(null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchMyProfile(user)
      .then(setProfile)
      .catch(() => undefined);
  }, [user]);

  const handleSignIn = useCallback(async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: unknown) {
          setAuthError(redirectErr instanceof Error ? redirectErr.message : 'Sign-in failed');
          return;
        }
      }
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  const openAskAiForPlant = useCallback((plant: PlantEntry) => {
    setAskAiContext({
      focusTitle: plant.commonName,
      contextText: [
        plant.commonName,
        plant.scientificName,
        plant.habitat,
        plant.identification,
        plant.edibleNotes,
        plant.medicinalNotes,
        plant.holisticNotes,
        plant.preparation,
        ...(plant.safetyWarnings ?? []),
        ...(plant.lookalikes ?? []),
      ]
        .filter(Boolean)
        .join('\n'),
      plantId: plant.id,
    });
  }, []);

  const openAskAi = useCallback((ctx: AskAiContext) => {
    setAskAiContext(ctx);
  }, []);

  const handleSiteSearchSelect = useCallback(
    (result: SiteSearchResult) => {
      if (result.kind === 'plant') {
        const plant = PLANT_LIBRARY.find((p) => p.id === result.id);
        if (!plant) return;
        selectTab('plants');
        setSelected(plant);
        return;
      }
      if (result.kind === 'essay') {
        selectTab(result.tab === 'home' ? 'home' : result.tab);
        setOpenEssayId(result.id);
        return;
      }
      const libraryMap: Record<string, TopicLibraryId> = {
        holistic: 'holistic',
        hypnosis: 'hypnosis',
        'animal-health': 'animal-health',
        herbs: 'herbs',
        supplements: 'supplements',
        iridology: 'iridology',
      };
      const library = libraryMap[result.kind];
      if (library) {
        selectTab(result.tab);
        setFocusTopic({ library, topicId: result.id });
      }
    },
    [selectTab],
  );

  const clearFocusTopic = useCallback(() => setFocusTopic(null), []);
  const clearOpenEssay = useCallback(() => setOpenEssayId(null), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANT_LIBRARY.filter((p) => {
      if (!matchesRegion(p, region)) return false;
      if (useFilter === 'edible' && p.uses === 'medicinal') return false;
      if (useFilter === 'medicinal' && p.uses === 'edible') return false;
      if (useFilter === 'hallucinogenic' && p.uses !== 'hallucinogenic') return false;
      if (useFilter === 'both' && p.uses !== 'both') return false;
      if (favoritesOnly && !favorites.has(p.id)) return false;
      if (!q) return true;
      const hay = [
        p.commonName,
        p.scientificName,
        ...(p.alsoKnownAs ?? []),
        p.habitat,
        p.identification,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, region, useFilter, favoritesOnly, favorites]);

  const edibleFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANT_LIBRARY.filter((p) => {
      if (p.uses !== 'edible' && p.uses !== 'both') return false;
      if (!matchesRegion(p, region)) return false;
      if (favoritesOnly && !favorites.has(p.id)) return false;
      if (!q) return true;
      const hay = [
        p.commonName,
        p.scientificName,
        ...(p.alsoKnownAs ?? []),
        p.habitat,
        p.identification,
        p.edibleNotes ?? '',
        p.preparation ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, region, favoritesOnly, favorites]);

  const plantsFeaturedEssay = getFeaturedEssay('plants-home');

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  const renderPlantCard = (plant: PlantEntry, variant: 'plants' | 'edibles') => (
    <article
      key={`${variant}-${plant.id}`}
      className={`group rounded-xl border bg-slate-900/60 overflow-hidden transition-colors cursor-pointer ${
        variant === 'edibles'
          ? plant.category === 'mushroom'
            ? 'border-slate-800 hover:border-amber-500/40'
            : 'border-slate-800 hover:border-lime-500/40'
          : 'border-slate-800 hover:border-emerald-500/40'
      }`}
      onClick={() => setSelected(plant)}
      onKeyDown={(e) => e.key === 'Enter' && setSelected(plant)}
      role="button"
      tabIndex={0}
    >
      <div className="relative h-36 overflow-hidden">
        <PlantPhoto
          src={plant.imageUrl}
          plantId={plant.id}
          scientificName={plant.scientificName}
          alt={plant.commonName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(plant.id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70"
          aria-label="Save plant"
        >
          <Star
            className={`w-4 h-4 ${favorites.has(plant.id) ? 'fill-amber-400 text-amber-400' : 'text-white'}`}
          />
        </button>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">
          {plant.scientificName}
        </p>
        <h3 className="font-bold text-white mt-0.5">{plant.commonName}</h3>
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {plant.edibleNotes || plant.medicinalNotes || plant.identification}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {variant === 'edibles' && plant.category === 'mushroom' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Mushroom
              </span>
            ) : null}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${useBadgeClass(plant.uses)}`}>
              {useLabel(plant.uses)}
            </span>
          </div>
          <div className="mt-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <PostEngagementBar
              target={{ kind: 'plant', plantId: plant.id }}
              user={user}
              onSignIn={() => void handleSignIn()}
              stopPropagation
              onAskAi={() => openAskAiForPlant(plant)}
            />
          </div>
        </div>
      </div>
    </article>
  );

  const shellClass = expanded
    ? theme === 'light'
      ? 'min-h-screen bg-gradient-to-b from-slate-100 via-emerald-50/50 to-slate-100 text-slate-900'
      : 'min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 text-white'
    : theme === 'light'
      ? 'rounded-2xl border border-emerald-600/20 bg-gradient-to-b from-slate-50 to-white text-slate-900 overflow-hidden'
      : 'rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-slate-950 to-slate-900 text-white overflow-hidden';

  const authActions = user ? (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setShowProfile(true)}
        className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-black/35 backdrop-blur-sm px-2.5 py-1.5 text-xs font-bold text-emerald-100 hover:bg-black/50"
      >
        {profile?.avatarUrl ? (
          <UserAvatar
            url={profile.avatarUrl}
            name={profile.displayName || 'Profile'}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <UserIcon className="w-4 h-4" />
        )}
        {profile?.displayName || 'Profile'}
      </button>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
      >
        <LogOut className="w-3 h-3" /> Sign out
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => void handleSignIn()}
      className="rounded-lg bg-emerald-600/90 hover:bg-emerald-500 backdrop-blur-sm px-3 py-2 text-xs font-bold text-white shadow-lg"
    >
      Sign in
    </button>
  );

  return (
    <div className={`${shellClass} lk-app`} data-lk-theme={theme}>
      <OregonPlantMedicineHero
        compact={!expanded}
        actions={authActions}
        onContribute={() => setShowCreatePost(true)}
      />

      <header className="border-b border-slate-800">
        <nav
          className={`lk-nav-bar sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 ${
            expanded ? 'px-4 sm:px-8' : 'px-4'
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3 py-2.5">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0 pb-0.5">
              {NAV_GROUPS.map((group, groupIndex) => (
                <div key={group.id} className="flex items-center gap-1 shrink-0">
                  {groupIndex > 0 ? (
                    <span className="hidden sm:block w-px h-7 bg-slate-700 mx-1.5 shrink-0" aria-hidden />
                  ) : null}
                  <span className="hidden lg:inline text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-1.5 shrink-0">
                    {group.label}
                  </span>
                  {group.items.map(([id, label, Icon]) => {
                    const active = tab === id;
                    const research = isResearchNavTab(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectTab(id)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                          active
                            ? research
                              ? 'bg-violet-500/20 text-white ring-1 ring-violet-400/35 shadow-sm'
                              : 'bg-white/10 text-white ring-1 ring-white/15 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{navTabShortLabel(id, label)}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <LivingKnowledgeThemeToggle />
              <button
                type="button"
                onClick={() => setShowCreatePost(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 text-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Contribute
              </button>
            </div>
          </div>
        </nav>

        <div className="lk-nav-search border-b border-slate-800 bg-slate-900/90">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
            <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Find anything</p>
                  <p className="text-sm font-semibold text-white">Search plants, herbs, supplements, and protocols</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 sm:text-right">
                  Viewing: <span className="text-slate-200">{TAB_PAGE_LABELS[tab]}</span>
                </span>
              </div>
              {authError ? <p className="text-xs text-red-300">{authError}</p> : null}
              <LivingKnowledgeSiteSearch onSelect={handleSiteSearchSelect} />
              {tab === 'plants' && userLocation ? (
                <button
                  type="button"
                  onClick={() => {
                    setLocationModalStep('location');
                    setShowLocationModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200 self-start"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {locationLabel(userLocation)}
                  {regionSupported && userLocation.stateId
                    ? ` · ${subRegionLabel(userLocation.subRegion)}`
                    : !regionSupported
                      ? ' · not in library yet'
                      : ''}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>


      <div className={expanded ? 'px-4 sm:px-8 py-6 max-w-6xl mx-auto' : 'p-4 max-h-[70vh] overflow-y-auto'}>
        {tab === 'home' ? (
          <OregonPlantMedicineHome
            onNavigate={(id) => selectTab(id)}
            onOpenPlant={(plant) => setSelected(plant)}
            onOpenPost={(post) => setSelectedCommunityPost(post)}
            user={user}
            onSignIn={() => void handleSignIn()}
            onCreatePost={() => setShowCreatePost(true)}
            seedVotesVersion={seedVotesVersion}
            onSeedUpvoteChange={bumpSeedVotes}
            onOpenTopic={(library, topicId) => {
              selectTab(library);
              setFocusTopic({ library, topicId });
            }}
          />
        ) : null}

        {tab === 'community' ? (
          <CommunityFeedPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onOpenPost={(post) => setSelectedCommunityPost(post)}
            seedVotesVersion={seedVotesVersion}
            onSeedUpvoteChange={bumpSeedVotes}
          />
        ) : null}

        {tab === 'plants' ? (
          <>
            <LivingKnowledgeAskWithGuide
              accent="emerald"
              intro={
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100/90 leading-relaxed">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-2">
                    Primary field guide
                  </p>
                  <p>
                    {EARTH_PLANT_MEDICINE_NAME} — foraging IDs, regions, look-alikes, and harvest notes. Wild edibles
                    &amp; mushrooms are in the section below. Herbs, supplements, and holistic libraries are in the nav.
                  </p>
                </div>
              }
              askAgent={
                <HolisticAskAgent
                  scope="plants"
                  accent="emerald"
                  placeholder="Ask about plants, Latin names, look-alikes, harvest…"
                  onQueryChange={setQuery}
                  user={user}
                  onSignIn={() => void handleSignIn()}
                  onContribute={() => setShowCreatePost(true)}
                  onOpenPlant={(plantId) => {
                    const plant = PLANT_LIBRARY.find((p) => p.id === plantId);
                    if (plant) setSelected(plant);
                  }}
                />
              }
              filters={
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as RegionFilter)}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white flex-1"
                  >
                    {REGION_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={useFilter}
                    onChange={(e) => setUseFilter(e.target.value as UseFilter)}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                  >
                    <option value="all">All uses</option>
                    <option value="edible">Edible</option>
                    <option value="medicinal">Medicinal</option>
                    <option value="both">Edible &amp; medicinal</option>
                    <option value="hallucinogenic">Hallucinogenic</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setFavoritesOnly((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-bold ${
                      favoritesOnly
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-amber-400' : ''}`} />
                    Saved
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreatePost(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-sm shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Share a post
                  </button>
                </div>
              }
            />

            {userLocation && !regionSupported ? (
              <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 p-5 mb-5 text-sm text-sky-100/90">
                <p className="text-xs font-black uppercase tracking-widest text-sky-300 mb-2">
                  {userLocation.state} is not on the map yet
                </p>
                <p className="leading-relaxed">
                  You can still search and browse the full Oregon, Washington &amp; Northern California library. Want localized
                  plants for {locationLabel(userLocation)}? Add your state for{' '}
                  <strong className="text-white">${STATE_CONTRIBUTION_USD}</strong> in Hive credits — that opens the
                  region for everyone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLocationModalStep('add-state');
                    setShowLocationModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 text-sm"
                >
                  Add {userLocation.state} — ${STATE_CONTRIBUTION_USD}
                </button>
              </div>
            ) : userLocation && regionSupported ? (
              <p className="text-xs text-emerald-400/90 mb-4">
                Localized for {locationLabel(userLocation)}
                {userLocation.subRegion !== 'all' ? ` · ${subRegionLabel(userLocation.subRegion)}` : ''}
              </p>
            ) : null}

            <div className="mb-4">
              <RegionalOfflinePackButton region={region} />
            </div>

            {plantsFeaturedEssay ? (
              <LibraryFeaturedHero
                video={SECTION_VIDEOS.edibles}
                essay={plantsFeaturedEssay}
                videoAccentClass="text-lime-300"
                videoBorderClass="border-lime-500/35"
                onOpenPlant={(plant) => setSelected(plant)}
                user={user}
                onSignIn={() => void handleSignIn()}
                onAskAi={openAskAi}
              />
            ) : null}

            <p className="text-xs text-slate-500 mb-4">{filtered.length} plants in library</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {filtered.map((plant) => renderPlantCard(plant, 'plants'))}
            </div>

            <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 text-sm text-lime-100/90 leading-relaxed mb-6">
              <p className="text-xs font-black uppercase tracking-widest text-lime-300 mb-2">
                Wild edible foods &amp; mushrooms
              </p>
              <p>
                Berries, greens, roots, and fungi — each entry includes ID photos, habitat notes, toxic look-alikes, and
                preparation ideas.{' '}
                <strong className="text-white">Never eat a wild plant or mushroom without 100% ID.</strong>
              </p>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              {edibleFiltered.length} edible wild foods &amp; mushrooms
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {edibleFiltered.map((plant) => renderPlantCard(plant, 'edibles'))}
            </div>
          </>
        ) : null}

        {tab === 'holistic' && holisticAccepted ? (
          <HolisticRemediesPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onCreatePost={() => setShowCreatePost(true)}
            onAskAi={openAskAi}
            focusTopicId={focusTopic?.library === 'holistic' ? focusTopic.topicId : null}
            onFocusTopicConsumed={clearFocusTopic}
          />
        ) : null}

        {tab === 'hypnosis' && hypnosisAccepted ? (
          <HypnosisEnergyPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onCreatePost={() => setShowCreatePost(true)}
            onAskAi={openAskAi}
            focusTopicId={focusTopic?.library === 'hypnosis' ? focusTopic.topicId : null}
            onFocusTopicConsumed={clearFocusTopic}
          />
        ) : null}

        {tab === 'animal-health' && animalAccepted ? (
          <AnimalHealthPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onCreatePost={() => setShowCreatePost(true)}
            onAskAi={openAskAi}
            focusTopicId={focusTopic?.library === 'animal-health' ? focusTopic.topicId : null}
            onFocusTopicConsumed={clearFocusTopic}
          />
        ) : null}

        {tab === 'herbs' && herbsAccepted ? (
          <HerbsPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onCreatePost={() => setShowCreatePost(true)}
            onAskAi={openAskAi}
            focusTopicId={focusTopic?.library === 'herbs' ? focusTopic.topicId : null}
            onFocusTopicConsumed={clearFocusTopic}
          />
        ) : null}

        {tab === 'supplements' && supplementsAccepted ? (
          <SupplementsPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onCreatePost={() => setShowCreatePost(true)}
            onAskAi={openAskAi}
            focusTopicId={focusTopic?.library === 'supplements' ? focusTopic.topicId : null}
            onFocusTopicConsumed={clearFocusTopic}
          />
        ) : null}

        {tab === 'iridology' && iridologyAccepted ? (
          <IridologyPanel
            user={user}
            onSignIn={() => void handleSignIn()}
            onOpenPlant={(plant) => setSelected(plant)}
            onCreatePost={() => setShowCreatePost(true)}
            onAskAi={openAskAi}
            focusTopicId={focusTopic?.library === 'iridology' ? focusTopic.topicId : null}
            onFocusTopicConsumed={clearFocusTopic}
          />
        ) : null}

        {tab === 'resources' ? <ResourcesPanel /> : null}

        {tab === 'guide' ? <FieldGuidePanel /> : null}
      </div>

      <LivingKnowledgeAppBar user={user} onSignIn={() => void handleSignIn()} />

      <LivingKnowledgeFooter
        activeView={footerView}
        onNavigate={navigateFooter}
        onShowHolisticDisclaimer={() => {
          setHolisticDisclaimerReview(true);
          setHolisticDisclaimerOpen(true);
        }}
        onShowHypnosisDisclaimer={() => {
          setHypnosisDisclaimerReview(true);
          setHypnosisDisclaimerOpen(true);
        }}
        onShowAnimalDisclaimer={() => {
          setAnimalDisclaimerReview(true);
          setAnimalDisclaimerOpen(true);
        }}
      />

      {selected ? (
        <PlantDetail
          plant={selected}
          onClose={() => setSelected(null)}
          user={user}
          onSignIn={() => void handleSignIn()}
          onAskAi={() => openAskAiForPlant(selected)}
        />
      ) : null}
      {askAiContext ? (
        <AskAiBhivePanel
          context={askAiContext}
          user={user}
          onSignIn={() => void handleSignIn()}
          onClose={() => setAskAiContext(null)}
        />
      ) : null}
      {openEssayId && getFeaturedEssayById(openEssayId) ? (
        <FeaturedEssayPanel
          essay={getFeaturedEssayById(openEssayId)!}
          onOpenPlant={(plant) => setSelected(plant)}
          user={user}
          onSignIn={() => void handleSignIn()}
          onAskAi={openAskAi}
          startOpen
          spanGrid={false}
          onDetailClose={clearOpenEssay}
        />
      ) : null}
      {selectedCommunityPost ? (
        <CommunityPostModal
          post={selectedCommunityPost}
          user={user}
          onSignIn={() => void handleSignIn()}
          onAskAi={openAskAi}
          onClose={() => setSelectedCommunityPost(null)}
          onOpenPlant={(plant) => setSelected(plant)}
          onUpvoteChange={handleCommunityUpvoteChange}
        />
      ) : null}
      {showProfile && user ? (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(p) => setProfile(p)}
        />
      ) : null}
      {showCreatePost ? (
        <CreateCommunityPostModal
          user={user}
          onSignIn={() => void handleSignIn()}
          onClose={() => setShowCreatePost(false)}
          onCreated={() => setShowCreatePost(false)}
        />
      ) : null}
      {showAddState ? (
        <ContributeModal
          onClose={() => setShowAddState(false)}
          stateName={userLocation && !regionSupported ? userLocation.state : undefined}
        />
      ) : null}
      {holisticDisclaimerOpen ? (
        <HolisticDisclaimerModal
          reviewOnly={holisticDisclaimerReview}
          userId={userId}
          onCancel={() => {
            setHolisticDisclaimerOpen(false);
            setHolisticDisclaimerReview(false);
            setPendingHolisticTab(false);
            if (tab === 'holistic' && !holisticAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            if (!holisticDisclaimerReview) setHolisticAccepted(true);
            setHolisticDisclaimerOpen(false);
            setHolisticDisclaimerReview(false);
            if (pendingHolisticTab && !holisticDisclaimerReview) {
              setPendingHolisticTab(false);
              setTab('holistic');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', HOLISTIC_REMEDIES_PATH);
              }
            }
          }}
        />
      ) : null}
      {hypnosisDisclaimerOpen ? (
        <HypnosisEnergyDisclaimerModal
          reviewOnly={hypnosisDisclaimerReview}
          userId={userId}
          onCancel={() => {
            setHypnosisDisclaimerOpen(false);
            setHypnosisDisclaimerReview(false);
            setPendingHypnosisTab(false);
            if (tab === 'hypnosis' && !hypnosisAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            if (!hypnosisDisclaimerReview) setHypnosisAccepted(true);
            setHypnosisDisclaimerOpen(false);
            setHypnosisDisclaimerReview(false);
            if (pendingHypnosisTab && !hypnosisDisclaimerReview) {
              setPendingHypnosisTab(false);
              setTab('hypnosis');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', HYPNOSIS_ENERGY_PATH);
              }
            }
          }}
        />
      ) : null}
      {animalDisclaimerOpen ? (
        <AnimalHealthDisclaimerModal
          reviewOnly={animalDisclaimerReview}
          userId={userId}
          onCancel={() => {
            setAnimalDisclaimerOpen(false);
            setAnimalDisclaimerReview(false);
            setPendingAnimalTab(false);
            if (tab === 'animal-health' && !animalAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            if (!animalDisclaimerReview) setAnimalAccepted(true);
            setAnimalDisclaimerOpen(false);
            setAnimalDisclaimerReview(false);
            if (pendingAnimalTab && !animalDisclaimerReview) {
              setPendingAnimalTab(false);
              setTab('animal-health');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', ANIMAL_HEALTH_PATH);
              }
            }
          }}
        />
      ) : null}
      {herbsDisclaimerOpen ? (
        <HerbsDisclaimerModal
          reviewOnly={herbsDisclaimerReview}
          userId={userId}
          onCancel={() => {
            setHerbsDisclaimerOpen(false);
            setHerbsDisclaimerReview(false);
            setPendingHerbsTab(false);
            if (tab === 'herbs' && !herbsAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            if (!herbsDisclaimerReview) setHerbsAccepted(true);
            setHerbsDisclaimerOpen(false);
            setHerbsDisclaimerReview(false);
            if (pendingHerbsTab && !herbsDisclaimerReview) {
              setPendingHerbsTab(false);
              setTab('herbs');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', HERBS_PATH);
              }
            }
          }}
        />
      ) : null}
      {supplementsDisclaimerOpen ? (
        <SupplementsDisclaimerModal
          reviewOnly={supplementsDisclaimerReview}
          userId={userId}
          onCancel={() => {
            setSupplementsDisclaimerOpen(false);
            setSupplementsDisclaimerReview(false);
            setPendingSupplementsTab(false);
            if (tab === 'supplements' && !supplementsAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            if (!supplementsDisclaimerReview) setSupplementsAccepted(true);
            setSupplementsDisclaimerOpen(false);
            setSupplementsDisclaimerReview(false);
            if (pendingSupplementsTab && !supplementsDisclaimerReview) {
              setPendingSupplementsTab(false);
              setTab('supplements');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', SUPPLEMENTS_PATH);
              }
            }
          }}
        />
      ) : null}
      {iridologyDisclaimerOpen ? (
        <IridologyDisclaimerModal
          reviewOnly={iridologyDisclaimerReview}
          userId={userId}
          onCancel={() => {
            setIridologyDisclaimerOpen(false);
            setIridologyDisclaimerReview(false);
            setPendingIridologyTab(false);
            if (tab === 'iridology' && !iridologyAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            if (!iridologyDisclaimerReview) setIridologyAccepted(true);
            setIridologyDisclaimerOpen(false);
            setIridologyDisclaimerReview(false);
            if (pendingIridologyTab && !iridologyDisclaimerReview) {
              setPendingIridologyTab(false);
              setTab('iridology');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', IRIDOLOGY_PATH);
              }
            }
          }}
        />
      ) : null}
      {showLocationModal && tab === 'plants' ? (
        <LocationOnboardingModal
          initial={userLocation}
          initialStep={locationModalStep}
          onComplete={handleLocationComplete}
          onClose={() => setShowLocationModal(false)}
          requireSubmit={!userLocation}
        />
      ) : null}
      {askFallbackOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-950 border border-emerald-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm font-black text-white">Ask Bhive</p>
              <button
                type="button"
                onClick={() => setAskFallbackOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                aria-label="Close Ask Bhive"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <HolisticAskAgent
              scope={livingKnowledgeScopeForTab(tab)}
              accent={tabAskAccent(tab)}
              placeholder="Ask about plants, herbs, holistic topics, and more…"
              user={user}
              onSignIn={() => void handleSignIn()}
              onContribute={() => setShowCreatePost(true)}
              onOpenPlant={(plantId) => {
                const plant = PLANT_LIBRARY.find((p) => p.id === plantId);
                if (plant) setSelected(plant);
              }}
            />
          </div>
        </div>
      ) : null}
      {expanded ? <LivingKnowledgeAskFab /> : null}
    </div>
  );
}

export default function OregonPlantMedicineWebApp(props: Props) {
  return (
    <LivingKnowledgeThemeProvider>
      <OregonPlantMedicineWebAppContent {...props} />
    </LivingKnowledgeThemeProvider>
  );
}
