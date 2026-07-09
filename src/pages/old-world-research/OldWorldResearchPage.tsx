import { SEO } from '../../components/SEO';
import TartarCustomizeFab from '../../old-tartar-research/components/TartarCustomizeFab';
import HeroTartaria from './components/HeroTartaria';
import OwrBuilderPanel from './components/OwrBuilderPanel';
import OwrResearchWorkbench from './components/OwrResearchWorkbench';
import { OwrWorkflowProvider } from './context/OwrWorkflowContext';
import styles from './oldWorldResearch.module.css';

export default function OldWorldResearchPage() {
  return (
    <OwrWorkflowProvider>
      <div className={styles.owr}>
        <SEO
          title="Old World Research — The Forgotten World | AiBhive"
          description="Explore Tartaria, mud floods, antiquitech, and hidden history. Fable Scrape, OCR, archives, RAG search, and 3D research tools."
          keywords="old world research, Tartaria, forgotten world, historical archives, OCR, RAG, star forts, mud flood, Fable Scrape"
        />
        <HeroTartaria />
        <OwrBuilderPanel />
        <OwrResearchWorkbench />
        <TartarCustomizeFab />
      </div>
    </OwrWorkflowProvider>
  );
}
