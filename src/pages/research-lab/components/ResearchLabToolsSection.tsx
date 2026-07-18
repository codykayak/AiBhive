import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Wrench, Layers } from 'lucide-react';
import StartResearchingButton from './StartResearchingButton';
import ResearchLabPricingPlans from './ResearchLabPricingPlans';
import styles from '../researchLab.module.css';

/**
 * Example bundled estimate per archive page through scrape → OCR → translate.
 * Aligned with server rates (browser scrape + platform OCR + translate, ×1.3 markup):
 *   0.004 + 0.003 + 0.008 = 0.015 raw → ~0.02 Hive credits/page.
 * BYOK keys and your own IP/proxy lower AI and scrape portions further.
 */
const CREDITS_PER_PIPELINE_PAGE = 0.02;

const EXAMPLES = [
  {
    label: 'Archive index',
    pages: 40,
    note: 'Scrape listing + gather tablet thumbnails',
  },
  {
    label: 'Cuneiform batch',
    pages: 120,
    note: 'OCR cuneiform tables from one collection',
  },
  {
    label: 'Mixed run',
    pages: 450,
    note: 'Scrape, OCR, translate to English',
  },
  {
    label: 'Deep harvest',
    pages: 1500,
    note: 'Full site crawl + communal library publish',
  },
] as const;

const WORKFLOW_STEPS =
  'Your favorite archive site → Scrape and gather archives → OCR Cuneiform tables → Translate to English → Your data forever → Interrogate returned data with AI → Share your data with the community if you opt in.';

function formatCredits(value: number) {
  return value < 10 ? value.toFixed(2) : value.toFixed(0);
}

export default function ResearchLabToolsSection() {
  const [pages, setPages] = useState(250);

  const chartData = useMemo(
    () =>
      EXAMPLES.map((ex) => ({
        name: ex.label,
        pages: ex.pages,
        credits: Number((ex.pages * CREDITS_PER_PIPELINE_PAGE).toFixed(2)),
      })),
    [],
  );

  const selectedCredits = pages * CREDITS_PER_PIPELINE_PAGE;

  return (
    <section id="pricing" className={styles.rlToolsSection} aria-label="Research Lab pricing">
      <div className={styles.rlToolsInner}>
        <header className={styles.rlPricingTitle}>
          <h2>Pricing</h2>
          <p>
            Fable Scrape chains Director (Grok by default), Vision OCR, and translation — then indexes
            findings for search and Grok analysis. Bring your own API keys per provider in-session, or use
            Hive credits for our managed stack.
          </p>
        </header>

        <div className={styles.rlToolsIntro}>
          <div className={styles.rlToolsIntroBlock}>
            <Wrench className={styles.rlToolsIntroIcon} aria-hidden />
            <p>
              We offer a huge selection of tools at the lowest price possible to encourage researchers to
              research heavily and build the library with the community, and not focus on their spending.
            </p>
          </div>
          <div className={styles.rlToolsIntroBlock}>
            <Layers className={styles.rlToolsIntroIcon} aria-hidden />
            <p>
              The tools provided here are all fully customizable. Tweaks you save in the workspace (AI roster,
              routing defaults) stay on your account and never change the public AiBhive site. For bigger builds,
              use Bhive Builder to publish your own app at your personal URL — same model as Hive apps.
            </p>
          </div>
        </div>

        <div className={styles.rlOcrExplorer}>
          <header className={styles.rlOcrExplorerHeader}>
            <h3>Use case example</h3>
            <p>
              Estimates for scraping an archived site, OCRing cuneiform tablet images, and translating into
              English. Drag the slider to model your run — shown in Hive credits (1 credit ≈ $1 of metered
              usage). Typical BYOK + browser-routing runs land near {CREDITS_PER_PIPELINE_PAGE} credits per page.
            </p>
          </header>

          <div className={styles.rlOcrSliderRow}>
            <label htmlFor="rl-ocr-pages">Archive pages in pipeline</label>
            <input
              id="rl-ocr-pages"
              type="range"
              min={10}
              max={3000}
              step={10}
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
              className={styles.rlOcrSlider}
            />
            <output className={styles.rlOcrSliderValue}>{pages.toLocaleString()} pages</output>
          </div>

          <div className={styles.rlOcrResult}>
            <span className={styles.rlOcrResultLabel}>Estimated cost</span>
            <strong className={styles.rlOcrResultCredits}>
              {formatCredits(selectedCredits)} Hive credits
            </strong>
            <span className={styles.rlOcrResultHint}>
              {pages.toLocaleString()} pages × {CREDITS_PER_PIPELINE_PAGE} Hive credits per page (example
              bundle)
            </span>
          </div>

          <div className={styles.rlOcrChartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                  label={{
                    value: 'Hive credits',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0c1220',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: 10,
                    color: '#e8eef7',
                  }}
                  formatter={(value: number, _name, item) => {
                    const pagesVal = item?.payload?.pages as number | undefined;
                    return [
                      `${formatCredits(value)} Hive credits`,
                      pagesVal ? `${pagesVal.toLocaleString()} pages` : 'Estimate',
                    ];
                  }}
                />
                <Bar dataKey="credits" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.rlOcrExamples}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className={styles.rlOcrExampleCard}
                onClick={() => setPages(ex.pages)}
              >
                <strong>{ex.label}</strong>
                <span>{ex.note}</span>
                <em>
                  {ex.pages.toLocaleString()} pages · {formatCredits(ex.pages * CREDITS_PER_PIPELINE_PAGE)}{' '}
                  Hive credits
                </em>
              </button>
            ))}
          </div>

          <p className={styles.rlWorkflowSteps}>{WORKFLOW_STEPS}</p>
        </div>

        <ResearchLabPricingPlans />

        <div className={styles.rlToolsCta}>
          <StartResearchingButton />
        </div>
      </div>
    </section>
  );
}
