import { SEO } from '../../components/SEO';
import { AssistantTopSpacer } from '../../components/HomeAssistantWeb';
import ResearchWebApp from '../../components/hive-apps/ResearchWebApp';

/** Full-viewport research workspace — dedicated page, readable layout. */
export default function ResearchPage() {
  return (
    <>
      <SEO
        title="Research — Intel Agent | AiBhive App"
        description="AI-directed OSINT on companies, websites, and people. AI filters raw tool output into inquiry-relevant findings."
        keywords="OSINT research, company intelligence, AI research agent, AI research, AiBhive intel"
      />
      <AssistantTopSpacer />
      <ResearchWebApp expanded />
    </>
  );
}
