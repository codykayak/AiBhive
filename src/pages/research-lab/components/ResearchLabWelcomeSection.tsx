import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Sparkles, Share2, Search, MessageSquare, Languages } from 'lucide-react';
import welcomeBg from '../../../research-ai-tools-translation-library.jpg';
import StartResearchingButton from './StartResearchingButton';
import styles from '../researchLab.module.css';

const POINTS = [
  {
    icon: Sparkles,
    body: 'Fully customise this app — build your own new tools.',
  },
  {
    icon: Share2,
    body: 'Community-built library where what you build you can share with others.',
  },
  {
    icon: Search,
    body: 'Start by viewing pre-existing material or by using the most powerful research tools in existence.',
  },
  {
    icon: MessageSquare,
    body: "Don't just search terms, ask questions and get smart answers.",
  },
  {
    icon: Languages,
    body: 'Translate to and from any language. Yes, even Cuneiform and Hieroglyphs.',
  },
];

export default function ResearchLabWelcomeSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section ref={ref} className={styles.rlWelcomeParallax} aria-label="Research Lab welcome">
      <motion.div className={styles.rlWelcomeParallaxBg} style={{ y: bgY }} aria-hidden>
        <img src={welcomeBg} alt="" />
        <div className={styles.rlWelcomeParallaxOverlay} />
      </motion.div>

      <div className={styles.rlWelcomeContent}>
        <header className={styles.rlWelcomeHeader}>
          <h2>Research — Build — Share</h2>
          <blockquote className={styles.rlWelcomeQuote}>
            &ldquo;I&apos;ve been wanting to build this for years, a place where people can research with
            the best tools available, make great scientific discoveries and uncover history in real
            time then, share their findings with the community&rdquo;
            <cite>— AiBhive</cite>
          </blockquote>
        </header>

        <ul className={styles.rlWelcomeList}>
          {POINTS.map((point) => (
            <li key={point.body}>
              <point.icon className={styles.rlWelcomeListIcon} aria-hidden />
              <span>{point.body}</span>
            </li>
          ))}
        </ul>

        <div className={styles.rlWelcomeCta}>
          <StartResearchingButton size="md" />
        </div>
      </div>
    </section>
  );
}
