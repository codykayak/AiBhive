/**
 * Old Tartar Research — historical anomaly detection app.
 * Runs inside Hive Apps (not MacroREI /apps routes).
 */

import { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { TartarProvider, useTartar } from './context/TartarContext';
import TartarLayout from './components/TartarLayout';
import AppsPage from './pages/AppsPage';
import DashboardPage from './pages/DashboardPage';
import SourcesPage from './pages/SourcesPage';
import MentionsPage from './pages/MentionsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import SearchTermsPage from './pages/SearchTermsPage';
import CustomBuildPage from './pages/CustomBuildPage';
import SettingsPage from './pages/SettingsPage';
import styles from './tartar.module.css';

function TartarRoutes() {
  const { loading, error } = useTartar();

  if (loading) {
    return <p className={styles.pageSub}>Loading research workspace…</p>;
  }

  return (
    <>
      {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
      <Routes>
        <Route path="apps" element={<AppsPage />} />
        <Route index element={<DashboardPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="mentions" element={<MentionsPage />} />
        <Route path="anomalies" element={<AnomaliesPage />} />
        <Route path="search-terms" element={<SearchTermsPage />} />
        <Route path="build" element={<CustomBuildPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </>
  );
}

function TartarWorkspace({ user }) {
  return (
    <TartarProvider user={user}>
      <TartarLayout onSignOut={() => signOut(auth)}>
        <TartarRoutes />
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

  if (!ready) {
    return <div className={styles.authWrap}><p className={styles.pageSub}>Loading…</p></div>;
  }

  if (!user) {
    return (
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
    );
  }

  return (
    <MemoryRouter>
      <TartarWorkspace user={user} />
    </MemoryRouter>
  );
}
