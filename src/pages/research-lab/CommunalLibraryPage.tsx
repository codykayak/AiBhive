import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, Share2, Users, Sparkles, ArrowRight } from 'lucide-react';
import { SEO } from '../../components/SEO';
import StartResearchingButton from './components/StartResearchingButton';
import { COMMUNAL_TOPICS, getCommunalTopic } from './communalLibraryTopics';
import styles from './researchLab.module.css';

const CommunalKnowledgeMap = lazy(() => import('./components/CommunalKnowledgeMap'));

export default function CommunalLibraryPage() {
  const [selectedId, setSelectedId] = useState<string | null>('tartarian');
  const selected = selectedId ? getCommunalTopic(selectedId) : null;
  const totalDocs = useMemo(
    () => COMMUNAL_TOPICS.reduce((sum, t) => sum + t.docs, 0),
    [],
  );

  return (
    <div className={styles.rlLibPage}>
      <SEO
        title="Communal Library — Shared Research Knowledge Map | AiBhive"
        description="Explore AiBhive’s Communal Library: a living, multi-agent knowledge map where researchers publish OCR’d archives, translations, and findings so the whole community can build on shared sources."
        keywords="communal research library, shared knowledge map, Tartarian archives, cuneiform OCR, community sourced research, AiBhive library"
        type="WebSite"
        jsonLd={[
          {
            '@type': 'CollectionPage',
            name: 'AiBhive Communal Library',
            description:
              'Community-sourced research library with interconnected topic corpora for historical, medical, legal, and scholarly work.',
            url: 'https://aibhive.com/research-lab/communal-library',
          },
        ]}
      />

      <header className={styles.rlLibHero}>
        <p className={styles.rlLibEyebrow}>Research Lab · Communal Library</p>
        <h1 className={styles.rlLibTitle}>
          One library. <span>Infinite trails.</span>
        </h1>
        <p className={styles.rlLibLead}>
          A living knowledge lattice — rotate the map, open a topic, and follow document trails other
          researchers already paved. Every contribution compounds the shared wealth of the hive.
        </p>
        <div className={styles.rlLibHeroStats}>
          <div>
            <strong>{COMMUNAL_TOPICS.length}</strong>
            <span>topic nodes</span>
          </div>
          <div>
            <strong>{totalDocs.toLocaleString()}</strong>
            <span>seed documents</span>
          </div>
          <div>
            <strong>∞</strong>
            <span>community forks</span>
          </div>
        </div>
      </header>

      <section className={styles.rlLibMapSection} aria-label="3D knowledge map">
        <div className={styles.rlLibMapFrame}>
          <Suspense
            fallback={
              <div className={styles.rlLibMapFallback}>
                <Library className="w-8 h-8 text-bee-amber animate-pulse" />
                <p>Loading knowledge lattice…</p>
              </div>
            }
          >
            <CommunalKnowledgeMap selectedId={selectedId} onSelect={setSelectedId} />
          </Suspense>
        </div>

        <aside className={styles.rlLibDetail} aria-live="polite">
          {selected ? (
            <>
              <p className={styles.rlLibDetailKicker}>Selected node</p>
              <h2>{selected.label}</h2>
              <p className={styles.rlLibDocCount}>
                <button
                  type="button"
                  className={styles.rlLibDocBtn}
                  onClick={() => setSelectedId(selected.id)}
                >
                  {selected.docs.toLocaleString()} documents
                </button>
              </p>
              <p>{selected.blurb}</p>
              <div className={styles.rlLibRelated}>
                <p>Connected topics</p>
                <div className={styles.rlLibChips}>
                  {selected.links.map((id) => {
                    const t = getCommunalTopic(id);
                    if (!t) return null;
                    return (
                      <button key={id} type="button" onClick={() => setSelectedId(id)}>
                        {t.label}
                        <span>{t.docs.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <StartResearchingButton size="md" />
            </>
          ) : (
            <p className={styles.rlLibDetailEmpty}>Click a glowing node to open its corpus.</p>
          )}
        </aside>
      </section>

      <section className={styles.rlLibTopicsGrid} aria-label="All topics">
        <h2>Browse the lattice</h2>
        <p>Twenty-plus research domains already wired into one collective system — click any card.</p>
        <ul>
          {COMMUNAL_TOPICS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`${styles.rlLibTopicCard}${selectedId === t.id ? ` ${styles.rlLibTopicCardActive}` : ''}`}
                onClick={() => {
                  setSelectedId(t.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <strong>{t.label}</strong>
                <span>{t.docs.toLocaleString()} docs</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.rlLibExplain} aria-labelledby="rl-lib-what">
        <h2 id="rl-lib-what">What the Communal Library actually does</h2>
        <p>
          The Communal Library is AiBhive’s shared research memory. When you scrape an archive, OCR a
          plate, translate a script, or synthesize a finding in Research Lab, you can{' '}
          <strong>publish</strong> that work into this pool. Other investigators then search, remix,
          and extend it — so nobody starts from a blank page.
        </p>
        <div className={styles.rlLibExplainGrid}>
          <article>
            <Share2 className={styles.rlLibExplainIcon} aria-hidden />
            <h3>Contribute</h3>
            <p>
              Publish cleaned findings from Fable Scrape, OCR Lab, and translation. Keep sensitive
              material private; share what strengthens the commons.
            </p>
          </article>
          <article>
            <Users className={styles.rlLibExplainIcon} aria-hidden />
            <h3>Communicate</h3>
            <p>
              Topic nodes link related corpora so historians, clinicians, legal researchers, and
              scholars can follow trails across domains — and leave better trails for the next person.
            </p>
          </article>
          <article>
            <Sparkles className={styles.rlLibExplainIcon} aria-hidden />
            <h3>Compound</h3>
            <p>
              Every contribution grows the knowledge and wealth base of the hive. We deeply appreciate
              researchers who publish — your work becomes infrastructure for everyone.
            </p>
          </article>
        </div>
        <p className={styles.rlLibThanks}>
          Thank you for building with us. Shared knowledge is the point of AiBhive Research Lab —
          research deeply, then give the next investigator a head start.
        </p>
        <div className={styles.rlCatCtaRow}>
          <StartResearchingButton />
          <Link to="/research-lab" className={styles.rlBtnGhost}>
            Back to Research Lab
            <ArrowRight className="w-4 h-4 inline ml-1" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
