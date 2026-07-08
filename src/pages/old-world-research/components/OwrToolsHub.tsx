import { useState } from 'react';
import { Link } from 'react-router-dom';
import OldTartarResearch from '../../../old-tartar-research';
import OwrOcrBatch from './OwrOcrBatch';
import styles from '../oldWorldResearch.module.css';

type Tab = 'library' | 'ocr' | 'web' | 'translate';

export default function OwrToolsHub() {
  const [tab, setTab] = useState<Tab>('library');

  return (
    <section className={styles.owrTools} aria-label="Research tools">
      <div className={styles.owrTabRow}>
        {([
          ['library', 'Research Library'],
          ['ocr', 'OCR Lab'],
          ['web', 'Web Research'],
          ['translate', 'Translation'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`${styles.owrTab} ${tab === id ? styles.owrTabActive : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.owrPanel}>
        {tab === 'library' && (
          <div className={styles.owrEmbeddedTartar}>
            <OldTartarResearch embedded />
          </div>
        )}
        {tab === 'ocr' && <OwrOcrBatch />}
        {tab === 'web' && (
          <div className="p-6 text-slate-300 text-sm space-y-4">
            <p>
              Deep web research, scraping, and OSINT — company discovery, domain intel, and document harvest.
              Uses Hive credits for cloud search tools.
            </p>
            <Link to="/app/research" className={`${styles.owrBtn} ${styles.owrBtnPrimary} inline-block`}>
              Open Web Intel Agent →
            </Link>
          </div>
        )}
        {tab === 'translate' && (
          <div className="p-6 text-slate-300 text-sm space-y-4">
            <p>
              Transcribe and translate archival audio or text in 20+ languages — no language barriers for old world documents.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/grow" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`}>
                Translation Lab →
              </Link>
              <Link to="/transcription" className={styles.owrBtn}>
                Transcription Studio
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
