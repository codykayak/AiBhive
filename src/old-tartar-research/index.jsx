/**
 * Old Tartar Research — historical anomaly detection app.
 * Runs inside Hive Apps (not MacroREI /apps routes).
 */

import { useEffect, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { TartarProvider, useTartar } from './context/TartarContext';
import TartarLayout from './components/TartarLayout';
import TartarHeroBanner from './components/TartarHeroBanner';
import HomePage from './pages/HomePage';
import ResearchPage from './pages/ResearchPage';
import ArchivesPage from './pages/ArchivesPage';
import SettingsPage from './pages/SettingsPage';
import styles from './tartar.module.css';

function TartarPage({ tab, onTab }) {
  const { syncing, error } = useTartar();

  return (
    <>
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
      {tab === 'home' && <HomePage onTab={onTab} />}
      {tab === 'research' && <ResearchPage />}
      {tab === 'archives' && <ArchivesPage />}
      {tab === 'settings' && <SettingsPage />}
    </>
  );
}

function TartarWorkspace({ user, onSignOut, embedded = false }) {
  const [tab, setTab] = useState(embedded ? 'research' : 'home');

  return (
    <TartarProvider user={user}>
      <div className={styles.workspace}>
        {!embedded && <TartarHeroBanner fullWidth />}
        <TartarLayout activeTab={tab} onTab={setTab} onSignOut={onSignOut} userEmail={user?.email}>
          <TartarPage tab={tab} onTab={setTab} />
        </TartarLayout>
      </div>
    </TartarProvider>
  );
}

export default function OldTartarResearch({ embedded = false }) {
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
        <div className={embedded ? styles.authWrap : styles.authShellFull}>
          {!embedded && <TartarHeroBanner fullWidth />}
          <div className={styles.authWrap}>
            <div className={styles.card} style={{ maxWidth: 480, width: '100%' }}>
              <h1 className={styles.pageTitle}>{embedded ? 'Research Library' : 'Old Tartar Research'}</h1>
              <p className={styles.pageSub}>
                Sign in to ingest archives and search the RAG library. Hive credits cover processing and AI API costs.
              </p>
              {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={signIn}>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      ) : (
        <TartarWorkspace user={user} onSignOut={() => signOut(auth)} embedded={embedded} />
      )}
    </div>
  );
}
