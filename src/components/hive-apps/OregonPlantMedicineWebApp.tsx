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
  Apple,
  ExternalLink,
  FileText,
  HeartPulse,
  LogOut,
  MapPin,
  Sparkles,
  Sprout,
  Star,
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
import { interleaveFeaturedTile } from './oregon-plant-medicine/gridFeaturedInsert';
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
import AnimalHealthDisclaimerModal from './oregon-plant-medicine/AnimalHealthDisclaimerModal';
import FieldGuidePanel from './oregon-plant-medicine/FieldGuidePanel';
import ResourcesPanel from './oregon-plant-medicine/ResourcesPanel';
import LivingKnowledgeFooter, { type FooterView } from './oregon-plant-medicine/LivingKnowledgeFooter';
import GridSectionVideo from './oregon-plant-medicine/GridSectionVideo';
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
import {
  EARTH_PLANT_MEDICINE_NAME,
  HOLISTIC_REMEDIES_PATH,
  HOLISTIC_TAB_SHORT_LABEL,
  HYPNOSIS_ENERGY_PATH,
  HYPNOSIS_ENERGY_TAB_SHORT_LABEL,
  ANIMAL_HEALTH_PATH,
  ANIMAL_HEALTH_TAB_SHORT_LABEL,
  STATE_CONTRIBUTION_USD,
} from '../../lib/oregonPlantMedicine/branding';
import { hasAcceptedHolisticDisclaimer } from '../../lib/oregonPlantMedicine/holisticDisclaimer';
import { hasAcceptedHypnosisEnergyDisclaimer } from '../../lib/oregonPlantMedicine/hypnosisEnergyDisclaimer';
import { hasAcceptedAnimalHealthDisclaimer } from '../../lib/oregonPlantMedicine/animalHealthDisclaimer';
import {
  isSupportedLocation,
  locationLabel,
  subRegionLabel,
  type UserLocation,
} from '../../lib/oregonPlantMedicine/regions';
import { loadUserLocation, saveUserLocation } from '../../lib/oregonPlantMedicine/userLocation';

type Props = { expanded?: boolean; initialTab?: Tab };

