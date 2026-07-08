import { useState, useEffect } from 'react';
import { useTartar } from '../context/TartarContext';
import { ENTITY_TYPES } from '../config/entityTypeRegistry';
import styles from '../tartar.module.css';

const PROVIDERS = ['gemini', 'grok', 'kimi'];

export default function SettingsPage() {
  const {
    profile,
    customBuild,
    sources,
    platformFeeRate,
    effectiveFeeRate,
    hasPromo,
    refresh,
    api,
  } = useTartar();
  const [mode, setMode] = useState(profile?.billingMode ?? 'hive_credits');
  const [keys, setKeys] = useState({ gemini: '', grok: '', kimi: '' });
  const [promoCode, setPromoCode] = useState('');
  const [buildForm, setBuildForm] = useState({
    name: 'My Research Build',
    description: '',
    enabledSourceIds: [],
    enabledEntityTypes: ENTITY_TYPES.map((t) => t.id),
    dashboardWidgets: ['mentions', 'anomalies', 'timeline'],
    anomalyRules: { highOutputWindowYears: 10, highOutputMinCount: 15 },
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const feePct = Math.round((effectiveFeeRate ?? platformFeeRate) * 100);
  const standardPct = Math.round(platformFeeRate * 100);

  useEffect(() => {
    if (customBuild) {
      setBuildForm({
        name: customBuild.name ?? 'My Research Build',
        description: customBuild.description ?? '',
        enabledSourceIds: customBuild.enabledSourceIds ?? [],
        enabledEntityTypes: customBuild.enabledEntityTypes ?? ENTITY_TYPES.map((t) => t.id),
        dashboardWidgets: customBuild.dashboardWidgets ?? ['mentions', 'anomalies', 'timeline'],
        anomalyRules: customBuild.anomalyRules ?? { highOutputWindowYears: 10, highOutputMinCount: 15 },
      });
    }
  }, [customBuild]);

  useEffect(() => {
    setMode(profile?.billingMode ?? 'hive_credits');
  }, [profile?.billingMode]);

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

  async function redeemPromo(e) {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await api.redeemPromoCode(promoCode);
      setPromoCode('');
      setMsg(res.message ?? 'Promo code applied.');
      await refresh();
    } catch (err) {
      setMsg(err.message ?? 'Invalid promo code.');
    } finally {
      setBusy(false);
    }
  }

  function toggleSource(id) {
    setBuildForm((f) => ({
      ...f,
      enabledSourceIds: f.enabledSourceIds.includes(id)
        ? f.enabledSourceIds.filter((x) => x !== id)
        : [...f.enabledSourceIds, id],
    }));
  }

  function toggleEntityType(id) {
    setBuildForm((f) => ({
      ...f,
      enabledEntityTypes: f.enabledEntityTypes.includes(id)
        ? f.enabledEntityTypes.filter((x) => x !== id)
        : [...f.enabledEntityTypes, id],
    }));
  }

  async function saveBuild(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api.saveCustomBuild(buildForm);
      await refresh();
      setMsg('Custom build saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Settings</h1>
      <p className={styles.pageSub}>
        Billing, partner codes, API keys, and your personalized research build.
      </p>

      <div className={styles.card} style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
        <h3 className={styles.cardTitle}>Billing</h3>
        <div className={styles.field}>
          <label className={styles.label}>Mode</label>
          <select className={styles.select} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="hive_credits">
              Hive credits ({hasPromo ? `${feePct}% server fee` : `${standardPct}% platform markup`})
            </option>
            <option value="byok">My own API keys (pay provider directly)</option>
          </select>
        </div>
        <p className={styles.cardMeta}>
          Balance: {profile?.hiveCredits ?? 0} credits · Default AI: {profile?.defaultAiProvider ?? 'gemini'}
          {hasPromo && (
            <> · Partner code <strong>{profile.promoCode}</strong> active ({feePct}% server fee)</>
          )}
        </p>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveBilling} disabled={busy}>
          Save billing
        </button>
      </div>

      <div className={styles.card} style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
        <h3 className={styles.cardTitle}>Partner / promo code</h3>
        <p className={styles.cardMeta}>
          Have a code? Redeem it to skip the {standardPct}% platform markup. You pay API cost plus a small server fee
          ({hasPromo ? `currently ${feePct}%` : 'typically ~5%'}), or use your own API keys.
        </p>
        {hasPromo ? (
          <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginBottom: 0 }}>
            Code <strong>{profile.promoCode}</strong> is active — {feePct}% server fee instead of {standardPct}% markup.
          </div>
        ) : (
          <form onSubmit={redeemPromo} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className={styles.input}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter partner code"
              style={{ margin: 0, flex: 1 }}
            />
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy || !promoCode.trim()}>
              Apply
            </button>
          </form>
        )}
      </div>

      <div className={styles.card} style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
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

      <form className={styles.card} onSubmit={saveBuild} style={{ maxWidth: 640 }}>
        <h3 className={styles.cardTitle}>Custom research build</h3>
        <p className={styles.cardMeta}>Personalize sources, entity types, and anomaly detection rules.</p>
        <div className={styles.field}>
          <label className={styles.label}>Build name</label>
          <input className={styles.input} value={buildForm.name} onChange={(e) => setBuildForm({ ...buildForm, name: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} value={buildForm.description} onChange={(e) => setBuildForm({ ...buildForm, description: e.target.value })} />
        </div>

        <p className={styles.label}>Enabled sources</p>
        <div className={styles.chipRow} style={{ marginBottom: '1rem' }}>
          {sources.map((s) => (
            <label key={s.id} className={styles.checkChip}>
              <input
                type="checkbox"
                checked={buildForm.enabledSourceIds.includes(s.id)}
                onChange={() => toggleSource(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>

        <p className={styles.label}>Entity types to extract</p>
        <div className={styles.chipRow} style={{ marginBottom: '1rem' }}>
          {ENTITY_TYPES.map((t) => (
            <label key={t.id} className={styles.checkChip}>
              <input
                type="checkbox"
                checked={buildForm.enabledEntityTypes.includes(t.id)}
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
            value={buildForm.anomalyRules.highOutputWindowYears}
            onChange={(e) => setBuildForm({
              ...buildForm,
              anomalyRules: { ...buildForm.anomalyRules, highOutputWindowYears: Number(e.target.value) },
            })}
          />
        </div>

        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy}>
          {busy ? 'Saving…' : 'Save custom build'}
        </button>
      </form>

      {msg && <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginTop: '1rem' }}>{msg}</div>}
    </>
  );
}
