import { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../oldWorldResearch.module.css';

export default function OwrOutputPanel() {
  const { output, clearOutput, scrapeText, ocrText } = useOwrWorkflow();
  const [filter, setFilter] = useState('');

  const combined = useMemo(() => {
    const blocks: string[] = [];
    if (scrapeText) blocks.push('--- Fable Scrape ---\n' + scrapeText);
    if (ocrText) blocks.push('--- OCR batch ---\n' + ocrText);
    for (const entry of output) {
      blocks.push(`--- ${entry.title} ---\n${entry.text}`);
    }
    return blocks.join('\n\n');
  }, [output, scrapeText, ocrText]);

  const display = useMemo(() => {
    if (!filter.trim()) return combined;
    const q = filter.toLowerCase();
    const lines = combined.split('\n');
    const hits = lines.filter((l) => l.toLowerCase().includes(q));
    if (hits.length) return hits.join('\n');
    const paras = combined.split(/\n{2,}/);
    return paras.filter((p) => p.toLowerCase().includes(q)).join('\n\n') || 'No matches in your research output.';
  }, [combined, filter]);

  const wordCount = combined.split(/\s+/).filter(Boolean).length;

  return (
    <section className={styles.owrOutput} aria-label="Research output">
      <div className={styles.owrOutputHeader}>
        <div>
          <h3>Research output</h3>
          <p>
            {wordCount.toLocaleString()} words in session · builds your OCR / RAG library as you chain tools
          </p>
        </div>
        {combined && (
          <button type="button" className={styles.owrBtn} onClick={clearOutput}>
            <Trash2 size={14} className="inline mr-1" />
            Clear session
          </button>
        )}
      </div>

      <pre className={styles.owrOutputText} role="log" aria-live="polite">
        {display || 'Run Fable Scrape, OCR, or search the library — results appear here as plain text you can copy or send to the next step.'}
      </pre>

      <form
        className={styles.owrOutputSearch}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Search size={18} className={styles.owrOutputSearchIcon} aria-hidden />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search this session's output — keywords, URLs, place names…"
          aria-label="Search research output"
        />
      </form>
    </section>
  );
}
