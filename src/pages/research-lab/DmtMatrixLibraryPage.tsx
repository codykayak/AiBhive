import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  ChevronRight,
  Heart,
  Loader2,
  MessageSquarePlus,
  Search,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { auth, googleProvider } from '../../firebase';
import { buildDmtEntriesContext, buildDmtEntryContext } from '../../lib/dmtMatrixInsight';
import DmtMatrixInsightChat from './components/DmtMatrixInsightChat';
import styles from './dmtMatrixDecoder.module.css';

type LibraryStats = {
  totalEntries: number;
  researchCount: number;
  decodeCount: number;
  contributionCount: number;
};

type LibraryEntry = {
  id: string;
  type: 'corpus_research' | 'photo_decode';
  title: string;
  headline?: string;
  summary?: string;
  contributor?: string;
  createdAt?: string;
  upvoteCount?: number;
  contributionCount?: number;
  classification?: string;
  classificationConfidence?: number;
  shannonEntropy?: number;
  symbolCount?: number;
  detectionCount?: number;
  promisingMatches?: Array<{
    glyphId: string;
    glyphName: string;
    filename?: string;
    script: string;
    characterOrForm: string;
    similarityScore: number;
    reasoning?: string;
  }>;
  namingHypotheses?: Array<{ name: string; glyphIds?: string[]; rationale?: string; contributor?: string }>;
  merged?: Array<{
    symbolId: string;
    tokenId?: string;
    name: string;
    confidence: number;
    catalogDescription?: string;
  }>;
  tokenSequence?: string[];
  frequencyRanking?: Array<{ rank: number; id: string; name: string; filename?: string; tokenId?: string }>;
  nextExperiments?: string[];
};

type Contribution = {
  id: string;
  kind: string;
  contributor?: string;
  name?: string;
  text?: string;
  script?: string;
  createdAt?: string;
};

const TYPE_LABELS: Record<string, string> = {
  corpus_research: 'Corpus research',
  photo_decode: 'Photo decode',
};

const CLASS_LABELS: Record<string, string> = {
  structured_symbolic_system: 'Structured symbolic system',
  hybrid_geometric_linguistic: 'Hybrid geometric / linguistic',
  geometric_primitives: 'Geometric primitives',
  repeating_geometric_motifs: 'Repeating geometric motifs',
};

async function authHeaders(): Promise<Record<string, string>> {
  const u = auth.currentUser;
  if (!u) return {};
  return { Authorization: `Bearer ${await u.getIdToken()}` };
}

