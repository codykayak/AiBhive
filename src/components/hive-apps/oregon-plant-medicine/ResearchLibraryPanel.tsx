import type { User } from 'firebase/auth';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, ExternalLink, PlusCircle, Sprout, X } from 'lucide-react';
import type { FeaturedEssay } from '../../../lib/oregonPlantMedicine/featuredEssays';
import type { LivingKnowledgeScope } from '../../../lib/oregonPlantMedicine/livingKnowledgeRag';
import type { TopicLibraryId } from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import type { ResearchTopicBase } from '../../../lib/oregonPlantMedicine/topicLibraryTypes';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { SectionVideo } from '../../../lib/oregonPlantMedicine/sectionVideos';
import type { AskAiContext } from './AskAiBhivePanel';
import FeaturedEssayPanel from './FeaturedEssayPanel';
import GridSectionVideo from './GridSectionVideo';
import { interleaveFeaturedTile } from './gridFeaturedInsert';
import HolisticAskAgent from './HolisticAskAgent';
import PostEngagementBar from './PostEngagementBar';
import ResearchTopicImage from './ResearchTopicImage';
import TopicCommunityPanel from './TopicCommunityPanel';

export type ResearchLibraryTheme = {
  introBorder: string;
  introBg: string;
  introText: string;
  introLabel: string;
  cardHover: string;
  categoryLabel: string;
  accentButton: string;
  detailBorder: string;
  sectionLabel: string;
  contributeBorder: string;
  contributeText: string;
  communityAccent: string;
  searchFocus: string;
  videoAccent: string;
  videoBorder: string;
};

type Props<T extends ResearchTopicBase & { category: string }> = {
  library: TopicLibraryId;
  tabLabel: string;
  introText: ReactNode;
  searchPlaceholder: string;
  topics: T[];
  categoryLabels: Record<string, string>;
  categoryOrder: readonly string[];
  matchesCategory: (topic: T, category: string | 'all') => boolean;
  theme: ResearchLibraryTheme;
  user: User | null;
  onSignIn: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onCreatePost: () => void;
  onAskAi: (ctx: AskAiContext) => void;
  gridVideo?: SectionVideo;
  featuredEssay?: FeaturedEssay;
  focusTopicId?: string | null;
  onFocusTopicConsumed?: () => void;
  /** Living Knowledge ask-agent scope (defaults from library id) */
  askScope?: LivingKnowledgeScope;
  askAccent?: 'emerald' | 'violet' | 'cyan' | 'rose' | 'lime' | 'amber' | 'teal';
  /** Text-only cards (e.g. supplements) — no hero images in grid or detail. */
  hideImages?: boolean;
};

function topicAskContext<T extends ResearchTopicBase>(topic: T, library: TopicLibraryId): AskAiContext {
  return {
    focusTitle: topic.title,
    contextText: [topic.title, topic.summary, topic.deepDive, topic.whenPeopleExplore, ...topic.approaches].join('\n'),
    library,
    topicId: topic.id,
  };
}

