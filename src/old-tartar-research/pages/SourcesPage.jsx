import { useState } from 'react';
import { useTartar } from '../context/TartarContext';
import { buildSearchUrl } from '../config/sourceRegistry';
import styles from '../tartar.module.css';

export default function SourcesPage() {
  const { sources, refresh, api } = useTartar();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', kind: 'custom_http', homepageUrl: '', searchUrlTemplate: '' });
  const [busy, setBusy] = useState(false);

  async function toggleSource(source) {
    setBusy(true);
    try {
      await api.addSource({ ...source, enabled: !source.enabled });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addCustomSource(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addSource({
        ...form,
        enabled: true,
        isCustom: true,
        adapterConfig: { baseUrl: form.homepageUrl },
      });
      setShowForm(false);
      setForm({ name: '', kind: 'custom_http', homepageUrl: '', searchUrlTemplate: '' });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Data sources</h1>
      <p className={styles.pageSub}>
        Clear catalog of archive sources. Enable built-in sources or add your own — each maps to an ingestion adapter.
      </p>

      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowForm(!showForm)} style={{ marginBottom: '1rem' }}>
        {showForm ? 'Cancel' : '+ Add custom source'}
      </button>

      {showForm && (
        <form className={styles.card} onSubmit={addCustomSource} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Homepage URL</label>
            <input className={styles.input} value={form.homepageUrl} onChange={(e) => setForm({ ...form, homepageUrl: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Search URL template (use {'{query}'})</label>
            <input className={styles.input} value={form.searchUrlTemplate} onChange={(e) => setForm({ ...form, searchUrlTemplate: e.target.value })} placeholder="https://example.com/search?q={query}" />
          </div>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy}>Save source</button>
        </form>
      )}

      <div className={styles.grid}>
        {sources.map((source) => (
          <article key={source.id} className={styles.card}>
            <span className={styles.cardBadge}>{source.isCustom ? 'Custom' : source.kind}</span>
            <h3 className={styles.cardTitle}>{source.name}</h3>
            <p className={styles.cardMeta}>{source.description ?? `Adapter: ${source.kind}`}</p>
            {source.homepageUrl && (
              <a href={source.homepageUrl} target="_blank" rel="noreferrer" className={styles.btn} style={{ marginRight: '0.5rem' }}>
                Visit
              </a>
            )}
            {source.searchUrlTemplate && (
              <a href={buildSearchUrl(source, 'Tartary')} target="_blank" rel="noreferrer" className={styles.btn} style={{ marginRight: '0.5rem' }}>
                Sample search
              </a>
            )}
            <button type="button" className={styles.btn} onClick={() => toggleSource(source)} disabled={busy}>
              {source.enabled ? 'Disable' : 'Enable'}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
