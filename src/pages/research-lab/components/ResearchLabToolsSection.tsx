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
import styles from '../researchLab.module.css';

/** Hive credits per OCR page — matches OwrOcrBatch estimate */
const CREDITS_PER_PAGE = 0.06;

const EXAMPLES = [
  { label: 'Single journal', pages: 24, note: 'One scanned article' },
  { label: 'Book chapter', pages: 120, note: 'Typical archive chapter' },
  { label: 'Small collection', pages: 500, note: 'Municipal record set' },
  { label: 'Large archive run', pages: 2000, note: 'Institution backlog batch' },
] as const;

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
        credits: Number((ex.pages * CREDITS_PER_PAGE).toFixed(2)),
      })),
    [],
  );

  const selectedCredits = pages * CREDITS_PER_PAGE;

  return (
    <section className={styles.rlToolsSection} aria-label="Research Lab tools and pricing">
      <div className={styles.rlToolsInner}>
        <div className={styles.rlToolsIntro}>
          <div className={styles.rlToolsIntroBlock}>
            <Wrench className={styles.rlToolsIntroIcon} aria-hidden />
            <p>
              We offer a huge selection of tools at the lowest price possible to encourage
              researchers to research heavily and build the library with the community, and not
              focus on their spending.
            </p>
          </div>
          <div className={styles.rlToolsIntroBlock}>
            <Layers className={styles.rlToolsIntroIcon} aria-hidden />
            <p>
              The tools provided here are all fully customizable. You can build your own web apps
              and add or tweak the tools for your specific needs. This is only a scaffolding of
              what is possible for you to build on and research through.
            </p>
          </div>
        </div>

        <div className={styles.rlOcrExplorer}>
          <header className={styles.rlOcrExplorerHeader}>
            <h3>OCR from online archives</h3>
            <p>
              Drag the slider to estimate how many pages you might OCR from an online archive.
              Costs are shown in Hive credits — billed when you run the tools.
            </p>
          </header>

          <div className={styles.rlOcrSliderRow}>
            <label htmlFor="rl-ocr-pages">Pages to OCR</label>
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
              {pages.toLocaleString()} pages × {CREDITS_PER_PAGE} Hive credits per page
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
                  {ex.pages.toLocaleString()} pages · {formatCredits(ex.pages * CREDITS_PER_PAGE)}{' '}
                  Hive credits
                </em>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rlToolsCta}>
          <StartResearchingButton />
        </div>
      </div>
    </section>
  );
}
