import { useTartar } from '../context/TartarContext';
import { CreditBalance } from '../components/AppCard';
import { ArchiveCounterRow } from '../components/TartarHeroBanner';
import styles from '../tartar.module.css';

const STEPS = [
  {
    n: 1,
    title: 'Enable archives',
    body: 'Turn on Internet Archive, LOC, Chronicling America, or add your own. Each source becomes a searchable catalog entry.',
    tab: 'archives',
  },
  {
    n: 2,
    title: 'Retrieve & index',
    body: 'Run ingestion — documents are fetched, text extracted, and entity mentions stored for RAG-style search and comparison.',
    tab: 'research',
  },
  {
    n: 3,
    title: 'Cross-examine & detect',
    body: 'Filter mentions by entity, year, and source. Compare records side-by-side and run anomaly detection with your own AI focus prompt.',
    tab: 'research',
  },
];

export default function HomePage({ onTab }) {
  const { profile, sources, archiveStats, user } = useTartar();
  const enabledSources = sources.filter((s) => s.enabled);
  const userStats = archiveStats?.user;

  return (
    <>
      <div className={styles.missionCard}>
        <h2 className={styles.sectionTitle}>How this works (RAG-style research)</h2>
        <p className={styles.missionBody}>
          This is not just a static library — it <strong>retrieves</strong> documents from real archives, <strong>indexes</strong> them
          with AI extraction, and lets you <strong>query and cross-examine</strong> mentions across sources. You pay API + infrastructure;
          with a partner code there is no 30% markup. Opt in to share and everyone can benefit from pooled anomalies and mentions.
        </p>
        {userStats?.isRagReady ? (
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            Your archive is active — {userStats.mentionsExtracted} mentions indexed across {userStats.activeSources} sources. Head to Research to compare documents.
          </div>
        ) : (
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            No documents indexed yet. Enable archives, then run ingestion from the Research tab.
          </div>
        )}
      </div>

      <ArchiveCounterRow stats={archiveStats} />

      <div className={styles.statRow}>
        <CreditBalance />
        <div className={styles.stat}>
          <div className={styles.statVal}>{enabledSources.length}</div>
          <div className={styles.statLabel}>Archives enabled</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statVal}>{archiveStats?.builtArchives ?? 0}</div>
          <div className={styles.statLabel}>Archives with data</div>
        </div>
      </div>

      <section className={styles.stepSection}>
        <h2 className={styles.sectionTitle}>Three steps</h2>
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
          Share &amp; billing
        </button>
      </div>

      {user?.email && (
        <p className={styles.signedInAs}>Signed in as {user.email}</p>
      )}
    </>
  );
}
