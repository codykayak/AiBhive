import { useTartar } from '../context/TartarContext';
import AppCard, { CreditBalance } from '../components/AppCard';
import styles from '../tartar.module.css';

export default function AppsPage() {
  const { apps, user } = useTartar();

  return (
    <>
      <h1 className={styles.pageTitle}>Apps</h1>
      <p className={styles.pageSub}>
        Platform research apps and your personal builds. Custom builds appear here only when you are signed in.
      </p>

      {!user && (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          Sign in to see your custom research build alongside platform apps.
        </div>
      )}

      <div className={styles.grid}>
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </>
  );
}
