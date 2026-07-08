import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import styles from '../oldWorldResearch.module.css';

const TITLE = 'Help Build the Library';
const BULLETS = [
  'No language barriers',
  'Convert any format into searchable data',
  'Map searchable overlays',
  'Filter and narrow your data',
  'Origination citation',
];

const VIDEO = '/tartarian_tartar_old_world_research_ai_aibhive.mp4';

export default function OwrHero() {
  const [displayed, setDisplayed] = useState('');
  const [voidPhase, setVoidPhase] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    setVoidPhase(false);
    const typeTimer = setInterval(() => {
      i += 1;
      setDisplayed(TITLE.slice(0, i));
      if (i >= TITLE.length) {
        clearInterval(typeTimer);
        setTimeout(() => setVoidPhase(true), 2200);
        setTimeout(() => {
          setVoidPhase(false);
          setCycle((c) => c + 1);
        }, 3800);
      }
    }, 70);
    return () => clearInterval(typeTimer);
  }, [cycle]);

  return (
    <section className={styles.owrHero} aria-label="Old World Research hero">
      <div className={styles.owrHeroCopy}>
        <p className={styles.owrEyebrow}>Old World Research · AiBhive</p>
        <h1
          className={`${styles.owrTypedTitle} ${voidPhase ? styles.void : ''}`}
          key={cycle}
        >
          {displayed}
          {!voidPhase && displayed.length < TITLE.length && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>|</motion.span>
          )}
        </h1>
        <h2 className={styles.owrSubtitle}>
          Language is no barrier anymore. Ask questions, not just search terms.
        </h2>
        <ul className={styles.owrBullets}>
          {BULLETS.map((b) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              {b}
            </motion.li>
          ))}
        </ul>
        <p className={styles.owrCreditsNote}>
          <strong>Hive credits</strong> cover processing and AI API costs — ingest archives, run OCR,
          search the RAG library, and help everyone build the shared research collection.
        </p>
      </div>
      <div className={styles.owrVideoWrap}>
        <div className={styles.owrVideoGlow} aria-hidden />
        <video
          className={styles.owrVideo}
          src={VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/tartar-map-hero.jpg"
        />
      </div>
    </section>
  );
}
