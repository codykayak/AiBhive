import { SEO } from '../../components/SEO';
import TartarCustomizeFab from '../../old-tartar-research/components/TartarCustomizeFab';
import HeroResearch from './components/HeroResearch';
import OwrWelcomeSection from './components/OwrWelcomeSection';
import OwrResearchWorkbench from './components/OwrResearchWorkbench';
import { OwrWorkflowProvider } from './context/OwrWorkflowContext';
import styles from './oldWorldResearch.module.css';

export default function OldWorldResearchPage() {
  return (
    <OwrWorkflowProvider>
      <div className={styles.owr}>
        <SEO
          title="Research — Community Sourced Library | AiBhive"
          description="The most powerful research tool known to humankind. Community-built library: scrape archives, OCR, ask smart questions, and share what you build."
          keywords="research library, community sourced, Fable Scrape, OCR, RAG, AiBhive, web scraper, smart answers"
        />
        <HeroResearch />
        <OwrWelcomeSection />
        <OwrResearchWorkbench />
        <TartarCustomizeFab />
      </div>
    </OwrWorkflowProvider>
  );
}
