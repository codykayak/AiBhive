import { SEO } from '../../components/SEO';
import ResearchWebApp from '../../components/hive-apps/ResearchWebApp';

export default function ResearchPage() {
  return (
    <>
      <SEO
        title="Research — Intel Agent | AiBhive App"
        description="AI-directed OSINT on companies, websites, and people. Grok research chat, Hive Cloud search, same pricing as the mobile app."
        keywords="OSINT research, company intelligence, AI research agent, Grok research, AiBhive intel"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <ResearchWebApp expanded />
      </div>
    </>
  );
}
