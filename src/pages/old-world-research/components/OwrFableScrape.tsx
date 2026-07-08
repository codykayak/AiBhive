import { useState } from 'react';
import { Loader2, Shield, Search } from 'lucide-react';
import { runFableScrape, type FableScrapeFileTypes } from '../../../lib/fableScrapeApi';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../oldWorldResearch.module.css';

const DEFAULT_FILE_TYPES: FableScrapeFileTypes = {
  images: true,
  text: true,
  pdfs: true,
};

export default function OwrFableScrape() {
  const { appendOutput, setScrapeText, setImageUrls, setActiveStep } = useOwrWorkflow();
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState('');
  const [superStealth, setSuperStealth] = useState(false);
  const [massResearch, setMassResearch] = useState(false);
  const [fileTypes, setFileTypes] = useState<FableScrapeFileTypes>(DEFAULT_FILE_TYPES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    const kw = keywords
      .split(/[,;\n]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (!url.trim() && !query.trim()) {
      setError('Enter an archive URL and/or search query.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await runFableScrape({
        url: url.trim() || undefined,
        query: query.trim() || undefined,
        superStealth,
        massResearch,
        keywords: kw,
        fileTypes,
      });
      setScrapeText(res.text);
      setImageUrls(res.assets.images);
      appendOutput({
        step: 'scrape',
        title: res.summary,
        text: res.text,
      });
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fable Scrape failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.owrStepBody}>
      <div className={styles.owrStepIntro}>
        <h3>
          <Shield size={18} className="inline mr-2 text-cyan-400" />
          Fable Scrape — stealth archive harvester
        </h3>
        <p>
          Primary scraper for Old World archives. Hunts <strong>images</strong>, <strong>PDFs</strong>, and{' '}
          <strong>text/HTML documents</strong> from library sites, Wayback-style collections, and public
          record portals. Chain results into OCR and the RAG library below — you never leave this section.
        </p>
      </div>

      <form className={styles.owrScrapeForm} onSubmit={(e) => void handleScrape(e)}>
        <label className={styles.owrField}>
          <span>Archive URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://archive.org/details/… or library catalog URL"
          />
        </label>
        <label className={styles.owrField}>
          <span>Search query (optional)</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="star fort sanborn maps 1890s"
          />
        </label>
        <label className={styles.owrField}>
          <span>Focus keywords (comma-separated)</span>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="tartaria, mud flood, world fair, orphan train"
          />
        </label>

        <fieldset className={styles.owrCheckGroup}>
          <legend>Stealth modes</legend>
          <label className={styles.owrCheck}>
            <input type="checkbox" checked={superStealth} onChange={(e) => setSuperStealth(e.target.checked)} />
            Super stealth mode — slower requests, browser-like headers, longer waits
          </label>
          <label className={styles.owrCheck}>
            <input type="checkbox" checked={massResearch} onChange={(e) => setMassResearch(e.target.checked)} />
            Super stealth mass research — search + scrape many linked archive pages
          </label>
        </fieldset>

        <fieldset className={styles.owrCheckGroup}>
          <legend>File types to harvest</legend>
          <label className={styles.owrCheck}>
            <input
              type="checkbox"
              checked={fileTypes.images}
              onChange={(e) => setFileTypes((f) => ({ ...f, images: e.target.checked }))}
            />
            Images (.jpg, .png, scans, plates)
          </label>
          <label className={styles.owrCheck}>
            <input
              type="checkbox"
              checked={fileTypes.pdfs}
              onChange={(e) => setFileTypes((f) => ({ ...f, pdfs: e.target.checked }))}
            />
            PDFs &amp; document bundles
          </label>
          <label className={styles.owrCheck}>
            <input
              type="checkbox"
              checked={fileTypes.text}
              onChange={(e) => setFileTypes((f) => ({ ...f, text: e.target.checked }))}
            />
            Text &amp; HTML pages (.txt, .html, transcripts)
          </label>
        </fieldset>

        {error && <p className={styles.owrError}>{error}</p>}

        <button type="submit" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="animate-spin inline w-4 h-4 mr-2" />
              Fable Scrape running…
            </>
          ) : (
            <>
              <Search className="inline w-4 h-4 mr-2" />
              Run Fable Scrape
            </>
          )}
        </button>
      </form>
    </div>
  );
}
