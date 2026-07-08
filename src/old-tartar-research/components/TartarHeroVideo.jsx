import styles from '../tartar.module.css';

const MP4 = '/aibhive_tatar_tartarian_research.mp4';
const WEBM = '/aibhive_tatar_tartarian_research.webm';

export default function TartarHeroVideo({ compact = false }) {
  return (
    <section
      className={`${styles.hero} ${compact ? styles.heroCompact : ''}`}
      aria-label="Old Tartar Research intro"
    >
      <video
        className={styles.heroVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/og-image.png"
      >
        <source src={WEBM} type="video/webm" />
        <source src={MP4} type="video/mp4" />
      </video>
      <div className={styles.heroOverlay} />
      <div className={styles.heroCopy}>
        <p className={styles.heroEyebrow}>Historical research</p>
        <h2 className={styles.heroTitle}>Old Tartar Research</h2>
        <p className={styles.heroSub}>
          Ingest archives, extract entity mentions, and flag statistical anomalies across centuries of records.
        </p>
      </div>
    </section>
  );
}
