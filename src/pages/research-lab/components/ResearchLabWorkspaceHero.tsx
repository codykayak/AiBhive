import { useEffect, useState } from 'react';
import styles from '../researchLab.module.css';

const TYPED = 'Research, Build, Share';

export default function ResearchLabWorkspaceHero() {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pause' | 'deleting'>('typing');

  useEffect(() => {
    let timer: number;
    if (phase === 'typing') {
      if (typed.length < TYPED.length) {
        timer = window.setTimeout(() => setTyped(TYPED.slice(0, typed.length + 1)), 70);
      } else {
        timer = window.setTimeout(() => setPhase('pause'), 1800);
      }
    } else if (phase === 'pause') {
      timer = window.setTimeout(() => setPhase('deleting'), 400);
    } else if (typed.length > 0) {
      timer = window.setTimeout(() => setTyped(TYPED.slice(0, typed.length - 1)), 35);
    } else {
      timer = window.setTimeout(() => setPhase('typing'), 500);
    }
    return () => window.clearTimeout(timer);
  }, [typed, phase]);

  return (
    <section className={styles.rlWsHero} aria-label="Research workspace hero">
      <div className={styles.rlWsHeroMedia} aria-hidden>
        <video
          className={styles.rlWsHeroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/rl-hero-research-tools.png"
        >
          <source src="/aibhive_tatar_tartarian_research.mp4" type="video/mp4" />
          <source src="/aibhive_tatar_tartarian_research.webm" type="video/webm" />
        </video>
        <div className={styles.rlWsHeroScrim} />
      </div>
      <div className={styles.rlWsHeroInner}>
        <p className={styles.rlWsHeroEyebrow}>AiBhive · Research tools</p>
        <h1 className={styles.rlWsHeroTitle}>Research Deeply</h1>
        <p className={styles.rlWsHeroTyped} aria-live="polite">
          <span>{typed}</span>
          <span className={styles.rlWsHeroCaret} aria-hidden>
            |
          </span>
        </p>
      </div>
    </section>
  );
}
