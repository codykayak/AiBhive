import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { sendIntelChat } from '../../../lib/intelWebApi';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../oldWorldResearch.module.css';

export default function OwrInlineWebResearch() {
  const { scrapeText, ocrText, appendOutput } = useOwrWorkflow();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setBusy(true);
    setError('');
    try {
      const ctx = [scrapeText, ocrText].filter(Boolean).join('\n\n').slice(0, 10000);
      const res = await sendIntelChat({
        message: q,
        documentContext: ctx || undefined,
        targetContext: 'Community research library — archives, anomalies, historical documents, smart Q&A',
        llmProvider: 'gemini',
      });
      appendOutput({
        step: 'search',
        title: 'Web research brief',
        text: res.text,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.owrStepBody}>
      <div className={styles.owrStepIntro}>
        <h3>
          <MessageSquare size={18} className="inline mr-2 text-cyan-400" />
          Web research — stays in this section
        </h3>
        <p>
          Ask follow-up questions using your scrape and OCR context. Hive credits cover cloud search and AI
          synthesis — no need to open another page.
        </p>
      </div>
      <form className={styles.owrScrapeForm} onSubmit={(e) => void handleAsk(e)}>
        <label className={styles.owrField}>
          <span>Research question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="What anomalies appear in these world fair photographs? Suggest archive sources…"
          />
        </label>
        {error && <p className={styles.owrError}>{error}</p>}
        <button type="submit" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} disabled={busy}>
          {busy ? 'Researching…' : 'Run research brief'}
        </button>
      </form>
    </div>
  );
}
