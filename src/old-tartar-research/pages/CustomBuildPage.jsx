import { useState, useEffect } from 'react';
import { useTartar } from '../context/TartarContext';
import { ENTITY_TYPES } from '../config/entityTypeRegistry';
import styles from '../tartar.module.css';

export default function CustomBuildPage() {
  const { customBuild, sources, refresh, api } = useTartar();
  const [form, setForm] = useState({
    name: 'My Research Build',
    description: '',
    enabledSourceIds: [],
    enabledEntityTypes: ENTITY_TYPES.map((t) => t.id),
    dashboardWidgets: ['mentions', 'anomalies', 'timeline'],
    anomalyRules: { highOutputWindowYears: 10, highOutputMinCount: 15 },
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customBuild) {
      setForm({
        name: customBuild.name ?? 'My Research Build',
        description: customBuild.description ?? '',
        enabledSourceIds: customBuild.enabledSourceIds ?? [],
        enabledEntityTypes: customBuild.enabledEntityTypes ?? ENTITY_TYPES.map((t) => t.id),
        dashboardWidgets: customBuild.dashboardWidgets ?? ['mentions', 'anomalies', 'timeline'],
        anomalyRules: customBuild.anomalyRules ?? { highOutputWindowYears: 10, highOutputMinCount: 15 },
      });
    }
  }, [customBuild]);

  function toggleSource(id) {
    setForm((f) => ({
      ...f,
      enabledSourceIds: f.enabledSourceIds.includes(id)
        ? f.enabledSourceIds.filter((x) => x !== id)
        : [...f.enabledSourceIds, id],
    }));
  }

  function toggleEntityType(id) {
    setForm((f) => ({
      ...f,
      enabledEntityTypes: f.enabledEntityTypes.includes(id)
        ? f.enabledEntityTypes.filter((x) => x !== id)
        : [...f.enabledEntityTypes, id],
    }));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await api.saveCustomBuild(form);
      await refresh();
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.pageTitle}>My research build</h1>
      <p className={styles.pageSub}>
        Your personalized configuration — visible only when you are signed in. Appears under Apps as a custom build.
      </p>

      <form className={styles.card} onSubmit={save} style={{ maxWidth: 640 }}>
        <div className={styles.field}>
          <label className={styles.label}>Build name</label>
          <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <p className={styles.label}>Enabled sources</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {sources.map((s) => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={form.enabledSourceIds.includes(s.id)}
                onChange={() => toggleSource(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>

        <p className={styles.label}>Entity types to extract</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {ENTITY_TYPES.map((t) => (
            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={form.enabledEntityTypes.includes(t.id)}
                onChange={() => toggleEntityType(t.id)}
              />
              {t.label}
            </label>
          ))}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Anomaly window (years)</label>
          <input
            className={styles.input}
            type="number"
            value={form.anomalyRules.highOutputWindowYears}
            onChange={(e) => setForm({
              ...form,
              anomalyRules: { ...form.anomalyRules, highOutputWindowYears: Number(e.target.value) },
            })}
          />
        </div>

        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy}>
          {busy ? 'Saving…' : 'Save custom build'}
        </button>
        {saved && <span style={{ marginLeft: '0.75rem', color: 'var(--tartar-ok)', fontSize: '0.9rem' }}>Saved</span>}
      </form>
    </>
  );
}
