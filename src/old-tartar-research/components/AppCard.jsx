import { Link } from 'react-router-dom';
import { useTartar } from '../context/TartarContext';
import styles from '../tartar.module.css';

export default function AppCard({ app }) {
  const target = app.isCustom ? '/build' : '/';

  return (
    <article className={styles.card}>
      <span className={styles.cardBadge}>{app.isCustom ? 'Your build' : app.status}</span>
      <h3 className={styles.cardTitle}>{app.name}</h3>
      <p className={styles.cardMeta}>{app.description}</p>
      {app.features?.length > 0 && (
        <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--tartar-muted)' }}>
          {app.features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}
      <Link to={target} className={`${styles.btn} ${styles.btnPrimary}`}>
        Open
      </Link>
    </article>
  );
}

export function CreditBalance() {
  const { profile, platformFeeRate } = useTartar();
  const credits = profile?.hiveCredits ?? 0;
  const mode = profile?.billingMode ?? 'hive_credits';

  return (
    <div className={styles.stat}>
      <div className={styles.statVal}>{mode === 'byok' ? 'BYOK' : credits}</div>
      <div className={styles.statLabel}>
        {mode === 'byok' ? 'Your API keys' : `Hive credits (${Math.round(platformFeeRate * 100)}% platform fee)`}
      </div>
    </div>
  );
}
