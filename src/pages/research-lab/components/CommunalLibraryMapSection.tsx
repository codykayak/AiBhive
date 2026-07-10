import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, ArrowRight } from 'lucide-react';
import StartResearchingButton from './StartResearchingButton';
import { COMMUNAL_TOPICS, getCommunalTopic } from '../communalLibraryTopics';
import styles from '../researchLab.module.css';

const CommunalKnowledgeMap = lazy(() => import('./CommunalKnowledgeMap'));

type Props = {
  /** Landing page uses h2 so the page keeps a single h1. */
  headingLevel?: 'h1' | 'h2';
  /** Show link to the full Communal Library page. */
  showFullLibraryCta?: boolean;
  className?: string;
  /** Controlled selected topic (optional). */
  selectedId?: string | null;
  /** Called when a topic node is selected. */
  onSelectTopic?: (id: string) => void;
  /** Override lead copy. */
  lead?: string;
};

/**
 * “One library. Infinite trails.” hero + interactive Three.js topic map.
 * Shared by Communal Library page and Research Lab landing (above pricing).
 */
export default function CommunalLibraryMapSection({
  headingLevel = 'h1',
  showFullLibraryCta = false,
  className,
  selectedId: controlledId,
  onSelectTopic,
  lead,
}: Props) {
  const [internalId, setInternalId] = useState<string | null>('tartarian');
  const [liveStats, setLiveStats] = useState<Record<string, number>>({});
  const selectedId = controlledId !== undefined ? controlledId : internalId;

  const topicsWithLive = useMemo(
    () =>
      COMMUNAL_TOPICS.map((t) => ({
        ...t,
        docs: Math.max(t.docs, liveStats[t.id] || 0),
        liveDocs: liveStats[t.id] || 0,
      })),
    [liveStats],
  );

  const selected =
    selectedId ? topicsWithLive.find((t) => t.id === selectedId) || getCommunalTopic(selectedId) : null;
  const totalDocs = useMemo(
    () => topicsWithLive.reduce((sum, t) => sum + t.docs, 0),
    [topicsWithLive],
  );
  const liveTotal = useMemo(
    () => Object.values(liveStats).reduce((s, n) => s + n, 0),
    [liveStats],
  );

  useEffect(() => {
    void fetch('/api/research-lab/library/topics')
      .then((r) => r.json())
      .then((d) => setLiveStats(d.stats || {}))
      .catch(() => setLiveStats({}));
  }, []);

  function selectTopic(id: string) {
    if (controlledId === undefined) setInternalId(id);
    onSelectTopic?.(id);
  }

  const TitleTag = headingLevel;

  return (
    <div className={`${styles.rlLibPreview}${className ? ` ${className}` : ''}`}>
      <header className={styles.rlLibHero}>
        <p className={styles.rlLibEyebrow}>Research Lab · Communal Library</p>
        <TitleTag className={styles.rlLibTitle}>
          One library. <span>Infinite trails.</span>
        </TitleTag>
        <p className={styles.rlLibLead}>
          {lead ||
            'A living knowledge lattice — rotate the map, open a topic, and follow document trails other researchers already paved. Every contribution compounds the shared wealth of the hive.'}
        </p>
        <div className={styles.rlLibHeroStats}>
          <div>
            <strong>{COMMUNAL_TOPICS.length}</strong>
            <span>topic nodes</span>
          </div>
          <div>
            <strong>{totalDocs.toLocaleString()}</strong>
            <span>mapped documents</span>
          </div>
          <div>
            <strong>{liveTotal > 0 ? liveTotal.toLocaleString() : '∞'}</strong>
            <span>{liveTotal > 0 ? 'live published' : 'community forks'}</span>
          </div>
        </div>
      </header>

      <section className={styles.rlLibMapSection} aria-label="3D knowledge map">
        <div className={styles.rlLibMapFrame}>
          <Suspense
            fallback={
              <div className={styles.rlLibMapFallback}>
                <Library className="w-8 h-8 text-bee-amber animate-pulse" />
                <p>Loading knowledge lattice…</p>
              </div>
            }
          >
            <CommunalKnowledgeMap
              selectedId={selectedId}
              onSelect={selectTopic}
              topics={topicsWithLive}
            />
          </Suspense>
        </div>

        <aside className={styles.rlLibDetail} aria-live="polite">
          {selected ? (
            <>
              <p className={styles.rlLibDetailKicker}>Selected node</p>
              <h3 className={styles.rlLibDetailHeading}>{selected.label}</h3>
              <p className={styles.rlLibDocCount}>
                <button
                  type="button"
                  className={styles.rlLibDocBtn}
                  onClick={() => selectTopic(selected.id)}
                >
                  {selected.docs.toLocaleString()} documents
                  {'liveDocs' in selected && (selected as { liveDocs?: number }).liveDocs
                    ? ` · ${(selected as { liveDocs: number }).liveDocs} live`
                    : ''}
                </button>
              </p>
              <p>{selected.blurb}</p>
              <div className={styles.rlLibRelated}>
                <p>Connected topics</p>
                <div className={styles.rlLibChips}>
                  {selected.links.map((id) => {
                    const t = topicsWithLive.find((x) => x.id === id) || getCommunalTopic(id);
                    if (!t) return null;
                    return (
                      <button key={id} type="button" onClick={() => selectTopic(id)}>
                        {t.label}
                        <span>{t.docs.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.rlLibPreviewActions}>
                <StartResearchingButton size="md" />
                {showFullLibraryCta && (
                  <Link className={styles.rlWsCommunalCta} to="/research-lab/communal-library">
                    Open full Communal Library
                    <ArrowRight className="w-4 h-4 inline ml-1" aria-hidden />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className={styles.rlLibDetailEmpty}>Click a glowing node to open its corpus.</p>
          )}
        </aside>
      </section>
    </div>
  );
}
