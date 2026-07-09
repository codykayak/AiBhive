import { SEO } from '../../components/SEO';
import TartarCustomizeFab from '../../old-tartar-research/components/TartarCustomizeFab';
import HeroOwrVideo from './components/HeroOwrVideo';
import OwrWelcomeSection from './components/OwrWelcomeSection';
import OwrResearchWorkbench from './components/OwrResearchWorkbench';
import { OwrWorkflowProvider } from './context/OwrWorkflowContext';
import styles from './oldWorldResearch.module.css';

export default function OldWorldResearchPage() {
  return (
    <OwrWorkflowProvider>
      <div className={styles.owr}>
        <SEO
          title="Old World Research — Community Sourced Library | AiBhive"
          description="The most powerful research tool known to humankind. Old World community library: scrape archives, OCR, ask smart questions, and share what you build."
          keywords="old world research, community sourced library, Tartaria, Fable Scrape, OCR, RAG, historical archives"
        />
        <HeroOwrVideo />
        <OwrWelcomeSection />
        <OwrResearchWorkbench />
        <TartarCustomizeFab />
      </div>
    </OwrWorkflowProvider>
  );
}