type Tab = 'home' | 'community' | 'plants' | 'edibles' | 'holistic' | 'hypnosis' | 'animal-health' | 'guide' | 'resources';
type UseFilter = 'all' | PlantUse;

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
export default function OregonPlantMedicineWebApp({ expanded, initialTab = 'home' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [useFilter, setUseFilter] = useState<UseFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [selected, setSelected] = useState<PlantEntry | null>(null);
  const [selectedCommunityPost, setSelectedCommunityPost] = useState<CommunityPostView | null>(null);
  const [askAiContext, setAskAiContext] = useState<AskAiContext | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [openEssayId, setOpenEssayId] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<{ library: TopicLibraryId; topicId: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlantMedicineProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddState, setShowAddState] = useState(false);
  const [holisticDisclaimerOpen, setHolisticDisclaimerOpen] = useState(false);
  const [holisticAccepted, setHolisticAccepted] = useState(() => hasAcceptedHolisticDisclaimer());
  const [pendingHolisticTab, setPendingHolisticTab] = useState(false);
  const [hypnosisDisclaimerOpen, setHypnosisDisclaimerOpen] = useState(false);
  const [hypnosisAccepted, setHypnosisAccepted] = useState(() => hasAcceptedHypnosisEnergyDisclaimer());
  const [pendingHypnosisTab, setPendingHypnosisTab] = useState(false);
  const [animalDisclaimerOpen, setAnimalDisclaimerOpen] = useState(false);
  const [animalAccepted, setAnimalAccepted] = useState(() => hasAcceptedAnimalHealthDisclaimer());
  const [pendingAnimalTab, setPendingAnimalTab] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => loadUserLocation());
  const [showLocationModal, setShowLocationModal] = useState(() => !loadUserLocation());
  const [locationModalStep, setLocationModalStep] = useState<'location' | 'welcome' | 'add-state'>('location');
  const [authError, setAuthError] = useState('');

  const regionSupported = userLocation ? isSupportedLocation(userLocation) : true;

  useEffect(() => {
    setTab(initialTab);
    if (initialTab === 'holistic' && !hasAcceptedHolisticDisclaimer()) {
      setHolisticDisclaimerOpen(true);
      setPendingHolisticTab(true);
    }
    if (initialTab === 'hypnosis' && !hasAcceptedHypnosisEnergyDisclaimer()) {
      setHypnosisDisclaimerOpen(true);
      setPendingHypnosisTab(true);
    }
    if (initialTab === 'animal-health' && !hasAcceptedAnimalHealthDisclaimer()) {
      setAnimalDisclaimerOpen(true);
      setPendingAnimalTab(true);
    }
  }, [initialTab]);

  const openHolisticTab = useCallback(() => {
    if (!holisticAccepted) {
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
      setPendingAnimalTab(true);
      setAnimalDisclaimerOpen(true);
      return;
    }
    setTab('animal-health');
    if (expanded && typeof window !== 'undefined') {
      window.history.replaceState(null, '', ANIMAL_HEALTH_PATH);
    }
  }, [expanded, animalAccepted]);

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
      setTab(id);
      if (expanded && typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/plants');
      }
    },
    [expanded, openHolisticTab, openHypnosisTab, openAnimalHealthTab],
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
        selectTab(result.tab === 'edibles' ? 'edibles' : 'plants');
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

  const plantsToShow = tab === 'edibles' ? edibleFiltered : filtered;
  const ediblesFeaturedEssay = getFeaturedEssay('edibles');

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  const shellClass = expanded
    ? 'min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 text-white'
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
    <div className={shellClass}>
      <OregonPlantMedicineHero
        compact={!expanded}
        actions={authActions}
        onContribute={() => setShowCreatePost(true)}
      />

      <header className="border-b border-emerald-500/20">
        <nav
          className={`sticky top-0 z-30 bg-slate-950/92 backdrop-blur-xl border-b border-emerald-500/15 ${
            expanded ? 'px-4 sm:px-8' : 'px-4'
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3 py-2.5">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
              {(
                [
                  ['home', 'Home', Home],
                  ['community', 'Community', Users],
                  ['plants', 'Plants', Sprout],
                  ['edibles', 'Edibles', Apple],
                  ['holistic', HOLISTIC_TAB_SHORT_LABEL, HeartPulse],
                  ['hypnosis', HYPNOSIS_ENERGY_TAB_SHORT_LABEL, Sparkles],
                  ['animal-health', ANIMAL_HEALTH_TAB_SHORT_LABEL, PawPrint],
                ] as const
              ).map(([id, label, Icon]) => {
                const active = tab === id;
                const isResearch = id === 'holistic' || id === 'hypnosis' || id === 'animal-health';
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTab(id)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                      active
                        ? isResearch
                          ? 'text-violet-200'
                          : 'text-emerald-300'
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{id === 'animal-health' ? 'Animals' : label.split(' ')[0]}</span>
                    {active ? (
                      <span
                        className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                          isResearch ? 'bg-violet-400' : 'bg-emerald-400'
                        }`}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowCreatePost(true)}
              className="hidden sm:inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 text-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Contribute
            </button>
          </div>
        </nav>

        <div className="border-b border-emerald-500/10 bg-slate-950/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col items-center">
            {authError ? <p className="text-xs text-red-300 mb-2 w-full max-w-xl text-center">{authError}</p> : null}
            <LivingKnowledgeSiteSearch onSelect={handleSiteSearchSelect} className="max-w-xl" />
            {tab !== 'home' && userLocation ? (
              <button
                type="button"
                onClick={() => {
                  setLocationModalStep('location');
                  setShowLocationModal(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400/90 hover:text-emerald-300"
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
          />
        ) : null}

        {tab === 'plants' || tab === 'edibles' ? (
          <>
            <LivingKnowledgeAskWithGuide
              accent={tab === 'edibles' ? 'lime' : 'emerald'}
              intro={
                tab === 'edibles' ? (
                  <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 text-sm text-lime-100/90 leading-relaxed">
                    <p className="text-xs font-black uppercase tracking-widest text-lime-300 mb-2">
                      Wild edible foods &amp; mushrooms
                    </p>
                    <p>
                      Berries, greens, roots, and fungi across Oregon and Northern California — each entry includes{' '}
                      <strong className="text-white">three ID photos</strong>, habitat notes, toxic look-alikes, and
                      preparation ideas.{' '}
                      <strong className="text-white">Never eat a wild plant or mushroom without 100% ID.</strong>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100/90 leading-relaxed">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-2">
                      Primary field guide
                    </p>
                    <p>
                      {EARTH_PLANT_MEDICINE_NAME} centers on this plant &amp; mushroom library — foraging IDs, regions,
                      look-alikes, and harvest notes. Holistic protocols, hypnosis, and animal health live under adjacent
                      research libraries in the nav.
                    </p>
                  </div>
                )
              }
              askAgent={
                <HolisticAskAgent
                  scope={tab === 'edibles' ? 'edibles' : 'plants'}
                  accent={tab === 'edibles' ? 'lime' : 'emerald'}
                  placeholder={
                    tab === 'edibles'
                      ? 'Ask about berries, mycelium, chanterelles, wild greens…'
                      : 'Ask about plants, Latin names, look-alikes, harvest…'
                  }
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
                tab === 'edibles' ? (
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
                  </div>
                ) : (
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
                  </div>
                )
              }
            />

            {userLocation && !regionSupported ? (
              <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 p-5 mb-5 text-sm text-sky-100/90">
                <p className="text-xs font-black uppercase tracking-widest text-sky-300 mb-2">
                  {userLocation.state} is not on the map yet
                </p>
                <p className="leading-relaxed">
                  You can still search and browse the full Oregon &amp; Northern California library. Want localized
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

            <p className="text-xs text-slate-500 mb-4">
              {plantsToShow.length}{' '}
              {tab === 'edibles' ? 'edible wild foods & mushrooms' : 'plants in library'}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tab === 'edibles' ? (
                <GridSectionVideo
                  video={SECTION_VIDEOS.edibles}
                  accentClass="text-lime-300"
                  borderClass="border-lime-500/35 hover:border-lime-500/50"
                />
              ) : null}
              {interleaveFeaturedTile(
                plantsToShow.map((plant) => (
                <article
                  key={plant.id}
                  className={`group rounded-xl border bg-slate-900/60 overflow-hidden transition-colors cursor-pointer ${
                    tab === 'edibles'
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
                        className={`w-4 h-4 ${
                          favorites.has(plant.id) ? 'fill-amber-400 text-amber-400' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">
                      {plant.scientificName}
                    </p>
                    <h3 className="font-bold text-white mt-0.5">{plant.commonName}</h3>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tab === 'edibles' && plant.category === 'mushroom' ? (
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
                )),
                tab === 'edibles' && ediblesFeaturedEssay ? (
                  <FeaturedEssayPanel
                    key="edibles-featured-essay"
                    essay={ediblesFeaturedEssay}
                    onOpenPlant={(plant) => setSelected(plant)}
                    user={user}
                    onSignIn={() => void handleSignIn()}
                    onAskAi={openAskAi}
                  />
                ) : null,
              )}
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

        {tab === 'resources' ? <ResourcesPanel /> : null}

        {tab === 'guide' ? <FieldGuidePanel /> : null}
      </div>

      <LivingKnowledgeFooter
        activeView={footerView}
        onNavigate={navigateFooter}
        onShowHolisticDisclaimer={() => {
          setHolisticDisclaimerOpen(true);
        }}
        onShowHypnosisDisclaimer={() => {
          setHypnosisDisclaimerOpen(true);
        }}
        onShowAnimalDisclaimer={() => {
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
          onCancel={() => {
            setHolisticDisclaimerOpen(false);
            setPendingHolisticTab(false);
            if (tab === 'holistic' && !holisticAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            setHolisticAccepted(true);
            setHolisticDisclaimerOpen(false);
            if (pendingHolisticTab) {
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
          onCancel={() => {
            setHypnosisDisclaimerOpen(false);
            setPendingHypnosisTab(false);
            if (tab === 'hypnosis' && !hypnosisAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            setHypnosisAccepted(true);
            setHypnosisDisclaimerOpen(false);
            if (pendingHypnosisTab) {
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
          onCancel={() => {
            setAnimalDisclaimerOpen(false);
            setPendingAnimalTab(false);
            if (tab === 'animal-health' && !animalAccepted) {
              setTab('plants');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/plants');
              }
            }
          }}
          onAccepted={() => {
            setAnimalAccepted(true);
            setAnimalDisclaimerOpen(false);
            if (pendingAnimalTab) {
              setPendingAnimalTab(false);
              setTab('animal-health');
              if (expanded && typeof window !== 'undefined') {
                window.history.replaceState(null, '', ANIMAL_HEALTH_PATH);
              }
            }
          }}
        />
      ) : null}
      {showLocationModal ? (
        <LocationOnboardingModal
          initial={userLocation}
          initialStep={locationModalStep}
          onComplete={handleLocationComplete}
          onClose={() => setShowLocationModal(false)}
          requireSubmit={!userLocation}
        />
      ) : null}
    </div>
  );
}
