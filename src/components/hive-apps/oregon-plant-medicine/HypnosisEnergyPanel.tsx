import { useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, PlusCircle, Search, Sparkles, Sprout, X } from 'lucide-react';
import {
  HYPNOSIS_ENERGY_CATEGORY_ORDER,
  HYPNOSIS_ENERGY_LIBRARY,
  matchesHypnosisEnergyCategory,
} from '../../../lib/oregonPlantMedicine/hypnosisEnergyLibrary';
import {
  HYPNOSIS_ENERGY_CATEGORY_LABELS,
  type HypnosisEnergyCategory,
  type HypnosisEnergyTopic,
} from '../../../lib/oregonPlantMedicine/hypnosisEnergyTypes';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import { HYPNOSIS_ENERGY_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';

type CategoryFilter = HypnosisEnergyCategory | 'all';

type Props = {
  onOpenPlant: (plant: PlantEntry) => void;
  onContribute: (topicTitle?: string) => void;
};

function TopicDetail({
  topic,
  onClose,
  onOpenPlant,
  onContribute,
}: {
  topic: HypnosisEnergyTopic;
  onClose: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onContribute: (topicTitle?: string) => void;
}) {
  const relatedPlants = useMemo(
    () =>
      topic.relatedPlantIds
        .map((id) => PLANT_LIBRARY.find((p) => p.id === id))
        .filter((p): p is PlantEntry => !!p),
    [topic.relatedPlantIds],
  );

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-950 border border-cyan-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              {HYPNOSIS_ENERGY_CATEGORY_LABELS[topic.category]}
            </p>
            <h2 className="text-xl font-black text-white mt-1 pr-4">{topic.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-300 leading-relaxed">
          <p className="text-slate-200">{topic.summary}</p>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Why people explore this</p>
            <p className="mt-1">{topic.whenPeopleExplore}</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Common approaches discussed</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              {topic.approaches.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          {relatedPlants.length > 0 ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Related plants &amp; fungi</p>
              <div className="flex flex-wrap gap-2">
                {relatedPlants.map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPlant(plant);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    {plant.commonName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {topic.safetyWarnings.length > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Safety
              </p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-amber-100/90">
                {topic.safetyWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {topic.sources.length > 0 ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Sources</p>
              <ul className="space-y-2">
                {topic.sources.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-emerald-300 hover:text-emerald-200 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {link.label}
                        {link.description ? (
                          <span className="block text-xs text-slate-500 mt-0.5">{link.description}</span>
                        ) : null}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onContribute(topic.title)}
            className="w-full mt-2 py-2.5 rounded-lg border border-cyan-500/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/10"
          >
            Expand this topic — contribute research
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HypnosisEnergyPanel({ onOpenPlant, onContribute }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selected, setSelected] = useState<HypnosisEnergyTopic | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HYPNOSIS_ENERGY_LIBRARY.filter((t) => {
      if (!matchesHypnosisEnergyCategory(t, category)) return false;
      if (!q) return true;
      const hay = [t.title, t.summary, t.whenPeopleExplore, ...t.approaches].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100/90 leading-relaxed">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {HYPNOSIS_ENERGY_TAB_LABEL}
          </p>
          <p>
            Past life regression, Edgar Cayce, Dolores Cannon&apos;s QHHT, modern clinical hypnotherapy, Reiki, chakra
            work, tuning forks, singing bowls, and healing frequencies — researched for education.{' '}
            <strong className="text-white">Not therapy or medical care.</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search regression, Reiki, Solfeggio, QHHT…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
          >
            <option value="all">All categories</option>
            {HYPNOSIS_ENERGY_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {HYPNOSIS_ENERGY_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onContribute()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 text-sm shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Add research
          </button>
        </div>

        <p className="text-xs text-slate-500">{filtered.length} topics in library</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((topic) => (
            <article
              key={topic.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(topic)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(topic)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 cursor-pointer hover:border-cyan-500/40 transition-colors text-left"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                {HYPNOSIS_ENERGY_CATEGORY_LABELS[topic.category]}
              </p>
              <h3 className="font-bold text-white mt-1 leading-snug">{topic.title}</h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3">{topic.summary}</p>
            </article>
          ))}
        </div>
      </div>

      {selected ? (
        <TopicDetail
          topic={selected}
          onClose={() => setSelected(null)}
          onOpenPlant={onOpenPlant}
          onContribute={onContribute}
        />
      ) : null}
    </>
  );
}
