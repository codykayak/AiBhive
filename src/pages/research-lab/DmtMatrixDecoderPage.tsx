import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import {
  Camera,
  ChevronRight,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
  Zap,
  BookOpen,
  BarChart3,
  Users,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { auth, googleProvider } from '../../firebase';
import {
  buildDmtDecodeResultContext,
  buildDmtResearchReportContext,
} from '../../lib/dmtMatrixInsight';
import DmtMatrixInsightChat from './components/DmtMatrixInsightChat';
import styles from './dmtMatrixDecoder.module.css';
import catalogData from '../../data/dmtSymbolCatalog.json';

interface CatalogSymbol {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  filename: string;
}

interface Detection {
  symbolId: string;
  tokenId?: string | null;
  name: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  method?: string;
  source?: string;
  description?: string;
  catalogDescription?: string;
  normalized?: { x: number; y: number; width: number; height: number };
}

interface DecodeResult {
  sessionId: string;
  merged: Detection[];
  cvDetections: Detection[];
  structuralMatches?: Detection[];
  syntax?: {
    tokenSequence?: string[];
    shannonEntropy?: number;
    bigramMatrix?: Record<string, Record<string, number>>;
    spatialGraph?: { layoutType?: string; nodeCount?: number; edgeCount?: number };
  };
  vision?: {
    summary?: string;
    matrixStructure?: string;
    decodeNotes?: string;
    researchFlags?: string[];
    symbols?: Detection[];
  };
  visionError?: string;
  workerError?: string;
  chargedUsd?: number;
  library?: { id: string; sharePath?: string; title?: string };
}

interface CorpusPreview {
  symbolCount: number;
  registryCount: number;
  tokenCount: number;
  clusterCount: number;
  shannonEntropyCatalog: number;
  tagFrequency: { tag: string; count: number }[];
  topGlyphs: { id: string; name: string; filename: string; tokenId?: string; tags: string[] }[];
}

interface ResearchReport {
  reportId: string;
  generatedAt: string;
  budget: {
    budgetUsd: number;
    apiBudgetUsd: number;
    apiSpentUsd: number;
    glyphsCompared: number;
    useRawBudget?: boolean;
  };
  stats: {
    symbolCount: number;
    registryCount: number;
    shannonEntropy: number;
    tagFrequency: { tag: string; count: number }[];
    topBigrams: { pair: string; count: number; probability: number }[];
    frequencyRanking: {
      rank: number;
      id: string;
      name: string;
      tokenId?: string;
      filename: string;
      tags: string[];
    }[];
  };
  comparisons: {
    glyphId: string;
    glyphName: string;
    filename: string;
    matches: {
      script: string;
      characterOrForm: string;
      similarityScore: number;
      reasoning: string;
    }[];
    linguisticLikelihood: number;
    notes?: string;
  }[];
  promisingMatches: {
    glyphId: string;
    glyphName: string;
    filename: string;
    script: string;
    characterOrForm: string;
    similarityScore: number;
    reasoning: string;
  }[];
  assessment: {
    classification: string;
    confidence: number;
    rationale: string[];
    promisingScriptMatches: number;
    avgLinguisticLikelihood: number;
  };
  synthesis?: {
    headline?: string;
    summary?: string;
    namingHypotheses?: { name: string; glyphIds: string[]; rationale: string }[];
    nextExperiments?: string[];
    confidenceInStructuredLanguage?: number;
  };
  chargedUsd?: number;
  useRawBudget?: boolean;
  library?: { id: string; sharePath?: string; title?: string };
}

const FALLBACK_DECODE_COST = 0.02;
const DEFAULT_RESEARCH_BUDGET = 1;

const CLASS_LABELS: Record<string, string> = {
  structured_symbolic_system: 'Structured symbolic system',
  hybrid_geometric_linguistic: 'Hybrid geometric / linguistic',
  geometric_primitives: 'Geometric primitives',
  repeating_geometric_motifs: 'Repeating geometric motifs',
};

async function compressImage(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1600;
        let { width, height } = img;
        if (width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
          previewUrl: dataUrl,
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export default function DmtMatrixDecoderPage() {
  const [user, setUser] = useState(auth.currentUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [previewUrl, setPreviewUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [notes, setNotes] = useState('');
  const [visionProvider, setVisionProvider] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [researchBusy, setResearchBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [corpusPreview, setCorpusPreview] = useState<CorpusPreview | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(FALLBACK_DECODE_COST);
  const [researchBudget, setResearchBudget] = useState(DEFAULT_RESEARCH_BUDGET);
  const [useRawBudget, setUseRawBudget] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const catalog = (catalogData as { symbols: CatalogSymbol[] }).symbols || [];
  const catalogById = useMemo(
    () => Object.fromEntries(catalog.map((s) => [s.id, s])),
    [catalog],
  );

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    void fetch('/api/research-lab/dmt-matrix/corpus-preview')
      .then((r) => r.json())
      .then((data) => setCorpusPreview(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setEstimatedCost(FALLBACK_DECODE_COST);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const [decodeEst, researchEst] = await Promise.all([
          fetch('/api/research-lab/estimate', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ op: 'dmt-decode' }),
          }).then((r) => r.json()),
          fetch('/api/research-lab/estimate', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              op: 'dmt-research',
              params: { budgetUsd: researchBudget, useRawBudget },
            }),
          }).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setEstimatedCost(Number(decodeEst.estimatedCredits) || FALLBACK_DECODE_COST);
          if (researchEst.budgetUsd) setResearchBudget(Number(researchEst.budgetUsd));
          setIsAdmin(!!researchEst.isAdmin);
        }
      } catch {
        /* fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, researchBudget, useRawBudget]);

  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !result?.merged?.length) return;
    const rect = img.getBoundingClientRect();
    const natW = img.naturalWidth || 1;
    const natH = img.naturalHeight || 1;
    const scaleX = rect.width / natW;
    const scaleY = rect.height / natH;

    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const det of result.merged) {
      const nx = det.normalized?.x ?? det.x / natW;
      const ny = det.normalized?.y ?? det.y / natH;
      const nw = det.normalized?.width ?? det.width / natW;
      const nh = det.normalized?.height ?? det.height / natH;
      const x = (det.normalized ? nx * natW : det.x) * scaleX;
      const y = (det.normalized ? ny * natH : det.y) * scaleY;
      const w = (det.normalized ? nw * natW : det.width) * scaleX;
      const h = (det.normalized ? nh * natH : det.height) * scaleY;

      ctx.strokeStyle = det.source === 'vision' ? '#e879f9' : '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, Math.max(w, 12), Math.max(h, 12));
      ctx.fillStyle = det.source === 'vision' ? 'rgba(232,121,249,0.15)' : 'rgba(34,211,238,0.12)';
      ctx.fillRect(x, y, Math.max(w, 12), Math.max(h, 12));
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText(det.name.slice(0, 14), x + 2, y + 12);
    }
  }, [result]);

  useEffect(() => {
    drawOverlays();
    window.addEventListener('resize', drawOverlays);
    return () => window.removeEventListener('resize', drawOverlays);
  }, [drawOverlays, previewUrl]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    setError('');
    setResult(null);
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed.previewUrl);
      setImageBase64(compressed.base64);
      setMimeType(compressed.mimeType);
    } catch {
      setError('Could not read that image.');
    }
  }

  async function signIn() {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }

  async function runResearch() {
    if (!user) {
      setError('Sign in to run corpus decoding research.');
      return;
    }
    setResearchBusy(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/research-lab/dmt-matrix/research', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetUsd: researchBudget,
          useRawBudget: useRawBudget && isAdmin,
          visionProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research run failed.');
      setResearchReport(data as ResearchReport);
      if (data.isAdmin) setIsAdmin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research run failed.');
    } finally {
      setResearchBusy(false);
    }
  }

  async function runDecode() {
    if (!imageBase64) {
      setError('Upload or capture a laser matrix photo first.');
      return;
    }
    if (!user) {
      setError('Sign in to decode and save results.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/research-lab/dmt-matrix/decode', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          visionProvider,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Decode failed.');
      setResult(data as DecodeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decode failed.');
    } finally {
      setBusy(false);
    }
  }

  function toggleRawBudget() {
    if (!isAdmin) return;
    setUseRawBudget((v) => !v);
  }

  const priceLabel = `$${researchBudget.toFixed(2)}`;
  const rawHint = useRawBudget && isAdmin ? ' · raw token budget' : '';

  return (
    <div className={styles.dmt}>
      <SEO
        title="DMT Matrix Decoder — 650nm Laser Glyph AI | AiBhive Research Lab"
        description="Decode the DMT laser diffraction code: corpus statistics, script comparison against katakana, Hebrew, Aramaic, and AI matrix photo decoding."
        keywords="DMT matrix decoder, laser code, 650nm, glyph classifier, DMT Code, visual symbols, AiBhive Research Lab"
        image="/rl-hero-historical-ancient.png"
      />

      <section className={styles.heroVideo} aria-label="DMT Matrix Decoder hero">
        <video
          className={styles.heroVideoEl}
          autoPlay
          muted
          loop
          playsInline
          poster="/dmt-symbols/registry_ceed6b59-9bd8-46e2-be16-ef6ecc5363ea.png"
        >
          <source src="/dmt-symbols/dmt-matrix-hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Research Lab · DMT Code Project</p>
          <h1 className={styles.title}>DMT Matrix Decoder</h1>
          <p className={styles.lead}>
            Statistical corpus analysis + script comparison + AI photo decoding for the 650nm laser
            diffraction glyph matrix.
          </p>
          <div className={styles.heroStats}>
            <span>{corpusPreview?.symbolCount ?? catalog.length} glyphs</span>
            <span>{corpusPreview?.registryCount ?? 0} registry</span>
            <span>{corpusPreview?.clusterCount ?? 0} clusters</span>
          </div>
          <Link to="/research-lab/dmt-matrix-library" className={styles.moreLink} style={{ marginTop: '0.75rem' }}>
            <Users size={14} aria-hidden />
            Browse community library <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      <div className={styles.shell}>
        <section className={styles.researchCard} aria-label="Corpus decoding research">
          <div className={styles.researchHeader}>
            <BookOpen size={20} className={styles.researchIcon} aria-hidden />
            <div>
              <h2 className={styles.researchTitle}>Decode the corpus</h2>
              <p className={styles.researchSub}>
                Frequency ranking, Shannon entropy, bigram transitions, and Gemini/Grok script
                comparison (katakana, kanji, Hebrew, Aramaic, runes).
              </p>
            </div>
          </div>

          {corpusPreview && (
            <div className={styles.previewGrid}>
              <div className={styles.statPill}>
                <BarChart3 size={14} aria-hidden />
                Entropy {corpusPreview.shannonEntropyCatalog.toFixed(2)} bits
              </div>
              {corpusPreview.tagFrequency.slice(0, 4).map((t) => (
                <div key={t.tag} className={styles.statPill}>
                  {t.tag} ×{t.count}
                </div>
              ))}
            </div>
          )}

          {!user && (
            <p className={styles.signInBanner}>
              <button type="button" className={styles.linkBtn} onClick={() => void signIn()}>
                Sign in with Google
              </button>{' '}
              to run decoding research ({priceLabel} Hive credits).
            </p>
          )}

          <div className={styles.decodeCtaRow}>
            <button
              type="button"
              className={styles.btnDecode}
              disabled={researchBusy || !user}
              onClick={() => void runResearch()}
            >
              {researchBusy ? (
                <>
                  <Loader2 size={18} className={styles.spin} aria-hidden />
                  Decoding corpus…
                </>
              ) : (
                <>
                  <Sparkles size={18} aria-hidden />
                  Start Decoding
                </>
              )}
            </button>
            <button
              type="button"
              className={`${styles.priceBadge} ${isAdmin ? styles.priceBadgeAdmin : ''} ${useRawBudget ? styles.priceBadgeRaw : ''}`}
              onClick={toggleRawBudget}
              title={
                isAdmin
                  ? 'Admin: tap to toggle raw token budget (no markup)'
                  : 'Hive credits for this research run'
              }
              disabled={!user}
            >
              {priceLabel}
              <span className={styles.priceSub}>credits{rawHint}</span>
            </button>
          </div>
          <p className={styles.budgetHint}>
            Fixed budget — spends up to {priceLabel} in API tokens
            {useRawBudget && isAdmin ? ' (admin raw mode)' : ' (includes platform markup)'}.
            No open-ended spinning.
          </p>
        </section>

        {researchReport && (
          <section className={styles.section} aria-label="Research report">
            {researchReport.library?.id && (
              <div className={styles.publishedBanner}>
                <Sparkles size={16} aria-hidden />
                Published to the communal library —{' '}
                <Link to={`/research-lab/dmt-matrix-library/${researchReport.library.id}`}>
                  view & contribute
                </Link>
              </div>
            )}
            <DmtMatrixInsightChat
              focusTitle={researchReport.synthesis?.headline || 'Corpus research report'}
              contextText={buildDmtResearchReportContext(researchReport)}
              sessionKey={`dmt_insight_report_${researchReport.reportId}`}
              user={user}
              onSignIn={() => void signIn()}
              mode="entry"
            />
            <h2 className={styles.sectionTitle}>Research report</h2>
            <div className={styles.summaryCard}>
              <p className={styles.reportHeadline}>
                {researchReport.synthesis?.headline ||
                  CLASS_LABELS[researchReport.assessment.classification] ||
                  researchReport.assessment.classification}
              </p>
              <p>{researchReport.synthesis?.summary}</p>
              <p className={styles.reportMeta}>
                Classification:{' '}
                <strong>
                  {CLASS_LABELS[researchReport.assessment.classification] ||
                    researchReport.assessment.classification}
                </strong>{' '}
                ({Math.round(researchReport.assessment.confidence * 100)}% confidence) · spent{' '}
                {researchReport.budget.apiSpentUsd.toFixed(2)} /{' '}
                {researchReport.budget.apiBudgetUsd.toFixed(2)} API budget ·{' '}
                {researchReport.budget.glyphsCompared} glyphs compared
              </p>
            </div>

            {!!researchReport.promisingMatches.length && (
              <>
                <h3 className={styles.subTitle}>Promising script matches</h3>
                <ul className={styles.matchList}>
                  {researchReport.promisingMatches.map((m) => (
                    <li key={`${m.glyphId}-${m.script}`} className={styles.matchItem}>
                      <img
                        src={`/dmt-symbols/${m.filename}`}
                        alt=""
                        className={styles.glyphThumb}
                      />
                      <div>
                        <div className={styles.detName}>
                          {m.glyphName} → {m.script}
                        </div>
                        <div className={styles.detMeta}>
                          {m.characterOrForm} · {Math.round(m.similarityScore * 100)}% similar
                        </div>
                        <div className={styles.matchReason}>{m.reasoning}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3 className={styles.subTitle}>Top frequent glyphs</h3>
            <ul className={styles.detectionList}>
              {researchReport.stats.frequencyRanking.slice(0, 8).map((g) => (
                <li key={g.id} className={styles.detectionItem}>
                  <img src={`/dmt-symbols/${g.filename}`} alt="" className={styles.glyphThumb} />
                  <div>
                    <div className={styles.detName}>
                      #{g.rank} {g.name}
                    </div>
                    <div className={styles.detMeta}>
                      {g.tokenId || g.id} · {g.tags.join(', ')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {!!researchReport.stats.topBigrams.length && (
              <>
                <h3 className={styles.subTitle}>Highest-probability transitions</h3>
                <div className={styles.summaryCard}>
                  {researchReport.stats.topBigrams
                    .slice(0, 6)
                    .map((b) => `${b.pair} (${(b.probability * 100).toFixed(1)}%)`)
                    .join(' · ')}
                </div>
              </>
            )}

            {researchReport.synthesis?.namingHypotheses?.length ? (
              <>
                <h3 className={styles.subTitle}>Naming hypotheses</h3>
                <ul className={styles.detectionList}>
                  {researchReport.synthesis.namingHypotheses.map((h) => (
                    <li key={h.name} className={styles.summaryCard}>
                      <strong>{h.name}</strong> — {h.rationale}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        )}

        <div className={styles.pioneer}>
          <Sparkles className={styles.pioneerIcon} size={18} aria-hidden />
          <span>
            Photo decode: upload a laser matrix image for positioned glyph matching. Sessions saved
            to Firebase for sequence analysis.
          </span>
        </div>

        <div className={styles.uploadCard}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={onFile}
          />

          {previewUrl ? (
            <div className={styles.previewWrap}>
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Uploaded laser matrix"
                className={styles.previewImg}
                onLoad={drawOverlays}
              />
              <canvas ref={canvasRef} className={styles.overlayCanvas} aria-hidden />
            </div>
          ) : (
            <button
              type="button"
              className={styles.dropzone}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className={styles.dropzoneIcon} aria-hidden />
              <span className={styles.dropzoneText}>Tap to capture or upload matrix photo</span>
              <span className={styles.dropzoneHint}>650nm laser diffraction · matrix photos</span>
            </button>
          )}

          <div className={styles.controls}>
            <textarea
              className={styles.textarea}
              placeholder="Session notes — surface, dose context, what you saw…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <select
              className={styles.select}
              value={visionProvider}
              onChange={(e) => setVisionProvider(e.target.value)}
              aria-label="Vision provider"
            >
              <option value="auto">Vision: Auto (Gemini → Grok)</option>
              <option value="gemini">Vision: Gemini</option>
              <option value="grok">Vision: Grok</option>
            </select>
            <div className={styles.row}>
              {previewUrl && (
                <button type="button" className={styles.btnGhost} onClick={() => inputRef.current?.click()}>
                  <Upload size={16} aria-hidden />
                  Replace
                </button>
              )}
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy || !imageBase64 || !user}
                onClick={() => void runDecode()}
              >
                {busy ? (
                  <>
                    <Loader2 size={18} className={styles.spin} aria-hidden />
                    Decoding…
                  </>
                ) : (
                  <>
                    <ScanLine size={18} aria-hidden />
                    Decode photo · ~{estimatedCost.toFixed(2)}
                  </>
                )}
              </button>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </div>
        </div>

        {result && (
          <>
            {result.library?.id && (
              <div className={styles.publishedBanner}>
                <Sparkles size={16} aria-hidden />
                Published to the communal library —{' '}
                <Link to={`/research-lab/dmt-matrix-library/${result.library.id}`}>
                  view & contribute
                </Link>
              </div>
            )}
            <DmtMatrixInsightChat
              focusTitle={result.vision?.summary?.slice(0, 80) || 'Photo decode results'}
              contextText={buildDmtDecodeResultContext(result)}
              sessionKey={`dmt_insight_decode_${result.sessionId}`}
              user={user}
              onSignIn={() => void signIn()}
              mode="entry"
            />
            <section className={styles.section} aria-label="Decode summary">
              <h2 className={styles.sectionTitle}>Photo analysis</h2>
              <div className={styles.summaryCard}>
                {result.vision?.summary || 'CV classifier completed.'}
                {result.syntax?.shannonEntropy != null && (
                  <p className={styles.reportMeta}>
                    Token entropy: <strong>{result.syntax.shannonEntropy.toFixed(3)} bits</strong>
                    {result.syntax.spatialGraph?.layoutType && (
                      <> · layout: <strong>{result.syntax.spatialGraph.layoutType}</strong></>
                    )}
                  </p>
                )}
              </div>
            </section>

            <section className={styles.section} aria-label="Detected symbols">
              <h2 className={styles.sectionTitle}>
                Detected symbols ({result.merged?.length || 0})
              </h2>
              <ul className={styles.detectionList}>
                {(result.merged || []).map((det, i) => {
                  const meta = catalogById[det.symbolId];
                  return (
                    <li key={`${det.symbolId}-${i}`} className={styles.detectionItem}>
                      {meta ? (
                        <img
                          src={`/dmt-symbols/${meta.filename}`}
                          alt=""
                          className={styles.glyphThumb}
                        />
                      ) : (
                        <div className={styles.glyphThumb} />
                      )}
                      <div>
                        <div className={styles.detName}>{det.name}</div>
                        <div className={styles.detMeta}>
                          {det.tokenId && <span>{det.tokenId} · </span>}
                          {det.symbolId}
                        </div>
                      </div>
                      <span className={styles.confBadge}>
                        {Math.round((det.confidence || 0) * 100)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        <section className={styles.section} aria-label="Glyph catalogue">
          <h2 className={styles.sectionTitle}>Catalogue ({catalog.length} glyphs)</h2>
          <div className={styles.catalogGrid}>
            {catalog.slice(0, 24).map((sym) => (
              <div key={sym.id}>
                <div className={styles.catalogItem}>
                  <img src={`/dmt-symbols/${sym.filename}`} alt={sym.name} loading="lazy" />
                </div>
                <div className={styles.catalogLabel}>{sym.name}</div>
              </div>
            ))}
          </div>
          {catalog.length > 24 && (
            <Link to="/research-lab/workspace" className={styles.moreLink}>
              View all in workspace <ChevronRight size={14} />
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
