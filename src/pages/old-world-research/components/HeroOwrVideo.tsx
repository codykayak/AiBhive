import styles from '../oldWorldResearch.module.css';

const TAGLINE = 'The most powerful research tool known to humankind.';

export default function HeroOwrVideo() {
  return (
    <section className={styles.owrVideoHero} aria-label="Old World Research hero">
      <video
        className={styles.owrVideoHeroBg}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/tartar-map-hero.jpg"
      >
        <source src="/aibhive-research_data-ai-library.mp4" type="video/mp4" />
      </video>

      <div className={styles.owrVideoHeroOverlay} />

      <div className={styles.owrVideoHeroContent}>
        <h1 className={styles.owrVideoHeroTitle}>Research — Community Sourced Library</h1>

        <div className={styles.owrMarqueeWrap} aria-hidden>
          <div className={styles.owrMarqueeTrack}>
            <span>{TAGLINE}</span>
            <span>{TAGLINE}</span>
            <span>{TAGLINE}</span>
          </div>
        </div>
      </div>

      <p className={styles.owrVideoHeroScroll}>↓ Scroll down to explore the library ↓</p>
    </section>
  );
}
