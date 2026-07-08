import { useState } from 'react';
import { useTartar } from '../context/TartarContext';
import styles from '../tartar.module.css';

export default function SearchTermsPage() {
  const { api } = useTartar();
  const [term, setTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState(false);

  async function addTerm(e) {
    e.preventDefault();
    if (!term.trim() || !api) return;
    setBusy(true);
    try {
      const res = await api.addSearchTerm({ term, notes });
      setSaved((prev) => [...prev, { id: res.id, term, notes }]);
      setTerm('');
      setNotes('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Search terms</h1>
      <p className={styles.pageSub}>Add keywords for ingestion — Tartaria, Tartary, specific map titles, architect names, etc.</p>

      <form className={styles.card} onSubmit={addTerm} style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
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

      {saved.length > 0 && (
        <table className={styles.table}>
          <thead><tr><th>Term</th><th>Notes</th></tr></thead>
          <tbody>
            {saved.map((s) => (
              <tr key={s.id}><td>{s.term}</td><td>{s.notes || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
