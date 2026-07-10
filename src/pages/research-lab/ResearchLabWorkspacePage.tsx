import { useEffect, useState, type CSSProperties } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { SEO } from '../../components/SEO';
import OwrResearchWorkbench from './components/OwrResearchWorkbench';
import ResearchLabWorkspaceHero from './components/ResearchLabWorkspaceHero';
import { OwrWorkflowProvider } from './context/OwrWorkflowContext';
import { ResearchLabUserProvider } from './context/ResearchLabUserContext';
import workspaceBg from '../../research-ai-tools-translation-library.jpg';
import styles from './researchLab.module.css';

function ResearchLabWorkspace({ userEmail }: { userEmail: string }) {
  return (
    <OwrWorkflowProvider>
      <div
        className={`${styles.rlWorkspace} ${styles.rlWorkspaceBg}`}
        style={{ '--rl-workspace-bg': `url(${workspaceBg})` } as CSSProperties}
      >
        <ResearchLabWorkspaceHero />
        <header className={styles.rlWorkspaceBar}>
          <div>
            <p className={styles.rlWorkspaceEyebrow}>Research Lab</p>
            <h1 className={styles.rlWorkspaceTitle}>Research workspace</h1>
          </div>
          <div className={styles.rlWorkspaceActions}>
            <span className={styles.rlWorkspaceEmail}>{userEmail}</span>
            <button type="button" className={styles.rlBtnGhost} onClick={() => signOut(auth)}>
              Sign out
            </button>
          </div>
        </header>
        <OwrResearchWorkbench />
      </div>
    </OwrWorkflowProvider>
  );
}

export default function ResearchLabWorkspacePage() {
  const [user, setUser] = useState(auth.currentUser);
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
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    }
  }

  return (
    <div className={styles.rl}>
      <SEO
        title="Research Lab Workspace — Sign in to use tools | AiBhive"
        description="Sign in to AiBhive Research Lab workspace for Fable Scrape, OCR, RAG library, web research, and translation. Private sessions are not intended for search indexing."
        keywords="research lab workspace, Fable Scrape, OCR, RAG, sign in"
        noIndex
      />

      {!ready ? (
        <div className={styles.rlAuthShell}>
          <p className={styles.rlAuthSub}>Loading…</p>
        </div>
      ) : !user ? (
        <div className={styles.rlAuthShell}>
          <div className={styles.rlAuthCard}>
            <p className={styles.rlWorkspaceEyebrow}>Research Lab</p>
            <h1 className={styles.rlAuthTitle}>Sign in to start researching</h1>
            <p className={styles.rlAuthSub}>
              Create an account or sign in to access Fable Scrape, OCR, the community RAG library,
              web research, and translation. Hive credits cover processing and AI usage when you run
              tools — or bring your own API keys to pay vendors directly plus a small platform fee.
            </p>
            {error && <div className={styles.rlAuthError}>{error}</div>}
            <button type="button" className={styles.rlBtnPrimary} onClick={signIn}>
              Sign in with Google
            </button>
            <p className={styles.rlAuthHint}>
              New here? Google sign-in creates your AiBhive account automatically.
            </p>
          </div>
        </div>
      ) : (
        <ResearchLabUserProvider user={user}>
          <ResearchLabWorkspace userEmail={user.email ?? 'Signed in'} />
        </ResearchLabUserProvider>
      )}
    </div>
  );
}
