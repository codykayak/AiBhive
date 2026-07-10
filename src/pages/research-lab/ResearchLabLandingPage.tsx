import { SEO } from '../../components/SEO';
import ResearchLabHero from './components/ResearchLabHero';
import ResearchLabWelcomeSection from './components/ResearchLabWelcomeSection';
import ResearchLabToolsSection from './components/ResearchLabToolsSection';
import ResearchLabCustomizeFab from './components/ResearchLabCustomizeFab';
import styles from './researchLab.module.css';

export default function ResearchLabLandingPage() {
  return (
    <div className={styles.rl}>
      <SEO
        title="Research Lab — Community Sourced Library | AiBhive"
        description="AiBhive Research Lab: scrape historical archives with Fable Scrape, batch OCR documents, translate modern and ancient scripts, ask smart RAG questions, and share discoveries in a community-sourced library."
        keywords="research lab, community sourced library, Fable Scrape, OCR, RAG, translation, historical archives, AiBhive research tools"
      />
      <ResearchLabHero />
      <ResearchLabWelcomeSection />
      <ResearchLabToolsSection />
      <ResearchLabCustomizeFab />
    </div>
  );
}
