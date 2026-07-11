import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Share2,
  Users,
  Sparkles,
  ArrowRight,
  Search,
  GitFork,
  PencilLine,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import StartResearchingButton from './components/StartResearchingButton';
import CommunalLibraryMapSection from './components/CommunalLibraryMapSection';
import { COMMUNAL_TOPICS } from './communalLibraryTopics';
import { auth } from '../../firebase';
import type { LibraryEntry } from '../fable-scrape/shared';
import styles from './researchLab.module.css';

type LiveEntry = LibraryEntry & {
  topicId?: string;
  visibility?: string;
  provenance?: Record<string, unknown>;
  correctionCount?: number;
};

async function authHeaders(): Promise<Record<string, string>> {
  const u = auth.currentUser;
  if (!u) return {};
  return { Authorization: `Bearer ${await u.getIdToken()}` };
}

export default function CommunalLibraryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const share = params.get('share') || '';
  const topicParam = params.get('topic') || '';
  const [selectedId, setSelectedId] = useState<string | null>(topicParam || 'tartarian');
  const [liveStats, setLiveStats] = useState<Record<string, number>>({});
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forkMsg, setForkMsg] = useState('');
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correction, setCorrection] = useState({ field: 'ocrText', text: '', note: '' });
  const [glossary, setGlossary] = useState<
    Array<{ id: string; original?: string; corrected?: string; field?: string; topicId?: string }>
  >([]);

  const topicsWithLive = useMemo(
    () =>
      COMMUNAL_TOPICS.map((t) => ({
        ...t,
        docs: Math.max(t.docs, liveStats[t.id] || 0),
        liveDocs: liveStats[t.id] || 0,
      })),
    [liveStats],
  );

  useEffect(() => {
    void fetch('/api/research-lab/library/topics')
      .then((r) => r.json())
      .then((d) => setLiveStats(d.stats || {}))
      .catch(() => setLiveStats({}));
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      const qs = new URLSearchParams();
      qs.set('limit', '40');
      if (selectedId) qs.set('topicId', selectedId);
      if (q.trim()) qs.set('q', q.trim());
      if (share) qs.set('share', share);
      const res = await fetch(`/api/research-lab/fable-scrape/library?${qs}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load library');
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId, q, share]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (!selectedId) return;
    void fetch(`/api/research-lab/glossary?topicId=${encodeURIComponent(selectedId)}&limit=12`)
      .then((r) => r.json())
      .then((d) => setGlossary(d.entries || []))
      .catch(() => setGlossary([]));
  }, [selectedId]);

  function selectTopic(id: string) {
    navigate(`/research-lab/communal-library/${id}`);
  }

  // Keep ?topic= in sync for deep links that still use query params
  useEffect(() => {
    if (topicParam && topicParam !== selectedId) setSelectedId(topicParam);
  }, [topicParam, selectedId]);

  async function forkEntry(entry: LiveEntry) {
    setForkMsg('');
    try {
      const headers = {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      };
      if (!headers.Authorization) {
        setForkMsg('Sign in to fork into your Research Project.');
        return;
      }
      const res = await fetch(`/api/research-lab/library/${encodeURIComponent(entry.id)}/fork`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ share: share || undefined, title: `Fork · ${entry.title}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fork failed');
      setForkMsg(`Forked into project — open Research tools to continue.`);
    } catch (err) {
      setForkMsg(err instanceof Error ? err.message : 'Fork failed');
    }
  }

  async function submitCorrection(entry: LiveEntry) {
    try {
      const headers = {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      };
      if (!headers.Authorization) {
        setForkMsg('Sign in to submit a glossary correction.');
        return;
      }
      const res = await fetch(`/api/research-lab/library/${encodeURIComponent(entry.id)}/correct`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          field: correction.field,
          original: entry[correction.field as 'ocrText' | 'translation' | 'title'] || '',
          corrected: correction.text,
          note: correction.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Correction failed');
      setCorrectingId(null);
      setCorrection({ field: 'ocrText', text: '', note: '' });
      setForkMsg('Correction saved to the communal glossary.');
      void loadEntries();
    } catch (err) {
      setForkMsg(err instanceof Error ? err.message : 'Correction failed');
    }
  }

  return (
    <div className={styles.rlLibPage}>
      <SEO
        title="Communal Library — Shared Research Knowledge Map | AiBhive"
        description="Explore AiBhive’s Communal Library: a living, multi-agent knowledge map where researchers publish OCR’d archives, translations, and findings so the whole community can build on shared sources."
        keywords="communal research library, shared knowledge map, Tartarian archives, cuneiform OCR, community sourced research, AiBhive library"
        type="WebSite"
        jsonLd={[
          {
            '@type': 'CollectionPage',
            name: 'AiBhive Communal Library',
            description:
              'Community-sourced research library with interconnected topic corpora for historical, medical, legal, and scholarly work.',
            url: 'https://aibhive.com/research-lab/communal-library',
          },
        ]}
      />

      {share && (
        <p className={styles.rlLibShareBanner}>
          Viewing share-link corpus <code>{share}</code>
        </p>
      )}

      <CommunalLibraryMapSection
        headingLevel="h1"
        selectedId={selectedId}
        onSelectTopic={selectTopic}
        lead="A living knowledge lattice — rotate the map, search live corpora, fork entries into your project, and correct glossaries so the next researcher starts ahead."
      />

      <section className={styles.rlLibLive} aria-label="Live corpus search">
        <div className={styles.rlLibLiveHead}>
          <h2>Live corpus</h2>
          <p>Search published findings, fork into your Research Project, or correct OCR/translations for the glossary.</p>
        </div>
        <form
          className={styles.rlLibSearch}
          onSubmit={(e) => {
            e.preventDefault();
            setQ(qDraft);
          }}
        >
          <Search className={styles.rlLibSearchIcon} aria-hidden />
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Search titles, OCR, translations…"
            aria-label="Search communal library"
          />
          <button type="submit" className={styles.owrBtnPrimary}>
            Search
          </button>
        </form>
        {forkMsg && <p className={styles.rlLibForkMsg} role="status">{forkMsg}</p>}
        {loading ? (
          <p className={styles.rlLibLoading}>
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Loading entries…
          </p>
        ) : error ? (
          <p className={styles.rlLibError}>{error}</p>
        ) : entries.length === 0 ? (
          <p className={styles.rlLibEmpty}>
            No live entries for this filter yet — publish from Fable Scrape to seed the commons.
          </p>
        ) : (
          <ul className={styles.rlLibEntryList}>
            {entries.map((e) => (
              <li key={e.id} className={styles.rlLibEntry}>
                <div className={styles.rlLibEntryMain}>
                  <h3>{e.title}</h3>
                  <p className={styles.rlLibEntryMeta}>
                    {e.topicId || 'general'}
                    {e.visibility ? ` · ${e.visibility}` : ''}
                    {e.contributor ? ` · ${e.contributor}` : ''}
                    {e.correctionCount ? ` · ${e.correctionCount} corrections` : ''}
                  </p>
                  <p className={styles.rlLibEntryBody}>
                    {(e.translation || e.ocrText || e.reason || '').slice(0, 320)}
                    {(e.translation || e.ocrText || '').length > 320 ? '…' : ''}
                  </p>
                  {e.provenance?.sourceUrl || e.sourceUrl ? (
                    <a
                      href={String(e.provenance?.sourceUrl || e.sourceUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.rlLibEntrySource}
                    >
                      Provenance <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  ) : null}
                </div>
                <div className={styles.rlLibEntryActions}>
                  <button type="button" className={styles.owrBtn} onClick={() => void forkEntry(e)}>
                    <GitFork className="w-3.5 h-3.5 inline mr-1" />
                    Fork
                  </button>
                  <button
                    type="button"
                    className={styles.owrBtn}
                    onClick={() => {
                      setCorrectingId(e.id);
                      setCorrection({
                        field: 'ocrText',
                        text: e.ocrText || e.translation || '',
                        note: '',
                      });
                    }}
                  >
                    <PencilLine className="w-3.5 h-3.5 inline mr-1" />
                    Correct
                  </button>
                  <Link className={styles.owrBtn} to="/research-lab/workspace">
                    Open tools
                  </Link>
                </div>
                {correctingId === e.id && (
                  <div className={styles.rlLibCorrect}>
                    <label>
                      Field
                      <select
                        value={correction.field}
                        onChange={(ev) => setCorrection((c) => ({ ...c, field: ev.target.value }))}
                      >
                        <option value="ocrText">OCR text</option>
                        <option value="translation">Translation</option>
                        <option value="title">Title</option>
                      </select>
                    </label>
                    <textarea
                      value={correction.text}
                      onChange={(ev) => setCorrection((c) => ({ ...c, text: ev.target.value }))}
                      rows={4}
                      placeholder="Corrected text"
                    />
                    <input
                      value={correction.note}
                      onChange={(ev) => setCorrection((c) => ({ ...c, note: ev.target.value }))}
                      placeholder="Optional note for the glossary"
                    />
                    <div className={styles.rlLibCorrectActions}>
                      <button
                        type="button"
                        className={`${styles.owrBtn} ${styles.owrBtnPrimary}`}
                        onClick={() => void submitCorrection(e)}
                      >
                        Save to glossary
                      </button>
                      <button type="button" className={styles.owrBtn} onClick={() => setCorrectingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {glossary.length > 0 && (
          <div className={styles.rlLibGlossary}>
            <h3>Recent glossary corrections</h3>
            <ul>
              {glossary.map((g) => (
                <li key={g.id}>
                  <strong>{g.field}</strong>: {(g.original || '').slice(0, 60)} →{' '}
                  {(g.corrected || '').slice(0, 60)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className={styles.rlLibTopicsGrid} aria-label="All topics">
        <h2>Browse the lattice</h2>
        <p>Twenty-plus research domains already wired into one collective system — click any card to open its archive.</p>
        <ul>
          {topicsWithLive.map((t) => (
            <li key={t.id}>
              <Link
                to={`/research-lab/communal-library/${t.id}`}
                className={`${styles.rlLibTopicCard}${selectedId === t.id ? ` ${styles.rlLibTopicCardActive}` : ''}`}
              >
                <strong>{t.label}</strong>
                <span>
                  {t.docs.toLocaleString()} docs
                  {t.liveDocs ? ` · ${t.liveDocs} live` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.rlLibExplain} aria-labelledby="rl-lib-what">
        <h2 id="rl-lib-what">What the Communal Library actually does</h2>
        <p>
          The Communal Library is AiBhive’s shared research memory. When you scrape an archive, OCR a
          plate, translate a script, or synthesize a finding in Research Lab, you can{' '}
          <strong>publish</strong> that work into this pool — private, share-link, or public. Other
          investigators then search, fork, correct, and extend it.
        </p>
        <div className={styles.rlLibExplainGrid}>
          <article>
            <Share2 className={styles.rlLibExplainIcon} aria-hidden />
            <h3>Contribute</h3>
            <p>
              Publish cleaned findings from Fable Scrape, OCR Lab, and translation. Keep sensitive
              material private; share what strengthens the commons.
            </p>
          </article>
          <article>
            <Users className={styles.rlLibExplainIcon} aria-hidden />
            <h3>Communicate</h3>
            <p>
              Topic nodes link related corpora so historians, clinicians, legal researchers, and
              scholars can follow trails across domains — and leave better trails for the next person.
            </p>
          </article>
          <article>
            <Sparkles className={styles.rlLibExplainIcon} aria-hidden />
            <h3>Compound</h3>
            <p>
              Every contribution grows the knowledge and wealth base of the hive. We deeply appreciate
              researchers who publish — your work becomes infrastructure for everyone.
            </p>
          </article>
        </div>
        <p className={styles.rlLibThanks}>
          Thank you for building with us. Shared knowledge is the point of AiBhive Research Lab —
          research deeply, then give the next investigator a head start.
        </p>
        <div className={styles.rlCatCtaRow}>
          <StartResearchingButton />
          <Link to="/research-lab" className={styles.rlBtnGhost}>
            Back to Research Lab
            <ArrowRight className="w-4 h-4 inline ml-1" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
