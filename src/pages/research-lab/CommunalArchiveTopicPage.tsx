import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Grid3X3,
  List,
  Loader2,
  Search,
  Library,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import ArchiveImageLightbox from '../../components/ArchiveImageLightbox';
import StartResearchingButton from './components/StartResearchingButton';
import { COMMUNAL_TOPICS, getCommunalTopic } from './communalLibraryTopics';
import { getSeedFindingsForTopic, type SeedFinding } from './communalArchiveSeedFindings';
import { auth } from '../../firebase';
import type { LibraryEntry } from '../fable-scrape/shared';
import styles from './researchLab.module.css';

type LiveEntry = LibraryEntry & {
  topicId?: string;
  visibility?: string;
  imageUrl?: string;
  provenance?: Record<string, unknown>;
};

type ArchiveCard = {
  id: string;
  title: string;
  creator: string;
  date: string;
  catalogId: string;
  imageUrl: string;
  sourceUrl: string;
  excerpt: string;
  relatedCount: number;
  live?: boolean;
};

function liveToCard(e: LiveEntry): ArchiveCard | null {
  const imageUrl = e.imageUrl || (e as { url?: string }).url || '';
  if (!imageUrl && !(e.ocrText || e.translation || e.reason)) return null;
  return {
    id: e.id,
    title: e.title || e.filename || 'Untitled finding',
    creator: e.contributor || 'Community',
    date: e.createdAt ? String(e.createdAt).slice(0, 10) : '—',
    catalogId: e.id.slice(0, 8),
    imageUrl: imageUrl || '',
    sourceUrl: String(e.provenance?.sourceUrl || e.sourceUrl || ''),
    excerpt: (e.translation || e.ocrText || e.reason || '').slice(0, 280),
    relatedCount: Number(e.correctionCount || 0),
    live: true,
  };
}

function seedToCard(s: SeedFinding): ArchiveCard {
  return {
    id: s.id,
    title: s.title,
    creator: s.creator,
    date: s.date,
    catalogId: s.catalogId,
    imageUrl: s.imageUrl,
    sourceUrl: s.sourceUrl,
    excerpt: s.excerpt,
    relatedCount: s.relatedCount || 0,
    live: false,
  };
}

