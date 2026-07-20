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
  BookOpen,
  ExternalLink,
  FileText,
  LogOut,
  MapPin,
  Search,
  Sparkles,
  Sprout,
  Star,
  User as UserIcon,
  X,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import {
  EXTERNAL_RESOURCE_LIBRARY,
  PLANT_LIBRARY,
  matchesRegion,
  regionLabel,
  REGION_FILTER_OPTIONS,
  type RegionFilter,
} from '../../lib/oregonPlantMedicine/plantLibrary';
import type { PlantEntry, PlantImage, PlantUse } from '../../lib/oregonPlantMedicine/types';
import { getPdfGuidesForPlant, OREGON_PLANT_PDF_GUIDES } from '../../lib/oregonPlantMedicine/guidePdfs';
import { fetchMyProfile, type PlantMedicineProfile } from '../../lib/oregonPlantMedicine/plantMedicineApi';
import PlantCommunityPanel from './oregon-plant-medicine/PlantCommunityPanel';
import PlantAskAiPanel from './oregon-plant-medicine/PlantAskAiPanel';
import RegionalOfflinePackButton from './oregon-plant-medicine/RegionalOfflinePackButton';
import OregonPlantMedicineHero from './oregon-plant-medicine/OregonPlantMedicineHero';
import ContributeModal from './oregon-plant-medicine/ContributeModal';
import LocationOnboardingModal from './oregon-plant-medicine/LocationOnboardingModal';
import ProfileModal from './oregon-plant-medicine/ProfileModal';
import PlantPhoto from './oregon-plant-medicine/PlantImage';
import { LIVING_KNOWLEDGE_APP_NAME, LIVING_KNOWLEDGE_TAGLINE, STATE_CONTRIBUTION_USD } from '../../lib/oregonPlantMedicine/branding';
import {
  isSupportedLocation,
  locationLabel,
  subRegionLabel,
  type UserLocation,
} from '../../lib/oregonPlantMedicine/regions';
import { loadUserLocation, saveUserLocation } from '../../lib/oregonPlantMedicine/userLocation';

type Props = { expanded?: boolean };

