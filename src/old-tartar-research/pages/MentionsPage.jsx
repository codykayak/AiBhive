import { useEffect, useState } from 'react';
import { useTartar } from '../context/TartarContext';
import styles from '../tartar.module.css';

export default function MentionsPage() {
  const { api } = useTartar();
  const [mentions, setMentions] = useState([]);
  const [filters, setFilters] = useState({ entityType: '', yearMin: '', yearMax: '' });
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!api) return;
    setLoading(true);
    try {
      const res = await api.queryMentions({
        entityType: filters.entityType || undefined,
        yearMin: filters.yearMin || undefined,
        yearMax: filters.yearMax || undefined,
        limit: 100,
      });
      setMentions(res.mentions ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [api]);

  return (
    <>
      <h1 className={styles.pageTitle}>Mentions</h1>
      <p className={styles.pageSub}>Every extracted mention with entity, role, project, date, location, and source metadata.</p>

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
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={load}>Filter</button>
      </div>

      {loading ? <p className={styles.pageSub}>Loading…</p> : (
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
              <tr><td colSpan={5} style={{ color: 'var(--tartar-muted)' }}>No mentions yet — run ingestion from the dashboard.</td></tr>
            ) : mentions.map((m) => (
              <tr key={m.id}>
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
      )}
    </>
  );
}
