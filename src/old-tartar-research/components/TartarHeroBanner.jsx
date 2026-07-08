import { useEffect, useState } from 'react';
import styles from '../tartar.module.css';

const MAP_BG = '/tartar-map-hero.jpg';
const MP4 = '/aibhive_tatar_tartarian_research.mp4';
const WEBM = '/aibhive_tatar_tartarian_research.webm';

export default function TartarHeroBanner({ fullWidth = true, showVideo = true }) {
  return (
    <section
      className={`${styles.heroBanner} ${fullWidth ? styles.heroBannerFull : ''}`}
      aria-label="Old Tartar Research — community archives"
    >
      <div
        className={styles.heroMapBg}
        style={{ backgroundImage: `url(${MAP_BG})` }}
        role="img"
        aria-label="1851 map of Independent Tartary"
      />
      <div className={styles.heroBannerOverlay} />
      <div className={styles.heroBannerGrid}>
        <div className={styles.heroBannerCopy}>
          <p className={styles.heroEyebrow}>Community archives · RAG research</p>
          <h1 className={styles.heroBannerTitle}>Help build the world&apos;s Tartar research library</h1>
          <p className={styles.heroBannerLead}>
            <strong>Hive credits</strong> power processing and AI API costs — ingest documents, search archives, and build
            the shared library. Bring your own API keys if you prefer. Every document you add is indexed so you can search,
            compare, and cross-examine mentions across archives.
          </p>
          <p className={styles.heroBannerSub}>
            Opt in to share your findings and the whole community benefits. Everyone can access pooled research when contributors choose to share.
          </p>
        </div>
        {showVideo && (
          <div className={styles.heroVideoPanel}>
            <video
              className={styles.heroVideoInset}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={MAP_BG}
            >
              <source src={WEBM} type="video/webm" />
              <source src={MP4} type="video/mp4" />
            </video>
          </div>
        )}
      </div>
    </section>
  );
}

/** Animated odometer-style counter */
export function AnimatedCounter({ value = 0, label, suffix = '', highlight = false }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className={`${styles.counterCard} ${highlight ? styles.counterHighlight : ''}`}>
      <div className={styles.counterValue}>
        {display.toLocaleString()}
        {suffix}
      </div>
      <div className={styles.counterLabel}>{label}</div>
    </div>
  );
}

export function ArchiveCounterRow({ stats }) {
  const user = stats?.user ?? {};
  const community = stats?.community ?? {};

  return (
    <section className={styles.counterSection} aria-live="polite">
      <h2 className={styles.sectionTitle}>Archive pulse</h2>
      <p className={styles.counterIntro}>
        Live counts from your workspace and the opt-in community pool. Retrieved = documents pulled from archives;
        indexed = AI-extracted mentions ready for search and cross-examination.
      </p>
      <div className={styles.counterGrid}>
        <AnimatedCounter
          value={user.documentsRetrieved ?? 0}
          label="Documents retrieved (you)"
          highlight
        />
        <AnimatedCounter
          value={user.mentionsExtracted ?? 0}
          label="Mentions indexed (you)"
        />
        <AnimatedCounter
          value={stats?.builtArchives ?? 0}
          label="Archives built"
        />
        <AnimatedCounter
          value={community.documentsIndexed ?? 0}
          label="Community pool indexed"
        />
        <AnimatedCounter
          value={stats?.undiscoveredEstimate ?? community.undiscoveredEstimate ?? 0}
          label="Potential archives undiscovered"
          highlight
        />
        <AnimatedCounter
          value={community.contributorCount ?? 0}
          label="Contributors sharing"
        />
      </div>
      {user.lastJob && (
        <p className={styles.counterMeta}>
          Last ingestion: {user.lastJob.status} — {user.lastJob.itemsProcessed ?? 0} documents, {user.lastJob.mentionsExtracted ?? 0} mentions
        </p>
      )}
    </section>
  );
}
