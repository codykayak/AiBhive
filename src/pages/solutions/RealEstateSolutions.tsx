import CategorySeoPage from '../../components/CategorySeoPage';
import heroImg from '../../grow_content_creators_podcator_veiwership_translations.png';
import sectionImg from '../../Translation_voice_dubing_for_content_growth.png';

const RELATED = [
  { label: 'Phone Systems & SMS', href: '/solutions/phone-systems-ai-integration' },
  { label: 'Lead Generation', href: '/solutions/ai-lead-generation-automation' },
  { label: 'Document & ERP Sync', href: '/solutions/intelligent-document-processing-erp' },
  { label: 'Workflow Orchestration', href: '/solutions/enterprise-workflow-orchestration' },
];

export default function RealEstateSolutions() {
  return (
    <CategorySeoPage
      seo={{
        title: 'Real Estate AI Automation — Lead Gen, Follow-Up & Appointment Booking | AiBHive',
        description:
          'AiBHive builds agentic AI for real estate investors, agents, and brokerages: distress signal monitoring, auto SMS from missed calls, RAG-trained conversations, and calendar booking.',
        keywords:
          'real estate AI automation, wholesaling lead AI, real estate SMS automation, missed call text back real estate, AiBHive real estate',
      }}
      eyebrow="Solution Category · Real Estate"
      title="Real estate AI"
      highlight="that closes the speed-to-lead gap."
      subtitle="From off-market distress signals to missed-call text-back and booked appointments—AiBHive agents work your farm, your CRM, and your calendar 24/7."
      heroImage={heroImg}
      heroAlt="Real estate growth and audience expansion with AI automation"
      stats={[
        { value: '<90s', label: 'Missed-call response' },
        { value: '24/7', label: 'Follow-up coverage' },
        { value: 'RAG', label: 'Listing & script trained' },
        { value: 'CRM', label: 'Native sync' },
      ]}
      intro={
        <>
          <p>
            Real estate is still won on speed and specificity. The investor who texts a motivated
            seller within five minutes of a skip-trace hit beats the one who calls back tomorrow. The
            agent who answers a buyer&apos;s Zillow inquiry at 9 p.m. captures the showing; the one who
            waits until Monday loses to speed and silence.
          </p>
          <p>
            <strong className="text-white">AiBHive for Real Estate</strong> combines autonomous lead
            discovery, phone and SMS integration, and RAG-grounded conversations trained on your
            buy box, active listings, and compliance scripts. Agents monitor public records and intent
            feeds, qualify sellers and buyers, respond to missed calls with intelligent texts—not
            robotic blasts—and book appointments on your calendar or inside GoHighLevel, Follow Up
            Boss, or Salesforce.
          </p>
          <p>
            Whether you wholesale, flip, hold rentals, or run a traditional brokerage team, the outcome
            is the same: more conversations with the right people, fewer leads dying in voicemail, and
            a paper trail your compliance officer can actually audit.
          </p>
        </>
      }
      sections={[
        {
          heading: 'Distress signals, farming, and off-market pipeline automation',
          image: sectionImg,
          imageAlt: 'Real estate market expansion and lead growth',
          imagePosition: 'right',
          body: (
            <>
              <p>
                AiBHive agents ingest county recorder data, tax delinquency flags, probate filings,
                code violations, and vacancy proxies—then score each record against your buy box
                (zip, ARV range, equity threshold). Qualified records trigger outreach sequences that
                reference specifics: &quot;I noticed the notice of default filed on Oak Street&quot;
                beats &quot;Are you looking to sell?&quot; every time.
              </p>
              <p>
                For agent-led teams, farming workflows nurture homeowners in target subdivisions with
                market updates pulled from your MLS feed via RAG, so every touch feels local. Investors
                and agents share the same hive architecture; only the data sources and scripts change.
              </p>
              <p>
                Human-in-the-loop gates control bulk SMS launches and new market entry—your acquisition
                lead approves county expansions before the first message fires.
              </p>
            </>
          ),
        },
        {
          heading: 'Missed calls, SMS, and appointment booking on autopilot',
          body: (
            <>
              <p>
                Most real estate businesses already pay for a phone system. AiBHive integrates via
                webhooks from Twilio, RingCentral, OpenPhone, CallRail, and similar platforms: when a
                call goes unanswered, an agent texts within seconds using your trained knowledge base—
                active deals, FAQ, showing availability, and soft qualification questions.
              </p>
              <p>
                Two-way texting continues until the prospect books, opts out, or requests a human. The
                agent knows your hours, your markets, and your dispositions; it does not invent cash
                offers or legal advice outside approved templates.
              </p>
              <p>
                Calendar integrations (Google, Outlook, Calendly, CRM embedded schedulers) place
                qualified sellers and buyers on the right rep&apos;s calendar with notes attached—so
                your team shows up informed, not cold.
              </p>
            </>
          ),
        },
        {
          heading: 'RAG training on your listings, scripts, and market rules',
          body: (
            <>
              <p>
                Generic chatbots kill trust in real estate. AiBHive grounds every reply in documents you
                control: purchase criteria, active wholesale assignments, listing brochures, team bios,
                and state-specific disclosure language your counsel approved.
              </p>
              <p>
                When a seller asks &quot;Do you buy tenant-occupied properties in Multnomah County?&quot;
                the agent retrieves your criteria doc and answers accurately—or escalates if the edge
                case is not covered.
              </p>
              <p>
                Re-index when your buy box changes; agents pick up new rules without retraining from
                scratch on prompt engineering.
              </p>
            </>
          ),
        },
        {
          heading: 'CRM and transaction coordination',
          body: (
            <>
              <p>
                Leads sync bi-directionally with GoHighLevel, HubSpot, Salesforce, Follow Up Boss, and
                custom Airtable bases. Stage changes in your CRM can trigger agent workflows—e.g., move
                to &quot;Appointment set&quot; starts a reminder sequence; &quot;Under contract&quot;
                pauses nurture.
              </p>
              <p>
                Pair with our Document & ERP workflows to pull HUD statements, inspection summaries, or
                title commitments into structured fields—reducing coordinator hours on every file.
              </p>
            </>
          ),
        },
        {
          heading: 'Who we build for—and how pilots start',
          body: (
            <>
              <p>
                Solo wholesalers, small acquisition teams, ISA-heavy brokerages, and property management
                companies expanding owner outreach all use the same platform with different playbooks.
                Pilots typically start with one county or one inbound number: prove speed-to-lead and
                booking rate in thirty days, then expand markets and channels.
              </p>
              <p>
                Book a strategy call to map your phone stack, CRM, and buy box—we will scope a missed-call
                text-back workflow or distress farm automation as your first agentic win.
              </p>
            </>
          ),
        },
      ]}
      pipeline={[
        {
          step: '01',
          title: 'Signal or call',
          description: 'Distress data hit or inbound/missed call triggers an agent run.',
        },
        {
          step: '02',
          title: 'Qualify via RAG',
          description: 'Agent scores fit and personalizes outreach from your knowledge base.',
        },
        {
          step: '03',
          title: 'SMS / voice follow-up',
          description: 'Intelligent two-way texting; optional voice handoff to human ISA.',
        },
        {
          step: '04',
          title: 'Book & sync CRM',
          description: 'Appointment on calendar; full thread logged to CRM.',
        },
      ]}
      techStack={[
        {
          name: 'VoIP webhooks',
          description: 'Twilio, RingCentral, OpenPhone, CallRail, and custom SIP bridges.',
        },
        {
          name: 'MLS & public records',
          description: 'Feeds for farming, comps context, and distress monitoring.',
        },
        {
          name: 'RAG playbooks',
          description: 'Buy box, scripts, listings, and compliance language you approve.',
        },
        {
          name: 'CRM calendars',
          description: 'GHL, FUB, Salesforce, HubSpot appointment and stage sync.',
        },
      ]}
      comparison={[
        {
          feature: 'Missed call follow-up',
          legacy: 'Generic auto-text',
          aibhive: 'RAG-trained two-way agent',
        },
        {
          feature: 'Lead sourcing',
          legacy: 'Manual list buys',
          aibhive: 'Autonomous signal monitoring',
        },
        {
          feature: 'Personalization',
          legacy: 'Merge tags only',
          aibhive: 'Property- and seller-specific',
        },
        {
          feature: 'Booking',
          legacy: 'Human callback required',
          aibhive: 'In-thread calendar booking',
        },
      ]}
      checklist={[
        'Sub-90-second missed-call SMS with custom RAG training',
        'Distress and farming automations scoped to your counties',
        'TCPA-aware opt-out and quiet-hour enforcement',
        'GoHighLevel, Follow Up Boss, and Salesforce integrations',
        'Human takeover anytime with full conversation history',
      ]}
      faqs={[
        {
          q: 'Does AiBHive replace my CRM or dialer?',
          a: 'No—we integrate with them. You keep your stack; agents add intelligence and automation on top.',
        },
        {
          q: 'Can the AI text compliantly?',
          a: 'We configure opt-out language, quiet hours, and approval gates for bulk campaigns. Your counsel reviews scripts before launch.',
        },
        {
          q: 'What if the seller wants a human?',
          a: 'Agents detect handoff phrases and transfer threads to your ISA with context, or pause automation on request.',
        },
        {
          q: 'Do you work with GoHighLevel?',
          a: 'Yes—GHL is a common integration path for investors and agent teams.',
        },
      ]}
      relatedLinks={RELATED}
    />
  );
}
