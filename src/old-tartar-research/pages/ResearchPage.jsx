import { useEffect, useState } from 'react';
import { useTartar } from '../context/TartarContext';
import styles from '../tartar.module.css';

export default function ResearchPage() {
  const { profile, sources, customBuild, refresh, api } = useTartar();
  const [term, setTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [savedTerms, setSavedTerms] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [filters, setFilters] = useState({ entityType: '', yearMin: '', yearMax: '' });
  const [busy, setBusy] = useState(false);
  const [lastJob, setLastJob] = useState(null);
  const [section, setSection] = useState('workflow');
  const [anomalyPrompt, setAnomalyPrompt] = useState(
    customBuild?.anomalyFocusPrompt ?? 'Focus on architects and builders credited with impossible numbers of major structures in narrow decades.',
  );
  const [poolNote, setPoolNote] = useState('');

  const enabledSources = sources.filter((s) => s.enabled);

  async function addTerm(e) {
    e.preventDefault();
    if (!term.trim() || !api) return;
    setBusy(true);
    try {
      const res = await api.addSearchTerm({ term, notes });
      setSavedTerms((prev) => [...prev, { id: res.id, term, notes }]);
      setTerm('');
      setNotes('');
    } finally {
      setBusy(false);
    }
  }

  async function runIngestion() {
    if (!api) return;
    setBusy(true);
    try {
      const searchTerms = savedTerms.length
        ? savedTerms.map((t) => t.term)
        : ['Tartaria', 'Tartary', 'architect', 'builder'];
      const res = await api.startIngestion({
        sourceIds: customBuild?.enabledSourceIds?.length
          ? customBuild.enabledSourceIds
          : enabledSources.map((s) => s.id),
        searchTerms,
        aiProvider: profile?.defaultAiProvider ?? 'gemini',
      });
      setLastJob(res);
      await refresh();
      await loadMentions();
    } finally {
      setBusy(false);
    }
  }

  async function loadMentions() {
    if (!api) return;
    try {
      const res = await api.queryMentions({
        entityType: filters.entityType || undefined,
        yearMin: filters.yearMin || undefined,
        yearMax: filters.yearMax || undefined,
        limit: 100,
      });
      setMentions(res.mentions ?? []);
    } catch {
      setMentions([]);
    }
  }

  async function runAnomalies() {
    if (!api) return;
    setBusy(true);
    setPoolNote('');
    try {
      const res = await api.detectAnomalies({
        rules: customBuild?.anomalyRules ?? {},
        customPrompt: anomalyPrompt,
        aiProvider: profile?.defaultAiProvider ?? 'gemini',
      });
      setAnomalies(res.anomalies ?? []);
      if (res.fromPool) setPoolNote('Results include opt-in community pool data.');
      if (res.fromCache) setPoolNote('Loaded from cached community analysis.');
      setSection('anomalies');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (customBuild?.anomalyFocusPrompt) {
      setAnomalyPrompt(customBuild.anomalyFocusPrompt);
    }
  }, [customBuild?.anomalyFocusPrompt]);

  return (
    <>
      <h1 className={styles.pageTitle}>Research</h1>
      <p className={styles.pageSub}>
        Search terms → ingestion → mentions → anomalies. One workflow for extracting and analyzing historical records.
      </p>

      <div className={styles.tabRow}>
        {['workflow', 'mentions', 'anomalies'].map((id) => (
          <button
            key={id}
            type="button"
            className={`${styles.tabBtn} ${section === id ? styles.tabBtnActive : ''}`}
            onClick={() => setSection(id)}
          >
            {id === 'workflow' ? 'Workflow' : id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      {section === 'workflow' && (
        <>
          <form className={styles.card} onSubmit={addTerm} style={{ maxWidth: 520, marginBottom: '1.25rem' }}>
            <h3 className={styles.cardTitle}>Search terms</h3>
            <p className={styles.cardMeta}>Keywords for ingestion — Tartaria, Tartary, map titles, architect names, etc.</p>
            <div className={styles.field}>
              <label className={styles.label}>Term</label>
              <input className={styles.input} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Grand Tartaria" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Notes</label>
              <input className={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context" />
            </div>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy}>Add term</button>
          </form>

          {savedTerms.length > 0 && (
            <div className={styles.chipRow} style={{ marginBottom: '1.25rem' }}>
              {savedTerms.map((s) => (
                <span key={s.id} className={styles.chip}>{s.term}</span>
              ))}
            </div>
          )}

          <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
            <h3 className={styles.cardTitle}>AI anomaly focus</h3>
            <p className={styles.cardMeta}>
              Tell the AI what patterns to prioritize. Statistical detection runs first, then your agent filters and explains findings.
            </p>
            <textarea
              className={styles.textarea}
              value={anomalyPrompt}
              onChange={(e) => setAnomalyPrompt(e.target.value)}
              placeholder="e.g. Flag architects with 20+ major buildings in a 10-year window, or map references to Tartary that disappear after 1850…"
              rows={3}
            />
          </div>

          <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
            <h3 className={styles.cardTitle}>Run ingestion</h3>
            <p className={styles.cardMeta}>
              {enabledSources.length} active archive{enabledSources.length === 1 ? '' : 's'} · AI: {profile?.defaultAiProvider ?? 'gemini'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={runIngestion} disabled={busy || !enabledSources.length}>
                {busy ? 'Running…' : 'Start ingestion'}
              </button>
              <button type="button" className={styles.btn} onClick={runAnomalies} disabled={busy}>
                Detect anomalies
              </button>
            </div>
            {lastJob && (
              <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                Job {lastJob.jobId}: {lastJob.itemsProcessed ?? 0} items, {lastJob.mentionsExtracted ?? 0} mentions extracted.
              </div>
            )}
          </div>
        </>
      )}

      {section === 'mentions' && (
        <>
          <div className={styles.card} style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className={styles.field} style={{ flex: 1, minWidth: 120, margin: 0 }}>
              <label className={styles.label}>Entity type</label>
              <input className={styles.input} value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} placeholder="architect" style={{ margin: 0 }} />
            </div>
            <div className={styles.field} style={{ width: 100, margin: 0 }}>
              <label className={styles.label}>Year min</label>
              <input className={styles.input} value={filters.yearMin} onChange={(e) => setFilters({ ...filters, yearMin: e.target.value })} style={{ margin: 0 }} />
            </div>
            <div className={styles.field} style={{ width: 100, margin: 0 }}>
              <label className={styles.label}>Year max</label>
              <input className={styles.input} value={filters.yearMax} onChange={(e) => setFilters({ ...filters, yearMax: e.target.value })} style={{ margin: 0 }} />
            </div>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={loadMentions}>Filter</button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entity</th>
                <th>Role</th>
                <th>Project</th>
                <th>Year</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {mentions.length === 0 ? (
                <tr><td colSpan={5} style={{ color: 'var(--tartar-muted)' }}>No mentions yet — run ingestion first.</td></tr>
              ) : mentions.map((m) => (
                <tr key={m.id} title={m.sourceExcerpt ? `Excerpt: ${m.sourceExcerpt}` : undefined}>
                  <td>{m.entityName}</td>
                  <td>{m.role ?? m.entityType}</td>
                  <td>{m.project ?? '—'}</td>
                  <td>{m.year ?? m.date ?? '—'}</td>
                  <td>
                    {m.sourceUrl ? <a href={m.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--tartar-accent)' }}>{m.sourceId}</a> : m.sourceId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {section === 'anomalies' && (
        <>
          <div className={styles.card} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.cardTitle}>Custom AI focus</h3>
            <textarea
              className={styles.textarea}
              value={anomalyPrompt}
              onChange={(e) => setAnomalyPrompt(e.target.value)}
              rows={2}
            />
          </div>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={runAnomalies} disabled={busy} style={{ marginBottom: '1rem' }}>
            {busy ? 'Analyzing…' : 'Run anomaly detection'}
          </button>
          {poolNote && <div className={`${styles.alert} ${styles.alertInfo}`}>{poolNote}</div>}
          <div className={styles.grid}>
            {anomalies.length === 0 && !busy && (
              <p className={styles.pageSub}>No anomalies yet. Ingest mentions first, then run detection.</p>
            )}
            {anomalies.map((a, i) => (
              <article key={a.entityId + i} className={styles.card}>
                <span className={styles.cardBadge}>Score {a.score}</span>
                <h3 className={styles.cardTitle}>{a.entityName}</h3>
                <p className={styles.cardMeta}>{a.summary}</p>
                {a.aiInsight && <p className={styles.aiInsight}>{a.aiInsight}</p>}
                {a.fromPool && <span className={styles.cardBadge}>Community pool</span>}
                <p style={{ fontSize: '0.8rem', color: 'var(--tartar-muted)', margin: 0 }}>
                  {a.windowStartYear}–{a.windowEndYear} · {a.count} mentions · {a.entityType}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