type Tab = 'plants' | 'edibles' | 'resources' | 'guide' | 'pdfs' | 'mushrooms';
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
  const current = images[active] ?? images[0];
  if (!current) return null;

  return (
    <>
      <PlantPhoto
        src={current.url}
        scientificName={scientificName}
        alt={`${name} — ${current.caption ?? 'identification photo'}`}
        className="w-full h-48 sm:h-56 object-cover"
      />
      <p className="absolute bottom-2 left-3 right-3 text-[10px] text-white/80 bg-black/50 px-2 py-1 rounded">
        {current.caption ? `${current.caption} · ` : ''}
        {current.credit}
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

          <button
            type="button"
            onClick={onAskAi}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI AiBhive
          </button>

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
export default function OregonPlantMedicineWebApp({ expanded }: Props) {
  const [tab, setTab] = useState<Tab>('plants');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [useFilter, setUseFilter] = useState<UseFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [selected, setSelected] = useState<PlantEntry | null>(null);
  const [askAiPlant, setAskAiPlant] = useState<PlantEntry | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlantMedicineProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => loadUserLocation());
  const [showLocationModal, setShowLocationModal] = useState(() => !loadUserLocation());
  const [locationModalStep, setLocationModalStep] = useState<'location' | 'welcome' | 'add-state'>('location');
  const [authError, setAuthError] = useState('');

  const regionSupported = userLocation ? isSupportedLocation(userLocation) : true;

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

  const filtered = useMemo(() => {
    if (userLocation && !regionSupported) return [];
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
  }, [query, region, useFilter, favoritesOnly, favorites, userLocation, regionSupported]);

  const edibleFiltered = useMemo(() => {
    if (userLocation && !regionSupported) return [];
    const q = query.trim().toLowerCase();
    return PLANT_LIBRARY.filter((p) => {
      if (p.category === 'mushroom') return false;
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
  }, [query, region, favoritesOnly, favorites, userLocation, regionSupported]);

  const mushroomFiltered = useMemo(() => {
    if (userLocation && !regionSupported) return [];
    const q = query.trim().toLowerCase();
    return PLANT_LIBRARY.filter((p) => {
      if (p.category !== 'mushroom') return false;
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
  }, [query, region, favoritesOnly, favorites, userLocation, regionSupported]);

  const plantsToShow =
    tab === 'edibles' ? edibleFiltered : tab === 'mushrooms' ? mushroomFiltered : filtered;

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
          <img src={profile.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover object-center" />
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
        onContribute={() => setShowContribute(true)}
      />

      <header className={`border-b border-emerald-500/20 ${expanded ? 'px-4 sm:px-8 py-4' : 'px-4 py-3'}`}>
        {authError ? <p className="text-xs text-red-300 mb-3">{authError}</p> : null}

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 mb-4 text-sm text-emerald-100/90 leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-1">Living knowledge base</p>
            <p>{LIVING_KNOWLEDGE_TAGLINE}</p>
            {userLocation ? (
              <button
                type="button"
                onClick={() => {
                  setLocationModalStep('location');
                  setShowLocationModal(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200"
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
          <button
            type="button"
            onClick={() => setShowContribute(true)}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Contribute
          </button>
        </div>

        <nav className="flex gap-2 flex-wrap">
          {(
            [
              ['plants', 'Plant library', Sprout],
              ['edibles', 'Edibles', Apple],
              ['mushrooms', 'Edible mushrooms', Layers],
              ['pdfs', 'PDF guides', FileText],
              ['resources', 'Resources', BookOpen],
              ['guide', 'Field guide', MapPin],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className={expanded ? 'px-4 sm:px-8 py-6 max-w-6xl mx-auto' : 'p-4 max-h-[70vh] overflow-y-auto'}>
        {tab === 'plants' || tab === 'edibles' || tab === 'mushrooms' ? (
          <>
            {tab === 'edibles' ? (
              <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 mb-5 text-sm text-lime-100/90 leading-relaxed">
                <p className="text-xs font-black uppercase tracking-widest text-lime-300 mb-2">Wild edible foods</p>
                <p>
                  Berries, greens, and roots across Oregon and Northern California — each entry includes{' '}
                  <strong className="text-white">three ID photos</strong>, habitat notes, and preparation ideas. For
                  fungi, see the <strong className="text-white">Edible mushrooms</strong> tab.
                </p>
              </div>
            ) : null}
            {tab === 'mushrooms' ? (
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 mb-5 text-sm text-amber-100/90 leading-relaxed">
                <p className="text-xs font-black uppercase tracking-widest text-amber-300 mb-2">Edible wild mushrooms</p>
                <p>
                  <strong className="text-white">{mushroomFiltered.length}+ species</strong> across Oregon and Northern
                  California — chanterelles, boletes, morels, hedgehogs, and more. Every entry includes three ID photos,
                  toxic look-alikes, and cooking notes. <strong className="text-white">Never eat a wild mushroom without 100% ID.</strong>
                </p>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    tab === 'edibles'
                      ? 'Search berries, greens, roots…'
                      : tab === 'mushrooms'
                        ? 'Search chanterelles, boletes, morels…'
                        : 'Search plants, Latin names, habitat…'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionFilter)}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
              >
                {REGION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {tab === 'plants' ? (
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
              ) : null}
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

            {userLocation && !regionSupported ? (
              <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 p-5 mb-5 text-sm text-sky-100/90">
                <p className="text-xs font-black uppercase tracking-widest text-sky-300 mb-2">
                  {userLocation.state} is not in the living knowledge base yet
                </p>
                <p className="leading-relaxed">
                  We do not have localized plants for {locationLabel(userLocation)} yet. Add your state for{' '}
                  <strong className="text-white">${STATE_CONTRIBUTION_USD}</strong> in Hive credits — your field guide
                  becomes available to everyone in the app.
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
              {tab === 'edibles' ? 'edible wild foods' : tab === 'mushrooms' ? 'edible mushrooms' : 'plants in library'}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantsToShow.map((plant) => (
                <article
                  key={plant.id}
                  className={`group rounded-xl border bg-slate-900/60 overflow-hidden transition-colors cursor-pointer ${
                    tab === 'edibles'
                      ? 'border-slate-800 hover:border-lime-500/40'
                      : tab === 'mushrooms'
                        ? 'border-slate-800 hover:border-amber-500/40'
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${useBadgeClass(plant.uses)}`}>
                        {useLabel(plant.uses)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAskAiPlant(plant);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 hover:text-emerald-200"
                      >
                        <Sparkles className="w-3 h-3" />
                        Ask AI AiBhive
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {tab === 'pdfs' ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100/90 leading-relaxed">
              <p className="text-xs font-black uppercase tracking-widest text-violet-300 mb-2">What these PDFs cover</p>
              <p>
                Downloadable references for <strong className="text-white">Oregon law</strong>,{' '}
                <strong className="text-white">wild mushroom identification</strong>, and{' '}
                <strong className="text-white">PNW plant botany</strong>. They intentionally{' '}
                <strong className="text-white">do not</strong> include psilocybin cultivation steps — educational
                law and field-ID reference only.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {OREGON_PLANT_PDF_GUIDES.map((g) => (
                <article
                  key={g.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-violet-500/15 shrink-0">
                      <FileText className="w-6 h-6 text-violet-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">{g.pages}</p>
                      <h2 className="font-bold text-white mt-0.5 leading-snug">{g.title}</h2>
                      <p className="text-xs text-slate-400 mt-1">{g.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mt-4 leading-relaxed flex-1">{g.description}</p>
                  <ul className="flex flex-wrap gap-1.5 mt-3">
                    {g.topics.map((t) => (
                      <li
                        key={t}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-200/80 mt-3 border-t border-slate-800 pt-3">{g.scopeNote}</p>
                  <a
                    href={g.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-3 text-sm transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Open PDF
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === 'resources' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Curated external guides with photos and identification help. Links open in a new tab — for private
              study only.
            </p>
            {EXTERNAL_RESOURCE_LIBRARY.map((cat) => (
              <section key={cat.id} className="rounded-xl border border-emerald-500/20 bg-slate-900/40 overflow-hidden">
                <div className="p-4 border-b border-emerald-500/10">
                  <h2 className="font-bold text-emerald-300">{cat.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                </div>
                <ul className="divide-y divide-slate-800">
                  {cat.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-4 hover:bg-white/[0.03] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-white">{link.label}</p>
                          {link.description ? (
                            <p className="text-xs text-slate-400 mt-0.5">{link.description}</p>
                          ) : null}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {tab === 'guide' ? (
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed max-w-3xl">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-2">
                {LIVING_KNOWLEDGE_APP_NAME}
              </p>
              <p className="text-emerald-100/90">
                This is a <strong className="text-white">living knowledge base</strong> — starting in Oregon and open to
                new states as contributors document local edibles and homeopathic remedies. Share photos on plant pages,
                or tap <strong className="text-white">Contribute</strong> to publish new species and regions for
                everyone.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Important disclaimer
              </p>
              <p className="mt-2 text-amber-100/90">
                This library is for <strong>private educational use</strong> only. It is not medical advice. Never
                consume or apply a plant unless you are 100% certain of identification. Many edible plants have toxic
                lookalikes. Consult a qualified herbalist or healthcare provider before using plants medicinally.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-black text-white mb-2">Eugene &amp; Willamette Valley</h2>
              <p>
                The valley floor and coast-range foothills offer rich riparian corridors (Willamette River, Amazon
                Creek), oak savanna at Buford Park, and wetland edges perfect for nettle, miner&apos;s lettuce, Oregon
                grape, and cottonwood. Spring (March–May) is peak green foraging season.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white mb-2">Florence &amp; Oregon Coast</h2>
              <p>
                From the Siuslaw River estuary to the Oregon Dunes, expect salal, evergreen huckleberry, beach
                strawberry, licorice fern on mossy maples, and chanterelles in fall. Coastal plants tolerate salt spray
                and sand — very different from valley species 60 miles inland.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white mb-2">Edible wild foods — fruit &amp; preparation</h2>
              <p className="mb-3">
                Open the <strong className="text-lime-300">Edibles</strong> tab for the full wild-food library — berries,
                greens, mushrooms, and roots with three ID photos each. Below are seasonal highlights for Eugene and
                Florence.
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>
                  <strong className="text-slate-200">Spring greens</strong> — nettle, miner&apos;s lettuce, chickweed,
                  lamb&apos;s quarters, Douglas fir tips (April–May).
                </li>
                <li>
                  <strong className="text-slate-200">Summer berries</strong> — salmonberry, thimbleberry, trailing
                  blackberry, serviceberry, red huckleberry (May–August).
                </li>
                <li>
                  <strong className="text-slate-200">Fall fruit &amp; fungi</strong> — evergreen huckleberry, salal,
                  Nootka rose hips, chanterelles, and coastal crabapple jelly (Sep–Nov).
                </li>
                <li>
                  <strong className="text-slate-200">Prep basics</strong> — cook all wild mushrooms; blanch nettle;
                  strain rose hip hairs; never eat cattail from polluted water.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white mb-2">Hallucinogenics — legal &amp; safety</h2>
              <p className="mb-3">
                The library includes a separate <strong className="text-violet-300">Hallucinogenic</strong> filter for
                psilocybin mushrooms, muscimol Amanita species, and deliriant plants documented in western Oregon. This
                is <strong className="text-slate-200">educational reference only</strong> — not encouragement to harvest
                or consume.
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>
                  <strong className="text-slate-200">Oregon law</strong> — psilocybin is legal only in licensed service
                  centers, not for casual wild foraging possession.
                </li>
                <li>
                  <strong className="text-slate-200">Mushroom ID</strong> — wood-chip psilocybes have deadly Galerina
                  lookalikes. Use spore prints and expert confirmation.
                </li>
                <li>
                  <strong className="text-slate-200">Amanita</strong> — fly agaric and panther cap are not psilocybin;
                  raw consumption causes severe poisoning.
                </li>
                <li>
                  <strong className="text-slate-200">Jimsonweed</strong> — extremely dangerous deliriant; never ingest.
                </li>
              </ul>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                {OREGON_PLANT_PDF_GUIDES.map((g) => (
                  <a
                    key={g.id}
                    href={g.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    {g.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black text-white mb-2">Holistic plant medicine basics</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>
                  <strong className="text-slate-200">Food as medicine</strong> — nettle, dandelion, and berries nourish
                  while supporting wellness.
                </li>
                <li>
                  <strong className="text-slate-200">Bitter tonics</strong> — Oregon grape root stimulates digestion
                  (use sustainably).
                </li>
                <li>
                  <strong className="text-slate-200">First-aid plants</strong> — yarrow and plantain for minor wounds on
                  the trail.
                </li>
                <li>
                  <strong className="text-slate-200">Mushrooms</strong> — always confirm with expert ID; chanterelle
                  vs. jack-o-lantern is life or death.
                </li>
                <li>
                  <strong className="text-slate-200">Sustainable harvest</strong> — take less than 10%, never uproot
                  unless abundant, know land rules.
                </li>
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      {selected ? (
        <PlantDetail
          plant={selected}
          onClose={() => setSelected(null)}
          user={user}
          onSignIn={() => void handleSignIn()}
          onAskAi={() => setAskAiPlant(selected)}
        />
      ) : null}
      {askAiPlant ? (
        <PlantAskAiPanel
          plant={askAiPlant}
          user={user}
          onSignIn={() => void handleSignIn()}
          onClose={() => setAskAiPlant(null)}
        />
      ) : null}
      {showProfile && user ? (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(p) => setProfile(p)}
        />
      ) : null}
      {showContribute ? (
        <ContributeModal
          onClose={() => setShowContribute(false)}
          stateName={userLocation && !regionSupported ? userLocation.state : undefined}
          city={userLocation?.city}
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
