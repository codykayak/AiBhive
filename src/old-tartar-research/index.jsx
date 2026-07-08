/**
 * Old Tartar Research — historical anomaly detection app.
 * Runs inside Hive Apps (not MacroREI /apps routes).
 */

import { useEffect, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { TartarProvider, useTartar } from './context/TartarContext';
import TartarLayout from './components/TartarLayout';
import TartarHeroVideo from './components/TartarHeroVideo';
import AppsPage from './pages/AppsPage';
import DashboardPage from './pages/DashboardPage';
import SourcesPage from './pages/SourcesPage';
import MentionsPage from './pages/MentionsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import SearchTermsPage from './pages/SearchTermsPage';
import CustomBuildPage from './pages/CustomBuildPage';
import SettingsPage from './pages/SettingsPage';
import styles from './tartar.module.css';

function TartarPage({ tab, onTab }) {
  const { syncing, error } = useTartar();

  return (
    <>
      <TartarHeroVideo compact />
      {syncing && (
        <div className={`${styles.alert} ${styles.alertInfo}`}>Syncing your research profile…</div>
      )}
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          {error}
          <p className={styles.pageSub} style={{ margin: '0.5rem 0 0' }}>
            You can still browse the workspace. API features need a signed-in session and server connection.
          </p>
        </div>
      )}
      {tab === 'apps' && <AppsPage onOpen={onTab} />}
      {tab === 'dashboard' && <DashboardPage />}
      {tab === 'sources' && <SourcesPage />}
      {tab === 'mentions' && <MentionsPage />}
      {tab === 'anomalies' && <AnomaliesPage />}
      {tab === 'search-terms' && <SearchTermsPage />}
      {tab === 'build' && <CustomBuildPage />}
      {tab === 'settings' && <SettingsPage />}
    </>
  );
}

function TartarWorkspace({ user, onSignOut }) {
  const [tab, setTab] = useState('dashboard');

  return (
    <TartarProvider user={user}>
      <TartarLayout activeTab={tab} onTab={setTab} onSignOut={onSignOut}>
        <TartarPage tab={tab} onTab={setTab} />
      </TartarLayout>
    </TartarProvider>
  );
}

export default function OldTartarResearch() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  async function signIn() {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(e.message ?? 'Sign-in failed');
    }
  }

  return (
    <div className={styles.tartar}>
      {!ready ? (
        <div className={styles.authWrap}>
          <p className={styles.pageSub}>Loading…</p>
        </div>
      ) : !user ? (
        <div className={styles.authShell}>
          <TartarHeroVideo />
          <div className={styles.authWrap}>
            <div className={styles.card} style={{ maxWidth: 420, width: '100%' }}>
              <h1 className={styles.pageTitle}>Old Tartar Research</h1>
              <p className={styles.pageSub}>
                Sign in with Google to ingest archives, extract historical mentions, and detect anomalies.
                Uses Hive credits or your own API keys (BYOK).
              </p>
              {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={signIn}>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      ) : (
        <TartarWorkspace user={user} onSignOut={() => signOut(auth)} />
      )}
    </div>
  );
}
