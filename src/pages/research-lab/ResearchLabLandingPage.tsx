import { SEO } from '../../components/SEO';
import ResearchLabHero from './components/ResearchLabHero';
import ResearchLabWelcomeSection from './components/ResearchLabWelcomeSection';
import ResearchLabToolsSection from './components/ResearchLabToolsSection';
import ResearchLabCustomizeFab from './components/ResearchLabCustomizeFab';
import styles from './researchLab.module.css';

export default function ResearchLabLandingPage() {
  return (
    <div className={`${styles.rl} ${styles.rlToolsLanding}`}>
      <SEO
        title="Research Tools — Multi-Agent Archive Scrape, OCR & RAG | AiBhive Research Lab"
        description="AiBhive Research Lab tools combine Fable Scrape, batch OCR, translation, Grok analysis, and a community-sourced library — start-to-finish multi-agent research with Hive credits. Publish discoveries so other researchers can build on your work."
        keywords="AI research tools, Fable Scrape, batch OCR, RAG library, multi-agent research, Hive credits, community sourced library, AiBhive Research Lab"
        image="/rl-hero-research-tools.png"
        type="WebSite"
        jsonLd={[
          {
            '@type': 'Service',
            name: 'AiBhive Research Lab — Research Tools',
            description:
              'Multi-agent research OS: stealth archive scrape, OCR, translation, Grok synthesis, and community library publishing.',
            provider: { '@type': 'Organization', name: 'AiBhive', url: 'https://aibhive.com' },
            url: 'https://aibhive.com/research-lab',
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
            ],
          },
        ]}
      />
      <ResearchLabHero />
      <ResearchLabWelcomeSection />
      <ResearchLabToolsSection />
      <ResearchLabCustomizeFab />
    </div>
  );
}
