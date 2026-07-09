import styles from '../oldWorldResearch.module.css';

const TAGLINE = 'The most powerful research tool known to humankind.';

export default function HeroResearch() {
  return (
    <section className={styles.researchHero} aria-label="Research hero">
      <video
        className={styles.researchHeroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/tartar-map-hero.jpg"
      >
        <source src="/aibhive-research_data-ai-library.mp4" type="video/mp4" />
      </video>

      <div className={styles.researchHeroOverlay} />

      <div className={styles.researchHeroContent}>
        <h1 className={styles.researchHeroTitle}>Research — Community Sourced Library</h1>

        <div className={styles.researchMarqueeWrap} aria-hidden>
          <div className={styles.researchMarqueeTrack}>
            <span>{TAGLINE}</span>
            <span>{TAGLINE}</span>
            <span>{TAGLINE}</span>
          </div>
        </div>
      </div>

      <div className={styles.researchHeroScroll}>
        ↓ Scroll to explore the research library ↓
      </div>
    </section>
  );
}
