import { Link } from 'react-router-dom';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import OldTartarResearch from '../../../old-tartar-research';
import OwrFableScrape from './OwrFableScrape';
import OwrOcrBatch from './OwrOcrBatch';
import OwrInlineWebResearch from './OwrInlineWebResearch';
import OwrInlineTranslate from './OwrInlineTranslate';
import OwrOutputPanel from './OwrOutputPanel';
import ResearchLabWorkspaceGuide from './ResearchLabWorkspaceGuide';
import styles from '../researchLab.module.css';

const STEPS = [
  { id: 0, label: '① Fable Scrape', short: 'Scrape' },
  { id: 1, label: '② OCR Lab', short: 'OCR' },
  { id: 2, label: '③ Communal Library', short: 'Library' },
  { id: 3, label: '④ Web Research', short: 'Research' },
  { id: 4, label: '⑤ Translate', short: 'Translate' },
] as const;

export default function OwrResearchWorkbench() {
  const { activeStep, setActiveStep } = useOwrWorkflow();

  return (
    <section className={styles.owrWorkbench} aria-label="Research Lab workbench">
      <ResearchLabWorkspaceGuide />

      <header className={styles.owrWorkbenchHeader}>
        <h2>Research tools</h2>
        <p>Fable Scrape, OCR, RAG library, web research, and translation — one workflow below.</p>
      </header>

      <div className={styles.owrStepRow} role="tablist" aria-label="Research steps">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={activeStep === s.id}
            className={`${styles.owrStepTab} ${activeStep === s.id ? styles.owrStepTabActive : ''}`}
            onClick={() => setActiveStep(s.id)}
          >
            <span className={styles.owrStepTabFull}>{s.label}</span>
            <span className={styles.owrStepTabShort}>{s.short}</span>
          </button>
        ))}
      </div>

      <div className={styles.owrPanel} role="tabpanel">
        {activeStep === 0 && <OwrFableScrape />}
        {activeStep === 1 && <OwrOcrBatch />}
        {activeStep === 2 && (
          <div className={styles.owrEmbeddedTartar}>
            <div className={styles.rlWsLibBridge}>
              <h3>Communal Library</h3>
              <p>
                The shared knowledge lattice lives on its own landing page — rotate the 3D map, open
                topic corpora, and publish discoveries from your harvests.
              </p>
              <Link className={styles.rlWsCommunalCta} to="/research-lab/communal-library">
                Open Communal Library
              </Link>
            </div>
            <OldTartarResearch embedded />
          </div>
        )}
        {activeStep === 3 && <OwrInlineWebResearch />}
        {activeStep === 4 && <OwrInlineTranslate />}
      </div>

      <OwrOutputPanel />
    </section>
  );
}
