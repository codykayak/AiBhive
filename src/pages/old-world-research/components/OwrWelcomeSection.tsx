import { Share2, Search, MessageSquare, ScanText } from 'lucide-react';
import styles from '../oldWorldResearch.module.css';

const POINTS = [
  {
    icon: Share2,
    body: 'Community-built library where what you build you can share with others.',
  },
  {
    icon: Search,
    body: 'Start by viewing pre-existing material or by using the most powerful web scraper in existence.',
  },
  {
    icon: MessageSquare,
    body: "Don't just search terms, ask questions and get smart answers.",
  },
  {
    icon: ScanText,
    body: 'Save manual examination.',
  },
];

export default function OwrWelcomeSection() {
  return (
    <section className={styles.researchWelcome} aria-label="Welcome to Research">
      <div className={styles.researchWelcomeInner}>
        <header className={styles.researchWelcomeHeader}>
          <h2>Research — Build — Share</h2>
        </header>

        <div className={styles.researchWelcomeGrid}>
          {POINTS.map((point, i) => (
            <article key={i} className={styles.researchWelcomeCard}>
              <span className={styles.researchWelcomeNum}>{i + 1}</span>
              <point.icon className={styles.researchWelcomeCardIcon} aria-hidden />
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
