import { useState } from 'react';
import { useTartar } from '../context/TartarContext';
import styles from '../tartar.module.css';

export default function AnomaliesPage() {
  const { api } = useTartar();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!api) return;
    setLoading(true);
    try {
      const res = await api.detectAnomalies({});
      setAnomalies(res.anomalies ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Anomalies</h1>
      <p className={styles.pageSub}>
        Entities flagged for unusually high output in narrow time windows — e.g. dozens of major structures credited in a decade.
      </p>

      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={load} disabled={loading} style={{ marginBottom: '1rem' }}>
        {loading ? 'Analyzing…' : 'Run anomaly detection'}
      </button>

      <div className={styles.grid}>
        {anomalies.length === 0 && !loading && (
          <p className={styles.pageSub}>No anomalies yet. Ingest mentions first, then run detection.</p>
        )}
        {anomalies.map((a, i) => (
          <article key={a.entityId + i} className={styles.card}>
            <span className={styles.cardBadge}>Score {a.score}</span>
            <h3 className={styles.cardTitle}>{a.entityName}</h3>
            <p className={styles.cardMeta}>{a.summary}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--tartar-muted)', margin: 0 }}>
              {a.windowStartYear}–{a.windowEndYear} · {a.count} mentions · {a.entityType}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
