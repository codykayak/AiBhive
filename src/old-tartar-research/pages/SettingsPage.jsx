import { useState } from 'react';
import { useTartar } from '../context/TartarContext';
import styles from '../tartar.module.css';

const PROVIDERS = ['gemini', 'grok', 'kimi'];

export default function SettingsPage() {
  const { profile, platformFeeRate, refresh, api } = useTartar();
  const [mode, setMode] = useState(profile?.billingMode ?? 'hive_credits');
  const [keys, setKeys] = useState({ gemini: '', grok: '', kimi: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function saveBilling() {
    setBusy(true);
    setMsg('');
    try {
      await api.setBillingMode(mode);
      await refresh();
      setMsg('Billing mode updated.');
    } finally {
      setBusy(false);
    }
  }

  async function saveKey(provider) {
    if (!keys[provider]?.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      await api.storeApiKey(provider, keys[provider]);
      setKeys((k) => ({ ...k, [provider]: '' }));
      setMsg(`${provider} key saved (server-side only).`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Settings</h1>
      <p className={styles.pageSub}>
        Use Hive credits for AI extraction, or bring your own API keys. Platform charges {Math.round(platformFeeRate * 100)}% on credit usage.
      </p>

      <div className={styles.card} style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
        <h3 className={styles.cardTitle}>Billing</h3>
        <div className={styles.field}>
          <label className={styles.label}>Mode</label>
          <select className={styles.select} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="hive_credits">Hive credits (we charge {Math.round(platformFeeRate * 100)}% for upkeep)</option>
            <option value="byok">My own API keys (no credit charge)</option>
          </select>
        </div>
        <p className={styles.cardMeta}>
          Balance: {profile?.hiveCredits ?? 0} credits · Default AI: {profile?.defaultAiProvider ?? 'gemini'}
        </p>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveBilling} disabled={busy}>
          Save billing
        </button>
      </div>

      <div className={styles.card} style={{ maxWidth: 520 }}>
        <h3 className={styles.cardTitle}>API keys (BYOK)</h3>
        <p className={styles.cardMeta}>Keys are stored server-side and never exposed to the browser. Supports Grok, Gemini, and Kimi.</p>
        {PROVIDERS.map((p) => (
          <div key={p} className={styles.field}>
            <label className={styles.label}>{p} API key</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className={styles.input}
                type="password"
                value={keys[p]}
                onChange={(e) => setKeys({ ...keys, [p]: e.target.value })}
                placeholder={`Enter ${p} key`}
                style={{ margin: 0, flex: 1 }}
              />
              <button type="button" className={styles.btn} onClick={() => saveKey(p)} disabled={busy}>Save</button>
            </div>
          </div>
        ))}
      </div>

      {msg && <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginTop: '1rem' }}>{msg}</div>}
    </>
  );
}
