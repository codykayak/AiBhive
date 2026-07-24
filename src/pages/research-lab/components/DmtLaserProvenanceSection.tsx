import { ExternalLink, FlaskConical, Layers, ScanLine } from 'lucide-react';
import { DMT_CATALOG_ATTRIBUTION, DMT_CODE_LINKS, PHOTO_MATCH_PIPELINES, PHOTO_MATCH_TIPS } from '../dmtLaserProvenance';
import styles from '../dmtMatrixDecoder.module.css';

type Props = {
  symbolCount?: number;
  registryCount?: number;
};

export default function DmtLaserProvenanceSection({ symbolCount, registryCount }: Props) {
  return (
    <section className={styles.provenanceSection} aria-label="Laser experiment and glyph sources">
      <div className={styles.provenanceHeader}>
        <FlaskConical size={20} className={styles.provenanceIcon} aria-hidden />
        <div>
          <h2 className={styles.provenanceTitle}>The 650nm laser experiment</h2>
          <p className={styles.provenanceLead}>
            What you are decoding, where the glyphs came from, and how photo matching works.
          </p>
        </div>
      </div>

      <div className={styles.provenanceCard}>
        <h3 className={styles.provenanceSubTitle}>What is this?</h3>
        <p>
          The <strong>DMT Code</strong> project documents visual symbols reported during closed-eye and
          laser-priming sessions — especially patterns that appear when a{' '}
          <strong>650nm red laser</strong> is shone on a surface (wall, ceiling, skin) after visual
          priming. Observers describe letter-like forms, grids, mandalas, and katakana-like tiles that
          seem to project onto physical space rather than only in the mind&apos;s eye.
        </p>
        <p>
          AiBhive does not claim these are a proven language. We treat them as a{' '}
          <strong>repeatable visual corpus</strong> worth measuring: frequency, entropy, script
          resemblance, and community naming — the same way the hive handles other anomalous archives.
        </p>
      </div>

      <div className={styles.provenanceCard}>
        <h3 className={styles.provenanceSubTitle}>Where our {symbolCount ?? 45} glyphs came from</h3>
        <ul className={styles.provenanceList}>
          <li>
            <strong>Archetype catalogue</strong> — curated 100×100 PNG tiles from the DMT Code visual
            symbol project (T-bar, bilateral cross, hex lattice, katakana grid, etc.).
          </li>
          <li>
            <strong>Community registry</strong> — {registryCount ?? 21} live submissions synced from{' '}
            <a href={DMT_CODE_LINKS.registry} target="_blank" rel="noopener noreferrer">
              dmtcode.com/registry
            </a>{' '}
            (Supabase <code>registry_glyphs</code> — real observer photos normalized to catalogue
            tiles).
          </li>
          <li>
            <strong>License</strong> — {DMT_CATALOG_ATTRIBUTION}. Please credit{' '}
            <a href={DMT_CODE_LINKS.home} target="_blank" rel="noopener noreferrer">
              dmtcode.com
            </a>{' '}
            when sharing findings.
          </li>
        </ul>

        <div className={styles.sourceLinks}>
          <a href={DMT_CODE_LINKS.home} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
            <ExternalLink size={14} aria-hidden />
            dmtcode.com
          </a>
          <a href={DMT_CODE_LINKS.registry} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
            <ExternalLink size={14} aria-hidden />
            Glyph registry
          </a>
          <a href={DMT_CODE_LINKS.dataJson} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
            <ExternalLink size={14} aria-hidden />
            data.json
          </a>
          <a href={DMT_CODE_LINKS.zenodo} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
            <ExternalLink size={14} aria-hidden />
            Zenodo dataset
          </a>
        </div>
      </div>

      <div className={styles.provenanceCard}>
        <h3 className={styles.provenanceSubTitle}>
          <ScanLine size={16} style={{ display: 'inline', marginRight: 6 }} />
          Can it read characters out of my laser photo?
        </h3>
        <p className={styles.provenanceYes}>
          <strong>Yes — with caveats.</strong> Upload a raw photograph and we run three matchers against
          the catalogue IDs you see below. Matches are hypotheses with confidence scores, not
          ground truth.
        </p>

        <div className={styles.pipelineGrid}>
          {PHOTO_MATCH_PIPELINES.map((p) => (
            <div key={p.id} className={styles.pipelineCard}>
              <div className={styles.pipelineTitle}>
                <Layers size={14} aria-hidden />
                {p.title}
              </div>
              <p>{p.body}</p>
            </div>
          ))}
        </div>

        <div className={styles.tipsGrid}>
          <div>
            <h4 className={styles.tipsHeading}>Works best when</h4>
            <ul className={styles.tipsList}>
              {PHOTO_MATCH_TIPS.worksWell.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={styles.tipsHeading}>May miss when</h4>
            <ul className={styles.tipsList}>
              {PHOTO_MATCH_TIPS.struggles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