function TopicDetail<T extends ResearchTopicBase & { category: string }>({
  topic,
  library,
  categoryLabels,
  theme,
  user,
  onSignIn,
  onClose,
  onOpenPlant,
  onCreatePost,
  onAskAi,
  hideImages = false,
}: {
  topic: T;
  library: TopicLibraryId;
  categoryLabels: Record<string, string>;
  theme: ResearchLibraryTheme;
  user: User | null;
  onSignIn: () => void;
  onClose: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onCreatePost: () => void;
  onAskAi: (ctx: AskAiContext) => void;
  hideImages?: boolean;
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
      <div
        className={`bg-slate-950 border ${theme.detailBorder} rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl`}
      >
        {hideImages ? (
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.categoryLabel}`}>
              {categoryLabels[topic.category]}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
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
        )}

        <div className={`p-5 border-b border-white/10 ${hideImages ? 'pt-0' : ''}`}>
          {hideImages ? null : (
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.categoryLabel}`}>
              {categoryLabels[topic.category]}
            </p>
          )}
          <h2 className={`text-xl font-black text-white ${hideImages ? '' : 'mt-1'}`}>{topic.title}</h2>
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
            <p className={`text-xs font-black uppercase tracking-widest ${theme.sectionLabel}`}>
              Common approaches discussed
            </p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              {topic.approaches.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          {relatedPlants.length > 0 ? (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
                Related plants &amp; fungi
              </p>
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

          <TopicCommunityPanel
            library={library}
            topicId={topic.id}
            user={user}
            onSignIn={onSignIn}
            accentClass={theme.communityAccent}
          />

          <PostEngagementBar
            target={{ kind: 'topic', library, topicId: topic.id }}
            user={user}
            onSignIn={onSignIn}
            onAskAi={() => onAskAi(topicAskContext(topic, library))}
          />

          <button
            type="button"
            onClick={onCreatePost}
            className={`w-full mt-2 py-2.5 rounded-lg border ${theme.contributeBorder} ${theme.contributeText} text-xs font-bold hover:bg-white/5`}
          >
            Share a community post
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResearchLibraryPanel<T extends ResearchTopicBase & { category: string }>({
  library,
  tabLabel,
  introText,
  searchPlaceholder,
  topics,
  categoryLabels,
  categoryOrder,
  matchesCategory,
  theme,
  user,
  onSignIn,
  onOpenPlant,
  onCreatePost,
  onAskAi,
  gridVideo,
  featuredEssay,
  focusTopicId,
  onFocusTopicConsumed,
  askScope,
  askAccent = 'cyan',
  hideImages = false,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [selected, setSelected] = useState<T | null>(null);
  const agentScope: LivingKnowledgeScope = askScope ?? library;

  useEffect(() => {
    if (!focusTopicId) return;
    const topic = topics.find((t) => t.id === focusTopicId);
    if (topic) setSelected(topic);
    onFocusTopicConsumed?.();
  }, [focusTopicId, topics, onFocusTopicConsumed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      if (!matchesCategory(t, category)) return false;
      if (!q) return true;
      const hay = [t.title, t.summary, t.deepDive, t.whenPeopleExplore, ...t.approaches].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, category, topics, matchesCategory]);

  const topicCards = filtered.map((topic) => (
    <article
      key={topic.id}
      role="button"
      tabIndex={0}
      onClick={() => setSelected(topic)}
      onKeyDown={(e) => e.key === 'Enter' && setSelected(topic)}
      className={`group rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden cursor-pointer transition-colors text-left flex flex-col ${theme.cardHover}`}
    >
      {hideImages ? null : (
        <div className="relative h-36 overflow-hidden">
          <ResearchTopicImage
            src={topic.imageUrl}
            alt={topic.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3 flex-1 flex flex-col">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.categoryLabel}`}>
          {categoryLabels[topic.category]}
        </p>
        <h3 className="font-bold text-white mt-1 leading-snug line-clamp-2">{topic.title}</h3>
        <p className="text-xs text-slate-400 mt-2 line-clamp-3 flex-1">{topic.summary}</p>
        <div className="mt-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <PostEngagementBar
            target={{ kind: 'topic', library, topicId: topic.id }}
            user={user}
            onSignIn={onSignIn}
            stopPropagation
            onAskAi={() => onAskAi(topicAskContext(topic, library))}
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
        <div className={`rounded-xl border ${theme.introBorder} ${theme.introBg} p-4 text-sm ${theme.introText} leading-relaxed`}>
          <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme.introLabel}`}>{tabLabel}</p>
          {introText}
        </div>

        <HolisticAskAgent
          scope={agentScope}
          accent={askAccent}
          placeholder={searchPlaceholder}
          onQueryChange={setQuery}
          user={user}
          onSignIn={onSignIn}
          onContribute={() => onCreatePost()}
          onOpenPlant={(plantId) => {
            const plant = PLANT_LIBRARY.find((p) => p.id === plantId);
            if (plant) onOpenPlant(plant);
          }}
          onOpenTopic={(topicId, topicLibrary) => {
            if (topicLibrary !== library) return;
            const topic = topics.find((t) => t.id === topicId);
            if (topic) setSelected(topic);
          }}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white flex-1"
          >
            <option value="all">All categories</option>
            {categoryOrder.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onCreatePost}
            className={`inline-flex items-center justify-center gap-2 rounded-xl text-white font-bold px-4 py-2.5 text-sm shrink-0 ${theme.accentButton}`}
          >
            <PlusCircle className="w-4 h-4" />
            Share a post
          </button>
        </div>

        <p className="text-xs text-slate-500">{filtered.length} topics in library</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridVideo ? (
            <GridSectionVideo
              video={gridVideo}
              accentClass={theme.videoAccent}
              borderClass={theme.videoBorder}
            />
          ) : null}
          {gridItems}
        </div>
      </div>

      {selected ? (
        <TopicDetail
          topic={selected}
          library={library}
          categoryLabels={categoryLabels}
          theme={theme}
          user={user}
          onSignIn={onSignIn}
          onClose={() => setSelected(null)}
          onOpenPlant={onOpenPlant}
          onCreatePost={onCreatePost}
          onAskAi={onAskAi}
          hideImages={hideImages}
        />
      ) : null}
    </>
  );
}
