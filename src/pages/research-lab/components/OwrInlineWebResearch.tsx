import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { sendIntelChatAsUser } from '../../../lib/intelWebApi';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import { useResearchLabUser } from '../context/ResearchLabUserContext';
import styles from '../researchLab.module.css';

export default function OwrInlineWebResearch() {
  const { scrapeText, ocrText, appendOutput } = useOwrWorkflow();
  const user = useResearchLabUser();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !user) return;
    setBusy(true);
    setError('');
    try {
      const ctx = [scrapeText, ocrText].filter(Boolean).join('\n\n').slice(0, 10000);
      const res = await sendIntelChatAsUser(user, {
        message: q,
        documentContext: ctx || undefined,
        targetContext:
          'Research Lab — archives, cuneiform, historical documents, communal library. Grok analyzes findings.',
        llmProvider: 'grok',
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
          Ask follow-up questions using your scrape and OCR context. Grok (default) synthesizes answers;
          Hive credits cover cloud search and AI — or bring your own keys in Fable Scrape.
        </p>
      </div>
      <form className={styles.owrScrapeForm} onSubmit={(e) => void handleAsk(e)}>
        <label className={styles.owrField}>
          <span>Research question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="What do these cuneiform transcriptions suggest about trade routes? Suggest related archives…"
          />
        </label>
        {error && <p className={styles.owrError}>{error}</p>}
        <button type="submit" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} disabled={busy || !user}>
          {busy ? 'Researching…' : 'Run research brief'}
        </button>
      </form>
    </div>
  );
}
