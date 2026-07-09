import { useState } from 'react';
import { Loader2, Languages } from 'lucide-react';
import { sendIntelChat } from '../../../lib/intelWebApi';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

export default function OwrInlineTranslate() {
  const { scrapeText, ocrText, appendOutput } = useOwrWorkflow();
  const [source, setSource] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function useSessionText() {
    const combined = [scrapeText, ocrText].filter(Boolean).join('\n\n').slice(0, 8000);
    if (combined) setSource(combined);
  }

  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();
    const text = source.trim();
    if (!text) {
      setError('Paste archival text or pull from your session output.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await sendIntelChat({
        message: `Translate the following archival document text into ${targetLang}. Preserve names, dates, and place names. Add a brief note if the source language is uncertain.\n\n---\n${text}`,
        llmProvider: 'gemini',
      });
      appendOutput({
        step: 'translate',
        title: `Translation → ${targetLang}`,
        text: res.text,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.owrStepBody}>
      <div className={styles.owrStepIntro}>
        <h3>
          <Languages size={18} className="inline mr-2 text-cyan-400" />
          Translation — no language barriers
        </h3>
        <p>
          Transcribe and translate archival text in 20+ languages. Pull from your scrape or OCR session, or paste
          directly. Results flow into the output panel below.
        </p>
      </div>
      <form className={styles.owrScrapeForm} onSubmit={(e) => void handleTranslate(e)}>
        <div className={styles.owrTranslateRow}>
          <label className={styles.owrField}>
            <span>Target language</span>
            <input value={targetLang} onChange={(e) => setTargetLang(e.target.value)} placeholder="English" />
          </label>
          <button type="button" className={styles.owrBtn} onClick={useSessionText}>
            Use session text
          </button>
        </div>
        <label className={styles.owrField}>
          <span>Archival text</span>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={8}
            placeholder="Paste document text from your scrape or OCR batch…"
          />
        </label>
        {error && <p className={styles.owrError}>{error}</p>}
        <button type="submit" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} disabled={busy}>
          {busy ? <Loader2 className="animate-spin inline w-4 h-4" /> : 'Translate'}
        </button>
      </form>
    </div>
  );
}
