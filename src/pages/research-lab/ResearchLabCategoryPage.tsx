import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { SEO } from '../../components/SEO';
import StartResearchingButton from './components/StartResearchingButton';
import {
  getResearchLabCategory,
  type ResearchLabCategoryId,
} from './researchLabCategories';
import styles from './researchLab.module.css';

type Props = { categoryId: Exclude<ResearchLabCategoryId, 'research-tools'> };

export default function ResearchLabCategoryPage({ categoryId }: Props) {
  const cat = getResearchLabCategory(categoryId);
  const [chip, setChip] = useState(cat.craft.chips[0] || '');
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, 110]);

  useEffect(() => {
    setChip(cat.craft.chips[0] || '');
    window.scrollTo(0, 0);
  }, [categoryId, cat.craft.chips]);

  const craftOut = cat.craft.responses[chip] || Object.values(cat.craft.responses)[0] || '';

  return (
    <div className={styles.rlCatPage}>
      <SEO
        title={cat.seo.title}
        description={cat.seo.description}
        keywords={cat.seo.keywords}
        image={cat.heroImage}
        type="WebSite"
        faqs={cat.faqs.map((f) => ({ question: f.q, answer: f.a }))}
        jsonLd={[
          {
            '@type': 'Service',
            name: `AiBhive Research Lab — ${cat.navLabel}`,
            description: cat.seo.description,
            provider: { '@type': 'Organization', name: 'AiBhive', url: 'https://aibhive.com' },
            areaServed: 'Worldwide',
            url: `https://aibhive.com${cat.path}`,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aibhive.com/' },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Research Lab',
                item: 'https://aibhive.com/research-lab',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: cat.navLabel,
                item: `https://aibhive.com${cat.path}`,
              },
            ],
          },
        ]}
      />

      <header className={styles.rlCatHero} aria-label={`${cat.navLabel} hero`}>
        <div className={styles.rlCatHeroBg} aria-hidden>
          <motion.img
            style={{ y: heroY }}
            src={cat.heroImage}
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className={styles.rlCatHeroScrim} aria-hidden />
        <div className={styles.rlCatHeroInner}>
          <p className={styles.rlCatEyebrow}>{cat.eyebrow}</p>
          <h1 className={styles.rlCatTitle}>
            {cat.title} <span>{cat.titleAccent}</span>
          </h1>
          <p className={styles.rlCatLead}>{cat.lead}</p>
          <div className={styles.rlCatCtaRow}>
            <StartResearchingButton />
          </div>
        </div>
      </header>

      <section className={styles.rlCatSection} aria-labelledby="rl-cat-pillars">
        <h2 id="rl-cat-pillars">Why AiBhive leads this category</h2>
        <p>
          We combine specialized AI agents — discovery, vision OCR, translation, Grok synthesis, and
          community publish — into one start-to-finish Research Lab. That multi-agent design is how we
          deliver optimal Hive-credit pricing and research depth no single chatbot can match.
        </p>
        <div className={styles.rlCatGrid}>
          {cat.pillars.map((p) => (
            <article key={p.title} className={styles.rlCatTile}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.rlCatSection} aria-labelledby="rl-cat-help">
        <h2 id="rl-cat-help">How our service helps</h2>
        <p>
          Every workflow below is engineered for {cat.navLabel.toLowerCase()} work — and every
          published project can feed the communal library so other researchers build on your trail.
        </p>
        <div className={styles.rlCatGrid}>
          {cat.howItHelps.map((h) => (
            <article key={h.title} className={styles.rlCatTile}>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.rlCatSection} aria-labelledby="rl-cat-craft">
        <div className={styles.rlCatCraft}>
          <p className={styles.rlCatCraftLabel}>{cat.craft.label}</p>
          <h2 id="rl-cat-craft" className="sr-only">
            Interactive craft
          </h2>
          <div className={styles.rlCatChips} role="listbox" aria-label={cat.craft.label}>
            {cat.craft.chips.map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={c === chip}
                className={`${styles.rlCatChip}${c === chip ? ` ${styles.rlCatChipActive}` : ''}`}
                onClick={() => setChip(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <pre className={styles.rlCatCraftOut} aria-live="polite">
            {craftOut}
          </pre>
          <div className={styles.rlCatCtaRow} style={{ marginTop: '1.25rem' }}>
            <StartResearchingButton size="md" />
          </div>
        </div>
      </section>

      <section className={styles.rlCatSection} aria-labelledby="rl-cat-community">
        <div className={styles.rlCatCommunity}>
          <h2 id="rl-cat-community">Publish to the community library</h2>
          <p>{cat.communityBlurb}</p>
          <p>
            Making your research available helps build the shared data source pool — so the next
            investigator starts further ahead. That compounding library is core to AiBhive&apos;s
            complete product mission.
          </p>
          <div className={styles.rlCatCtaRow}>
            <StartResearchingButton />
          </div>
        </div>
      </section>

      <section className={`${styles.rlCatSection} ${styles.rlCatFaq}`} aria-labelledby="rl-cat-faq">
        <h2 id="rl-cat-faq">FAQ</h2>
        {cat.faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <section className={styles.rlCatSection} aria-label="Start researching">
        <h2>Ready to run {cat.navLabel} research?</h2>
        <p>Open Research Lab, load sources, and publish what you learn to the community library.</p>
        <StartResearchingButton />
      </section>
    </div>
  );
}
