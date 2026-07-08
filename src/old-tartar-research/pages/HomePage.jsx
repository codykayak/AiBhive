import { useTartar } from '../context/TartarContext';
import { CreditBalance } from '../components/AppCard';
import styles from '../tartar.module.css';

const STEPS = [
  {
    n: 1,
    title: 'Set up archives',
    body: 'Enable built-in sources (Internet Archive, LOC, Chronicling America) or add your own catalog entries.',
    tab: 'archives',
  },
  {
    n: 2,
    title: 'Run research',
    body: 'Add search terms, ingest documents, and let AI extract entity mentions from 18th–early 20th century records.',
    tab: 'research',
  },
  {
    n: 3,
    title: 'Find anomalies',
    body: 'Detect statistical spikes — e.g. dozens of major structures credited to one architect in a narrow decade.',
    tab: 'research',
  },
];

export default function HomePage({ onTab }) {
  const { profile, sources, user } = useTartar();
  const enabledSources = sources.filter((s) => s.enabled);

  return (
    <>
      <h1 className={styles.pageTitle}>Welcome back</h1>
      <p className={styles.pageSub}>
        Historical anomaly detection across archival sources. Hive credits, your own API keys, or a partner code for reduced fees.
      </p>

      <div className={styles.statRow}>
        <CreditBalance />
        <div className={styles.stat}>
          <div className={styles.statVal}>{enabledSources.length}</div>
          <div className={styles.statLabel}>Active archives</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statVal}>{profile?.billingMode === 'byok' ? 'BYOK' : 'Credits'}</div>
          <div className={styles.statLabel}>Billing mode</div>
        </div>
      </div>

      <section className={styles.stepSection}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.stepGrid}>
          {STEPS.map((step) => (
            <article key={step.n} className={styles.stepCard}>
              <span className={styles.stepNum}>{step.n}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => onTab?.(step.tab)}
              >
                Go to {step.tab === 'archives' ? 'Archives' : 'Research'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.ctaRow}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onTab?.('research')}>
          Start researching
        </button>
        <button type="button" className={styles.btn} onClick={() => onTab?.('settings')}>
          Billing &amp; settings
        </button>
      </div>

      {user?.email && (
        <p className={styles.signedInAs}>Signed in as {user.email}</p>
      )}
    </>
  );
}
