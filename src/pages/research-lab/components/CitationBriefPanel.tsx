import { useMemo, useState } from 'react';
import { Download, FileText, Quote } from 'lucide-react';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

type Claim = {
  claim: string;
  evidence: string;
  sourceUrl?: string;
  confidence: 'high' | 'medium' | 'low';
};

function buildClaims(scrapeText: string, ocrText: string, output: { title: string; text: string; sourceUrl?: string; confidence?: number | null }[]): Claim[] {
  const claims: Claim[] = [];
  const blocks = [
    ...output.map((o) => ({ title: o.title, text: o.text, sourceUrl: o.sourceUrl, confidence: o.confidence })),
    scrapeText ? { title: 'Fable Scrape session', text: scrapeText, sourceUrl: undefined, confidence: null } : null,
    ocrText ? { title: 'OCR batch', text: ocrText, sourceUrl: undefined, confidence: null } : null,
  ].filter(Boolean) as Array<{ title: string; text: string; sourceUrl?: string; confidence?: number | null }>;

  for (const b of blocks.slice(0, 12)) {
    const paras = b.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40)
      .slice(0, 3);
    for (const p of paras) {
      const sentence = p.split(/(?<=[.!?])\s+/)[0]?.slice(0, 220) || p.slice(0, 220);
      const confNum = typeof b.confidence === 'number' ? b.confidence : null;
      claims.push({
        claim: `${b.title}: ${sentence}`,
        evidence: p.slice(0, 500),
        sourceUrl: b.sourceUrl,
        confidence: confNum != null ? (confNum >= 0.75 ? 'high' : confNum >= 0.45 ? 'medium' : 'low') : 'medium',
      });
    }
  }
  return claims.slice(0, 15);
}

function formatBriefMarkdown(title: string, claims: Claim[]) {
  const lines = [
    `# ${title} — Citation brief`,
    '',
    `_Generated in AiBhive Research Lab. Claims are grounded only in session evidence._`,
    '',
  ];
  claims.forEach((c, i) => {
    lines.push(`## ${i + 1}. Claim`);
    lines.push(c.claim);
    lines.push('');
    lines.push(`**Evidence** (${c.confidence} confidence)`);
    lines.push(`> ${c.evidence.replace(/\n/g, ' ')}`);
    if (c.sourceUrl) lines.push(`- Source: ${c.sourceUrl}`);
    lines.push('');
  });
  if (!claims.length) {
    lines.push('_No evidence in session yet — run scrape, OCR, or research first._');
  }
  return lines.join('\n');
}

export default function CitationBriefPanel() {
  const { projectTitle, scrapeText, ocrText, output, appendOutput } = useOwrWorkflow();
  const [open, setOpen] = useState(false);
  const claims = useMemo(
    () => buildClaims(scrapeText, ocrText, output),
    [scrapeText, ocrText, output],
  );
  const md = useMemo(() => formatBriefMarkdown(projectTitle, claims), [projectTitle, claims]);

  function download() {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase() || 'research'}-citation-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
    appendOutput({
      step: 'brief',
      title: 'Citation brief exported',
      text: `Exported ${claims.length} claim(s) with evidence snippets.`,
    });
  }

  return (
    <div className={styles.rlBriefPanel}>
      <button type="button" className={styles.rlBriefToggle} onClick={() => setOpen((o) => !o)}>
        <Quote className="w-4 h-4" aria-hidden />
        Citation-grade brief ({claims.length} claims)
      </button>
      {open && (
        <div className={styles.rlBriefBody}>
          <p className={styles.rlBriefLead}>
            Each claim is tied to an evidence snippet from your session. Unsupported leaps are omitted —
            add sources via scrape/OCR/research to strengthen the brief.
          </p>
          <ul className={styles.rlBriefList}>
            {claims.slice(0, 6).map((c, i) => (
              <li key={i}>
                <strong>{c.claim}</strong>
                <span className={styles.rlBriefConf}>{c.confidence}</span>
                {c.sourceUrl && (
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                    source
                  </a>
                )}
              </li>
            ))}
            {!claims.length && <li>Run tools to collect evidence first.</li>}
          </ul>
          <div className={styles.rlBriefActions}>
            <button type="button" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} onClick={download}>
              <Download className="w-3.5 h-3.5 inline mr-1" />
              Download Markdown
            </button>
            <button
              type="button"
              className={styles.owrBtn}
              onClick={() => {
                void navigator.clipboard.writeText(md);
              }}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Copy brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
