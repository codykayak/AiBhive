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
      let findsBrief = '';
      try {
        const fr = await fetch('/api/research-lab/tartarian-finds?brief=1&maxChars=3500');
        const fd = await fr.json();
        if (fr.ok && fd.markdown) findsBrief = String(fd.markdown).slice(0, 3500);
      } catch {
        /* optional enrichment */
      }
      const res = await sendIntelChatAsUser(user, {
        message: q,
        documentContext: ctx || undefined,
        targetContext: [
          'Research Lab — archives, historical documents, communal library. Grok analyzes findings.',
          'When the question is Tartarian / Old World / mud-flood / star-fort / orphan-train related, prefer the documented finds directory leads (start URLs) over inventing sources.',
          findsBrief,
        ]
          .filter(Boolean)
          .join('\n\n')
          .slice(0, 14000),
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
