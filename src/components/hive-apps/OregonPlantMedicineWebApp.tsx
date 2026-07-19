import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Leaf,
  MapPin,
  Search,
  Sprout,
  Star,
  X,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  EXTERNAL_RESOURCE_LIBRARY,
  PLANT_LIBRARY,
  matchesRegion,
  regionLabel,
} from '../../lib/oregonPlantMedicine/plantLibrary';
import type { PlantEntry, PlantImage, PlantUse } from '../../lib/oregonPlantMedicine/types';

type Props = { expanded?: boolean };

type Tab = 'plants' | 'resources' | 'guide';
type RegionFilter = 'all' | 'eugene' | 'florence';
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

function ImageGallery({ images, name }: { images: PlantImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  if (!current) return null;

  return (
    <>
      <img
        src={current.url}
        alt={`${name} — ${current.caption ?? 'identification photo'}`}
        className="w-full h-48 sm:h-56 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
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
              <img
                src={img.url}
                alt=""
                className="w-20 h-14 object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

function PlantDetail({ plant, onClose }: { plant: PlantEntry; onClose: () => void }) {
  const images = allImages(plant);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-950 border border-emerald-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative">
          <ImageGallery images={images} name={plant.commonName} />
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

          <DetailSection title="Habitat" text={plant.habitat} />
          <DetailSection title="Identification" text={plant.identification} />
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
        </div>
      </div>
    </div>
  );
}

/** Oregon Plant Medicine — private regional foraging & holistic herbal library. */
export default function OregonPlantMedicineWebApp({ expanded }: Props) {
  const brand = brandFor('green');
  const [tab, setTab] = useState<Tab>('plants');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [useFilter, setUseFilter] = useState<UseFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [selected, setSelected] = useState<PlantEntry | null>(null);

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

  return (
    <div className={shellClass}>
      <header className={`border-b border-emerald-500/20 ${expanded ? 'px-4 sm:px-8 py-6' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${brand.bg} shrink-0`}>
            <Leaf className={`w-6 h-6 ${brand.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Private library</p>
            <h1 className="text-xl sm:text-2xl font-black text-white">Oregon Plant Medicine</h1>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Edible, medicinal &amp; hallucinogenic plants of Eugene and Florence, Oregon — holistic reference with
              external guides and multi-photo ID.
            </p>
          </div>
        </div>

        <nav className="flex gap-2 mt-4 flex-wrap">
          {(
            [
              ['plants', 'Plant library', Sprout],
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
        {tab === 'plants' ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search plants, Latin names, habitat…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionFilter)}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
              >
                <option value="all">All regions</option>
                <option value="eugene">Eugene / Valley</option>
                <option value="florence">Florence / Coast</option>
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

            <p className="text-xs text-slate-500 mb-4">{filtered.length} plants in library</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((plant) => (
                <article
                  key={plant.id}
                  className="group rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-emerald-500/40 transition-colors cursor-pointer"
                  onClick={() => setSelected(plant)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(plant)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={plant.imageUrl}
                      alt={plant.commonName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
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
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${useBadgeClass(plant.uses)}`}>
                        {useLabel(plant.uses)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
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

      {selected ? <PlantDetail plant={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
