import { useEffect, useState } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, Hexagon, Loader2, LogOut, Sparkles } from 'lucide-react';
import SocialPostsPanel from './SocialPostsPanel.jsx';
import { auth, googleProvider } from './firebase.js';
import ui from './ui.module.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    document.title = 'AiBhive AutoPoster — Social Post Factory';
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleLogin() {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setAuthError(e.message || 'Sign-in failed');
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  return (
    <div className={ui.page}>
      <div className={ui.honeycomb} aria-hidden="true" />

      <header className={ui.topBar}>
        <a href="https://www.aibhive.com" className={ui.backLink}>
          <ArrowLeft size={16} />
          aibhive.com
        </a>
        {user && (
          <div className={ui.userBar}>
            <span className={ui.userEmail}>{user.email}</span>
            <button type="button" className={`${ui.btnGhost} ${ui.btnSm}`} onClick={handleLogout}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </header>

      <div className={ui.appShell}>
        <header className={ui.appHeader}>
          <div className={ui.brandRow}>
            <div className={ui.logoMark}>
              <Hexagon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <p className={ui.eyebrow}>AiBhive</p>
              <h1>AutoPoster</h1>
            </div>
          </div>
          <p className={ui.tagline}>
            <Sparkles size={14} className={ui.taglineIcon} />
            AI researches industry news, writes platform-specific copy, and generates branded
            images for Facebook, Instagram, and X — ready to review and post.
          </p>
        </header>

        {loadingAuth && (
          <div className={ui.authCard}>
            <Loader2 size={28} className={ui.spinnerIcon} />
            <p>Checking sign-in…</p>
          </div>
        )}

        {!loadingAuth && !user && (
          <div className={ui.authCard}>
            <h2>Sign in to continue</h2>
            <p className={ui.hint}>
              Use your authorized Google account. Only admin emails on the allowlist can access
              AutoPoster.
            </p>
            {authError && <div className={ui.authError}>{authError}</div>}
            <button type="button" className={ui.googleBtn} onClick={handleLogin}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {!loadingAuth && user && <SocialPostsPanel user={user} />}
      </div>
    </div>
  );
}
