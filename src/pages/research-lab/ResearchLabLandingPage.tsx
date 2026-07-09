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
        description="You now have access to the most powerful research tools known to Humankind. Scrape archives, OCR, translate, ask smart questions, and share discoveries with the community."
        keywords="research lab, community sourced library, Fable Scrape, OCR, RAG, translation, historical archives, AiBhive"
      />
      <ResearchLabHero />
      <ResearchLabWelcomeSection />
      <ResearchLabToolsSection />
      <ResearchLabCustomizeFab />
    </div>
  );
}