export default function CommunalArchiveTopicPage() {
  const { topicId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const topic = getCommunalTopic(topicId);
  const viewParam = params.get('view') === 'list' ? 'list' : 'grid';
  const [view, setView] = useState<'grid' | 'list'>(viewParam);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [live, setLive] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<ArchiveCard | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setView(viewParam);
  }, [viewParam]);

  const loadLive = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
      }
      const qs = new URLSearchParams({ topicId, limit: '60' });
      if (q.trim()) qs.set('q', q.trim());
      const res = await fetch(`/api/research-lab/fable-scrape/library?${qs}`, { headers });
      const data = await res.json();
      setLive(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setLive([]);
    } finally {
      setLoading(false);
    }
  }, [topicId, q]);

  useEffect(() => {
    void loadLive();
  }, [loadLive]);

  const cards = useMemo(() => {
    const fromLive = live.map(liveToCard).filter(Boolean) as ArchiveCard[];
    const seeds = getSeedFindingsForTopic(topicId).map(seedToCard);
    const merged = [...fromLive, ...seeds];
    if (!q.trim()) return merged;
    const needle = q.trim().toLowerCase();
    return merged.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.creator.toLowerCase().includes(needle) ||
        c.excerpt.toLowerCase().includes(needle) ||
        c.catalogId.toLowerCase().includes(needle),
    );
  }, [live, topicId, q]);

  const related = useMemo(() => {
    if (!topic) return [];
    return topic.links
      .map((id) => getCommunalTopic(id))
      .filter(Boolean) as typeof COMMUNAL_TOPICS;
  }, [topic]);

  if (!topic) {
    return <Navigate to="/research-lab/communal-library" replace />;
  }

  function setViewMode(next: 'grid' | 'list') {
    setView(next);
    const sp = new URLSearchParams(params);
    if (next === 'list') sp.set('view', 'list');
    else sp.delete('view');
    setParams(sp, { replace: true });
  }

  return (
    <div className={styles.archPage}>
      <SEO
        title={`${topic.label} Archive · Communal Library · AiBhive`}
        description={topic.blurb}
        path={`/research-lab/communal-library/${topic.id}`}
      />

      <header className={styles.archTopBar}>
        <Link to="/research-lab/communal-library" className={styles.archBack}>
          <ArrowLeft className="w-4 h-4" /> Collections
        </Link>
        <nav className={styles.archNav} aria-label="Archive tools">
          <span>Explore</span>
          <span>Create</span>
          <Link to="/research-lab/workspace">Research</Link>
          <StartResearchingButton className={styles.archNavCta} />
        </nav>
      </header>

      <div className={styles.archLayout}>
        <aside className={styles.archRefine} aria-label="Refine">
          <h2>Refine</h2>
          <div className={styles.archFacet}>
            <h3>What</h3>
            <ul>
              <li>
                <button type="button" className={styles.archFacetActive}>
                  All media <span>{cards.length}</span>
                </button>
              </li>
              <li>
                <span>
                  Seed plates <span>{getSeedFindingsForTopic(topicId).length}</span>
                </span>
              </li>
              <li>
                <span>
                  Live publishes <span>{live.length}</span>
                </span>
              </li>
            </ul>
          </div>
          <div className={styles.archFacet}>
            <h3>Where · related domains</h3>
            <ul>
              {related.map((t) => (
                <li key={t.id}>
                  <Link to={`/research-lab/communal-library/${t.id}`}>{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.archFacet}>
            <h3>Browse lattice</h3>
            <ul className={styles.archTopicList}>
              {COMMUNAL_TOPICS.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/research-lab/communal-library/${t.id}`}
                    className={t.id === topic.id ? styles.archFacetActive : undefined}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className={styles.archMain}>
          <div className={styles.archResultsHead}>
            <div>
              <p className={styles.archKicker}>
                <Library className="w-3.5 h-3.5 inline mr-1" />
                Communal Library · Archive
              </p>
              <h1>
                Search Results: All Fields similar to &lsquo;{topic.label}&rsquo;
              </h1>
              <p className={styles.archBlurb}>{topic.blurb}</p>
            </div>
            <div className={styles.archToolbar}>
              <form
                className={styles.archSearch}
                onSubmit={(e) => {
                  e.preventDefault();
                  setQ(qDraft);
                }}
              >
                <Search className="w-4 h-4" aria-hidden />
                <input
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  placeholder="Filter titles, creators, excerpts…"
                  aria-label="Filter archive"
                />
              </form>
              <div className={styles.archViewToggle} role="group" aria-label="View mode">
                <button
                  type="button"
                  className={view === 'grid' ? styles.archViewActive : undefined}
                  onClick={() => setViewMode('grid')}
                  aria-pressed={view === 'grid'}
                  title="Large images"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={view === 'list' ? styles.archViewActive : undefined}
                  onClick={() => setViewMode('list')}
                  aria-pressed={view === 'list'}
                  title="List with thumbnails"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <p className={styles.archCount}>
                1–{cards.length} of {cards.length}
                {loading ? ' · updating…' : ''}
              </p>
            </div>
          </div>

          {loading && cards.length === 0 ? (
            <p className={styles.archLoading}>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Opening archive drawers…
            </p>
          ) : cards.length === 0 ? (
            <p className={styles.archEmpty}>No plates match this filter yet.</p>
          ) : (
            <ul className={view === 'grid' ? styles.archGrid : styles.archList}>
              {cards.map((c) => (
                <li key={c.id} className={view === 'grid' ? styles.archCard : styles.archListRow}>
                  <button
                    type="button"
                    className={styles.archThumbBtn}
                    onClick={() => setLightbox(c)}
                    aria-label={`Inspect ${c.title}`}
                  >
                    {c.imageUrl && !broken[c.id] ? (
                      <img
                        src={c.imageUrl}
                        alt={c.title}
                        loading="lazy"
                        onError={() => setBroken((b) => ({ ...b, [c.id]: true }))}
                      />
                    ) : (
                      <span className={styles.archThumbFallback}>No image</span>
                    )}
                  </button>
                  <div className={styles.archMeta}>
                    <p className={styles.archCreator}>{c.creator}</p>
                    <h2>
                      <button type="button" onClick={() => setLightbox(c)}>
                        {c.title}
                      </button>
                    </h2>
                    <p className={styles.archDateLine}>
                      {c.date}
                      <span>{c.catalogId}</span>
                      {c.live ? <em>live</em> : <em>seed</em>}
                    </p>
                    {view === 'list' && <p className={styles.archExcerpt}>{c.excerpt}</p>}
                    <p className={styles.archRelated}>
                      Related ({c.relatedCount})
                      {c.sourceUrl ? (
                        <>
                          {' · '}
                          <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                            Source <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      {lightbox && lightbox.imageUrl && (
        <ArchiveImageLightbox
          src={lightbox.imageUrl}
          alt={lightbox.title}
          title={lightbox.title}
          caption={`${lightbox.creator} · ${lightbox.date} — ${lightbox.excerpt}`}
          sourceUrl={lightbox.sourceUrl}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