function formatDate(iso?: string) {
  if (!iso) return 'Recently';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function DmtMatrixLibraryPage() {
  const { entryId } = useParams();
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [entry, setEntry] = useState<LibraryEntry | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'corpus_research' | 'photo_decode'>('all');
  const [qDraft, setQDraft] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contribBusy, setContribBusy] = useState(false);
  const [upvoteBusy, setUpvoteBusy] = useState(false);
  const [contribForm, setContribForm] = useState({ kind: 'naming', name: '', text: '', script: '' });
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    void fetch('/api/research-lab/dmt-matrix/library/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null));
  }, []);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      qs.set('limit', '50');
      if (typeFilter !== 'all') qs.set('type', typeFilter);
      if (q.trim()) qs.set('q', q.trim());
      const res = await fetch(`/api/research-lab/dmt-matrix/library?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load library');
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, q]);

  const loadEntry = useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      const [entryRes, contribRes] = await Promise.all([
        fetch(`/api/research-lab/dmt-matrix/library/${id}`, { headers }),
        fetch(`/api/research-lab/dmt-matrix/library/${id}/contributions`),
      ]);
      const entryData = await entryRes.json();
      const contribData = await contribRes.json();
      if (!entryRes.ok) throw new Error(entryData.error || 'Entry not found');
      setEntry(entryData.entry);
      setContributions(contribData.contributions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (entryId) {
      void loadEntry(entryId);
    } else {
      setEntry(null);
      void loadFeed();
    }
  }, [entryId, loadEntry, loadFeed]);

  async function signIn() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  }

  async function submitContribution() {
    if (!entryId || !user) {
      setError('Sign in to contribute naming hypotheses and corrections.');
      return;
    }
    setContribBusy(true);
    setError('');
    try {
      const headers = {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      };
      const res = await fetch(`/api/research-lab/dmt-matrix/library/${entryId}/contribute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kind: contribForm.kind,
          payload: {
            name: contribForm.name,
            text: contribForm.text,
            script: contribForm.script,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Contribution failed');
      setContribForm({ kind: 'naming', name: '', text: '', script: '' });
      await loadEntry(entryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contribution failed');
    } finally {
      setContribBusy(false);
    }
  }

  async function upvote() {
    if (!entryId || !user) {
      setError('Sign in to upvote community findings.');
      return;
    }
    setUpvoteBusy(true);
    try {
      const headers = {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      };
      const res = await fetch(`/api/research-lab/dmt-matrix/library/${entryId}/upvote`, {
        method: 'POST',
        headers,
        body: '{}',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upvote failed');
      }
      await loadEntry(entryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upvote failed');
    } finally {
      setUpvoteBusy(false);
    }
  }

  function shareEntry() {
    const url = `${window.location.origin}/research-lab/dmt-matrix-library/${entryId}`;
    void navigator.clipboard?.writeText(url);
    setShareMsg('Link copied — share with the hive.');
    setTimeout(() => setShareMsg(''), 2500);
  }

  if (entryId) {
    if (loading && !entry) {
      return (
        <div className={styles.dmt}>
          <div className={styles.shell}>
            <p className={styles.emptyState}>
              <Loader2 size={20} className={styles.spin} style={{ margin: '0 auto 0.5rem' }} />
              Loading finding…
            </p>
          </div>
        </div>
      );
    }
    if (!entry && error) {
      return (
        <div className={styles.dmt}>
          <div className={styles.shell}>
            <Link to="/research-lab/dmt-matrix-library" className={styles.libBack}>
              <ArrowLeft size={16} /> Back to library
            </Link>
            <p className={styles.error} role="alert">{error}</p>
          </div>
        </div>
      );
    }
  }

  if (entryId && entry) {
    return (
      <div className={styles.dmt}>
        <SEO
          title={`${entry.title} — DMT Matrix Library | AiBhive`}
          description={entry.summary || entry.headline || 'Community DMT matrix decode research.'}
        />
        <div className={styles.shell}>
          <div className={styles.libHeader}>
            <Link to="/research-lab/dmt-matrix-library" className={styles.libBack}>
              <ArrowLeft size={16} aria-hidden />
              Library
            </Link>
            <button type="button" className={styles.upvoteBtn} onClick={() => void shareEntry()}>
              <Share2 size={14} aria-hidden />
              Share
            </button>
          </div>
          {shareMsg && <p className={styles.publishedBanner}>{shareMsg}</p>}

          <span className={styles.feedType}>{TYPE_LABELS[entry.type] || entry.type}</span>
          <h1 className={styles.title} style={{ fontSize: '1.35rem', textAlign: 'left' }}>
            {entry.title}
          </h1>
          <p className={styles.feedMeta} style={{ marginBottom: '0.75rem' }}>
            by <strong>{entry.contributor || 'researcher'}</strong> · {formatDate(entry.createdAt)} ·{' '}
            {entry.upvoteCount || 0} upvotes · {entry.contributionCount || 0} contributions
          </p>

          <div className={styles.summaryCard}>
            <p className={styles.reportHeadline}>{entry.headline || entry.title}</p>
            <p>{entry.summary}</p>
            {entry.classification && (
              <p className={styles.reportMeta}>
                Classification:{' '}
                <strong>{CLASS_LABELS[entry.classification] || entry.classification}</strong>
                {entry.classificationConfidence != null && (
                  <> ({Math.round(entry.classificationConfidence * 100)}%)</>
                )}
                {entry.shannonEntropy != null && (
                  <> · entropy {entry.shannonEntropy.toFixed(2)} bits</>
                )}
              </p>
            )}
          </div>

          <DmtMatrixInsightChat
            focusTitle={entry.title}
            contextText={buildDmtEntryContext(entry, contributions)}
            sessionKey={`dmt_insight_entry_${entry.id}`}
            user={user}
            onSignIn={() => void signIn()}
            mode="entry"
          />

          <div style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}>
            <button
              type="button"
              className={styles.upvoteBtn}
              disabled={upvoteBusy || !user}
              onClick={() => void upvote()}
            >
              {upvoteBusy ? <Loader2 size={14} className={styles.spin} /> : <Heart size={14} />}
              Upvote ({entry.upvoteCount || 0})
            </button>
            {!user && (
              <button type="button" className={styles.linkBtn} onClick={() => void signIn()}>
                Sign in to contribute
              </button>
            )}
          </div>

          {!!entry.promisingMatches?.length && (
            <>
              <h2 className={styles.sectionTitle}>Script matches</h2>
              <ul className={styles.matchList}>
                {entry.promisingMatches.map((m) => (
                  <li key={`${m.glyphId}-${m.script}`} className={styles.matchItem}>
                    {m.filename && (
                      <img src={`/dmt-symbols/${m.filename}`} alt="" className={styles.glyphThumb} />
                    )}
                    <div>
                      <div className={styles.detName}>
                        {m.glyphName} → {m.script}
                      </div>
                      <div className={styles.detMeta}>
                        {m.characterOrForm} · {Math.round(m.similarityScore * 100)}% similar
                      </div>
                      {m.reasoning && <div className={styles.matchReason}>{m.reasoning}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!!entry.merged?.length && (
            <>
              <h2 className={styles.sectionTitle}>Detected glyphs</h2>
              <ul className={styles.detectionList}>
                {entry.merged.map((det, i) => (
                  <li key={`${det.symbolId}-${i}`} className={styles.detectionItem}>
                    <div className={styles.glyphThumb} />
                    <div>
                      <div className={styles.detName}>{det.name}</div>
                      <div className={styles.detMeta}>
                        {det.tokenId && <span>{det.tokenId} · </span>}
                        {det.symbolId}
                      </div>
                    </div>
                    <span className={styles.confBadge}>{Math.round(det.confidence * 100)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!!entry.namingHypotheses?.length && (
            <>
              <h2 className={styles.sectionTitle}>Naming hypotheses</h2>
              <ul className={styles.detectionList}>
                {entry.namingHypotheses.map((h) => (
                  <li key={h.name} className={styles.summaryCard}>
                    <strong>{h.name}</strong>
                    {h.contributor && <span className={styles.detMeta}> · {h.contributor}</span>}
                    {h.rationale && <> — {h.rationale}</>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <section className={styles.section} aria-label="Community contributions">
            <h2 className={styles.sectionTitle}>
              <MessageSquarePlus size={18} style={{ display: 'inline', marginRight: 6 }} />
              Contribute to the hive
            </h2>
            <p className={styles.researchSub}>
              Propose glyph names, confirm script matches, or add research notes — everyone builds the
              shared decode knowledge base.
            </p>

            {user ? (
              <div className={styles.contribForm}>
                <select
                  className={styles.select}
                  value={contribForm.kind}
                  onChange={(e) => setContribForm((f) => ({ ...f, kind: e.target.value }))}
                  aria-label="Contribution type"
                >
                  <option value="naming">Naming hypothesis</option>
                  <option value="confirmation">Confirm a match</option>
                  <option value="correction">Correction</option>
                  <option value="note">Research note</option>
                </select>
                {contribForm.kind === 'naming' && (
                  <input
                    className={styles.contribInput}
                    placeholder="Proposed name or label"
                    value={contribForm.name}
                    onChange={(e) => setContribForm((f) => ({ ...f, name: e.target.value }))}
                  />
                )}
                {contribForm.kind === 'confirmation' && (
                  <input
                    className={styles.contribInput}
                    placeholder="Script (e.g. Hebrew, Katakana)"
                    value={contribForm.script}
                    onChange={(e) => setContribForm((f) => ({ ...f, script: e.target.value }))}
                  />
                )}
                <textarea
                  className={styles.contribTextarea}
                  placeholder="Rationale, evidence, or correction details…"
                  value={contribForm.text}
                  onChange={(e) => setContribForm((f) => ({ ...f, text: e.target.value }))}
                  rows={3}
                />
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={contribBusy || !contribForm.text.trim()}
                  onClick={() => void submitContribution()}
                >
                  {contribBusy ? (
                    <>
                      <Loader2 size={16} className={styles.spin} /> Publishing…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Add to commons
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className={styles.signInBanner}>
                <button type="button" className={styles.linkBtn} onClick={() => void signIn()}>
                  Sign in with Google
                </button>{' '}
                to contribute naming hypotheses and corrections.
              </p>
            )}

            {!!contributions.length && (
              <ul className={styles.contribList}>
                {contributions.map((c) => (
                  <li key={c.id} className={styles.contribItem}>
                    <div className={styles.contribKind}>{c.kind}</div>
                    <div>
                      {c.name && <strong>{c.name}</strong>}
                      {c.script && <span className={styles.detMeta}> · {c.script}</span>}
                    </div>
                    {c.text && <p style={{ margin: '0.35rem 0 0' }}>{c.text}</p>}
                    <div className={styles.detMeta}>
                      {c.contributor} · {formatDate(c.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dmt}>
      <SEO
        title="DMT Matrix Library — Community Decode Commons | AiBhive Research Lab"
        description="Browse persistent corpus research and photo decode results from the DMT Matrix Decoder. Contribute naming hypotheses and build the shared glyph knowledge base."
      />

      <section className={styles.heroVideo} style={{ minHeight: '220px' }} aria-label="DMT Library hero">
        <div className={styles.heroOverlay} style={{ background: 'linear-gradient(180deg, rgba(3,5,8,0.2), rgba(3,5,8,0.95))' }} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Research Lab · Community Commons</p>
          <h1 className={styles.title}>DMT Matrix Library</h1>
          <p className={styles.lead}>
            Every decode run feeds the hive. Browse corpus research, photo analyses, and community
            naming hypotheses — built by everyone, for everyone.
          </p>
          <div className={styles.heroStats}>
            <span>
              <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
              {stats?.totalEntries ?? '—'} findings
            </span>
            <span>
              <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
              {stats?.researchCount ?? '—'} corpus
            </span>
            <span>
              <Camera size={12} style={{ display: 'inline', marginRight: 4 }} />
              {stats?.decodeCount ?? '—'} photos
            </span>
          </div>
        </div>
      </section>

      <div className={styles.shell}>
        <div className={styles.libHeader}>
          <Link to="/research-lab/dmt-matrix-decoder" className={styles.libBack}>
            <ArrowLeft size={16} aria-hidden />
            Decoder
          </Link>
          <Link to="/research-lab/communal-library" className={styles.moreLink}>
            Communal Library <ChevronRight size={14} />
          </Link>
        </div>

        <form
          className={styles.searchRow}
          onSubmit={(e) => {
            e.preventDefault();
            setQ(qDraft);
          }}
        >
          <input
            className={styles.searchInput}
            placeholder="Search findings, scripts, contributors…"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            aria-label="Search library"
          />
          <button type="submit" className={styles.btnGhost} aria-label="Search">
            <Search size={16} />
          </button>
        </form>

        <div className={styles.libFilters}>
          {(['all', 'corpus_research', 'photo_decode'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.filterChip} ${typeFilter === t ? styles.filterChipActive : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {loading && (
          <p className={styles.emptyState}>
            <Loader2 size={20} className={styles.spin} style={{ margin: '0 auto 0.5rem' }} />
            Loading commons…
          </p>
        )}

        {error && !loading && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {!loading && !entries.length && !error && (
          <div className={styles.emptyState}>
            <Sparkles size={28} style={{ margin: '0 auto 0.75rem', color: 'var(--dmt-magenta)' }} />
            <p>No findings yet — be the first to decode and publish to the commons.</p>
            <Link to="/research-lab/dmt-matrix-decoder" className={styles.moreLink} style={{ marginTop: '0.75rem' }}>
              Run a decode <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <DmtMatrixInsightChat
            focusTitle={
              q.trim()
                ? `Search: "${q.trim()}" · ${entries.length} finding${entries.length === 1 ? '' : 's'}`
                : `${entries.length} finding${entries.length === 1 ? '' : 's'} in view`
            }
            contextText={buildDmtEntriesContext(entries, {
              searchQuery: q.trim() || undefined,
              typeFilter,
            })}
            sessionKey={`dmt_insight_search_${typeFilter}_${q.trim().slice(0, 40) || 'all'}`}
            user={user}
            onSignIn={() => void signIn()}
            mode="search"
            collapsed={!q.trim()}
          />
        )}

        <ul className={styles.feedList}>
          {entries.map((e) => (
            <li key={e.id}>
              <Link to={`/research-lab/dmt-matrix-library/${e.id}`} className={styles.feedCard}>
                <div className={styles.feedType}>{TYPE_LABELS[e.type] || e.type}</div>
                <h2 className={styles.feedTitle}>{e.title}</h2>
                <p className={styles.feedSummary}>{e.summary || e.headline}</p>
                <div className={styles.feedMeta}>
                  <span>
                    by <strong>{e.contributor || 'researcher'}</strong>
                  </span>
                  <span>{formatDate(e.createdAt)}</span>
                  {e.upvoteCount != null && e.upvoteCount > 0 && <span>{e.upvoteCount} upvotes</span>}
                  {e.contributionCount != null && e.contributionCount > 0 && (
                    <span>{e.contributionCount} contributions</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
