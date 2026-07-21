import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  HeartPulse,
  PlusCircle,
  Sprout,
  X,
} from 'lucide-react';
import {
  HOLISTIC_CATEGORY_ORDER,
  HOLISTIC_LIBRARY,
  matchesHolisticCategory,
} from '../../../lib/oregonPlantMedicine/holisticLibrary';
import {
  HOLISTIC_CATEGORY_LABELS,
  type HolisticCategory,
  type HolisticTopic,
} from '../../../lib/oregonPlantMedicine/holisticTypes';
import { getFeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import { HOLISTIC_TAB_LABEL } from '../../../lib/oregonPlantMedicine/branding';
import { SECTION_VIDEOS } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import FeaturedEssayPanel from './FeaturedEssayPanel';
import GridSectionVideo from './GridSectionVideo';
import HolisticAskAgent from './HolisticAskAgent';
import ResearchTopicImage from './ResearchTopicImage';
import TopicCommunityPanel from './TopicCommunityPanel';
import PostEngagementBar from './PostEngagementBar';
import type { AskAiContext } from './AskAiBhivePanel';
import { interleaveFeaturedTile } from './gridFeaturedInsert';
import type { User } from 'firebase/auth';

type CategoryFilter = HolisticCategory | 'all';

type Props = {
  user: User | null;
  onSignIn: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onCreatePost: () => void;
  onAskAi: (ctx: AskAiContext) => void;
  onContribute?: (query?: string) => void;
  focusTopicId?: string | null;
  onFocusTopicConsumed?: () => void;
};

function HolisticTopicDetail({
  topic,
  onClose,
  onOpenPlant,
  onCreatePost,
  user,
  onSignIn,
  onAskAi,
}: {
  topic: HolisticTopic;
  onClose: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onCreatePost: () => void;
  user: User | null;
  onSignIn: () => void;
  onAskAi: (ctx: AskAiContext) => void;
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
      <div className="bg-slate-950 border border-violet-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative">
          <ResearchTopicImage
            src={topic.imageUrl}
            alt={topic.title}
            className="w-full h-44 sm:h-52 object-cover"
          />
          {topic.imageCredit ? (
            <p className="absolute bottom-2 left-3 right-12 text-[10px] text-white/75 bg-black/50 px-2 py-1 rounded pointer-events-none">
              {topic.imageCredit}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-violet-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">
            {HOLISTIC_CATEGORY_LABELS[topic.category]}
          </p>
          <h2 className="text-xl font-black text-white mt-1">{topic.title}</h2>
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-300 leading-relaxed">
          <p className="text-slate-200 font-medium">{topic.summary}</p>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Deep dive</p>
            <div className="mt-2 space-y-3 whitespace-pre-line">{topic.deepDive}</div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Why people explore this</p>
            <p className="mt-1">{topic.whenPeopleExplore}</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-400">Common approaches discussed</p>
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

          {topic.pdfLinks?.length ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-2">PDF guides</p>
              <div className="space-y-2">
                {topic.pdfLinks.map((pdf) => (
                  <a
                    key={pdf.pdfUrl}
                    href={pdf.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    {pdf.title}
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ))}
              </div>
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

          <TopicCommunityPanel library="holistic" topicId={topic.id} user={user} onSignIn={onSignIn} accentClass="text-violet-300" />

          <PostEngagementBar
            target={{ kind: 'topic', library: 'holistic', topicId: topic.id }}
            user={user}
            onSignIn={onSignIn}
            onAskAi={() =>
              onAskAi({
                focusTitle: topic.title,
                contextText: [topic.title, topic.summary, topic.deepDive, topic.whenPeopleExplore, ...topic.approaches].join('\n'),
                library: 'holistic',
                topicId: topic.id,
              })
            }
          />

          <button
            type="button"
            onClick={onCreatePost}
            className="w-full mt-2 py-2.5 rounded-lg border border-violet-500/40 text-violet-200 text-xs font-bold hover:bg-violet-500/10"
          >
            Share a community post
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HolisticRemediesPanel({
  user,
  onSignIn,
  onOpenPlant,
  onCreatePost,
  onAskAi,
  onContribute,
  focusTopicId,
  onFocusTopicConsumed,
}: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selected, setSelected] = useState<HolisticTopic | null>(null);
  const featuredEssay = getFeaturedEssay('holistic');

  useEffect(() => {
    if (!focusTopicId) return;
    const topic = HOLISTIC_LIBRARY.find((t) => t.id === focusTopicId);
    if (topic) setSelected(topic);
    onFocusTopicConsumed?.();
  }, [focusTopicId, onFocusTopicConsumed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HOLISTIC_LIBRARY.filter((t) => {
      if (!matchesHolisticCategory(t, category)) return false;
      if (!q) return true;
      const hay = [t.title, t.summary, t.deepDive, t.whenPeopleExplore, ...t.approaches].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  const topicCards = filtered.map((topic) => (
    <article
      key={topic.id}
      role="button"
      tabIndex={0}
      onClick={() => setSelected(topic)}
      onKeyDown={(e) => e.key === 'Enter' && setSelected(topic)}
      className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden cursor-pointer hover:border-violet-500/40 transition-colors text-left flex flex-col"
    >
      <div className="relative h-36 overflow-hidden">
        <ResearchTopicImage
          src={topic.imageUrl}
          alt={topic.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
          {HOLISTIC_CATEGORY_LABELS[topic.category]}
        </p>
        <h3 className="font-bold text-white mt-1 leading-snug line-clamp-2">{topic.title}</h3>
        <p className="text-xs text-slate-400 mt-2 line-clamp-3 flex-1">{topic.summary}</p>
      <div className="mt-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <PostEngagementBar
          target={{ kind: 'topic', library: 'holistic', topicId: topic.id }}
          user={user}
          onSignIn={onSignIn}
          stopPropagation
          onAskAi={() =>
            onAskAi({
              focusTitle: topic.title,
              contextText: [topic.title, topic.summary, topic.deepDive, topic.whenPeopleExplore, ...topic.approaches].join('\n'),
              library: 'holistic',
              topicId: topic.id,
            })
          }
        />
      </div>
      </div>
    </article>
  ));

  const gridItems = interleaveFeaturedTile(
    topicCards,
    featuredEssay ? (
      <FeaturedEssayPanel
        key="featured-essay"
        essay={featuredEssay}
        onOpenPlant={onOpenPlant}
        user={user}
        onSignIn={onSignIn}
        onAskAi={onAskAi}
      />
    ) : null,
  );

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100/90 leading-relaxed">
          <p className="text-xs font-black uppercase tracking-widest text-violet-300 mb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4" />
            {HOLISTIC_TAB_LABEL}
          </p>
          <p>
            PNW materia medica, detox overviews, and traditional protocols — Edgar Cayce–inspired remedies, gentle
            cleansing, and safety notes. <strong className="text-white">Not medical advice.</strong> Cross-linked to our
            plant library where relevant.
          </p>
        </div>

        <HolisticAskAgent
          scope="holistic"
          accent="violet"
          placeholder="Ask about detox, Cayce, nervines, sleep, protocols…"
          onQueryChange={setQuery}
          user={user}
          onSignIn={onSignIn}
          onContribute={onContribute ?? (() => onCreatePost())}
          onOpenPlant={(plantId) => {
            const plant = PLANT_LIBRARY.find((p) => p.id === plantId);
            if (plant) onOpenPlant(plant);
          }}
          onOpenTopic={(topicId, library) => {
            if (library !== 'holistic') return;
            const topic = HOLISTIC_LIBRARY.find((t) => t.id === topicId);
            if (topic) setSelected(topic);
          }}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white flex-1"
          >
            <option value="all">All categories</option>
            {HOLISTIC_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {HOLISTIC_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onCreatePost}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2.5 text-sm shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Share a post
          </button>
        </div>

        <p className="text-xs text-slate-500">{filtered.length} topics in library</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <GridSectionVideo
            video={SECTION_VIDEOS.holistic}
            accentClass="text-violet-300"
            borderClass="border-violet-500/35 hover:border-violet-500/50"
          />
          {gridItems}
        </div>
      </div>

      {selected ? (
        <HolisticTopicDetail
          topic={selected}
          onClose={() => setSelected(null)}
          onOpenPlant={onOpenPlant}
          onCreatePost={onCreatePost}
          user={user}
          onSignIn={onSignIn}
          onAskAi={onAskAi}
        />
      ) : null}
    </>
  );
}
