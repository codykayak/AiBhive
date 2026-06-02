import CategorySeoPage from '../../components/CategorySeoPage';
import heroImg from '../../ai_voice_translation_clone_lab.png';
import sectionImg from '../../transcription_service_legal_medical.png';

const RELATED = [
  { label: 'Lead Generation', href: '/solutions/ai-lead-generation-automation' },
  { label: 'Document & ERP Sync', href: '/solutions/intelligent-document-processing-erp' },
  { label: 'Workflow Orchestration', href: '/solutions/enterprise-workflow-orchestration' },
  { label: 'Medical & Legal AI', href: '/solutions/medical-legal-multi-agent-compliance' },
];

export default function CustomerOperationsAutomation() {
  return (
    <CategorySeoPage
      seo={{
        title: 'AI Customer Operations & Omnichannel Support Automation | AiBHive',
        description:
          'Go beyond FAQ bots. AiBHive customer operations agents access orders, shipping APIs, and CRM data to resolve tickets, issue refunds, and upsell across SMS and web chat.',
        keywords:
          'AI customer support automation, omnichannel AI agent, ecommerce support AI, autonomous customer operations, AiBHive',
      }}
      eyebrow="Solution Category · Customer Operations"
      title="Customer operations agents"
      highlight="that resolve—not deflect."
      subtitle="Multi-channel AI agents with secure access to your databases, order systems, and policies—turning support from a cost center into a revenue engine."
      heroImage={heroImg}
      heroAlt="AI voice and customer operations technology"
      stats={[
        { value: '70%', label: 'Ticket auto-resolution' },
        { value: '4.8★', label: 'CSAT on agent chats' },
        { value: '<30s', label: 'First response' },
        { value: 'HITL', label: 'On refunds & credits' },
      ]}
      intro={
        <>
          <p>
            Traditional chatbots fail the moment a customer asks anything outside a FAQ: &quot;Where is
            order #8842?&quot; &quot;Can I swap sizes after shipment?&quot; &quot;Apply my loyalty
            credit from last month.&quot; Scripted trees break, frustration spikes, and your team
            still pays for the ticket—twice.
          </p>
          <p>
            <strong className="text-white">AiBHive customer operations agents</strong> connect to the
            same systems your best human agents use: OMS, Shopify, Stripe, Zendesk, Intercom,
            ShipStation, and internal policy databases. They read live state, take authorized actions,
            and escalate only when risk or sentiment crosses thresholds you define.
          </p>
          <p>
            The result is faster resolution, higher CSAT, and measurable upsell from support
            touchpoints—without forcing customers through phone trees or copy-pasted macro hell.
          </p>
        </>
      }
      pipeline={[
        {
          step: '01',
          title: 'Intent classification',
          description: 'Agents parse channel-specific messages and map to operational playbooks.',
        },
        {
          step: '02',
          title: 'System lookup',
          description: 'Secure API calls retrieve orders, subscriptions, and shipment events.',
        },
        {
          step: '03',
          title: 'Policy execution',
          description: 'Refunds, replacements, and credits within pre-approved limits—or HITL pause.',
        },
        {
          step: '04',
          title: 'Revenue follow-up',
          description: 'Qualified upsell and save offers based on purchase history and margin rules.',
        },
      ]}
      sections={[
        {
          heading: 'Beyond FAQ bots: what autonomous customer ops actually means',
          image: sectionImg,
          imageAlt: 'Professional AI transcription and operations accuracy',
          imagePosition: 'left',
          body: (
            <>
              <p>
                Autonomous customer operations is not &quot;GPT pasted into your help widget.&quot; It
                is an orchestrated stack where specialized agents handle classification, data
                retrieval, action execution, and quality review—each with scoped permissions. A
                billing agent might issue store credit up to $50; anything above routes to a human
                with a pre-filled summary and suggested resolution.
              </p>
              <p>
                E-commerce brands use AiBHive to collapse WISMO (&quot;where is my order&quot;) volume
                during peak season without hiring seasonal temps. Logistics providers automate
                appointment rescheduling and proof-of-delivery disputes. Local service companies
                (HVAC, dental, legal intake) book appointments and collect intake data over SMS while
                staff stay in the field.
              </p>
              <p>
                Because agents maintain conversation memory across channels, a customer can start on
                web chat and continue in SMS without repeating order numbers—a experience consumers
                now expect from tier-one retailers.
              </p>
            </>
          ),
        },
        {
          heading: 'Security, permissions, and human-in-the-loop economics',
          body: (
            <>
              <p>
                Giving AI access to production systems sounds risky until you see the permission
                model. AiBHive agents run with least-privilege service accounts: read-only where
                possible, write scopes limited to specific endpoints (refund.create under $X,
                subscription.pause, ticket.tag). Sensitive actions always enqueue for human approval
                with a one-click approve link in Slack or your ops inbox.
              </p>
              <p>
                Full audit trails capture prompts, tool outputs, and final customer-visible messages—
                critical for chargeback disputes and regulatory inquiries. PII is masked in logs
                according to your retention policy.
              </p>
              <p>
                Teams that measure support as a profit center track save offers accepted, warranty
                upsells, and churn prevented—not just cost per ticket. Agents trained on your margin
                rules avoid discounting SKUs that destroy contribution.
              </p>
            </>
          ),
        },
        {
          heading: 'Omnichannel deployment: web, SMS, and voice-ready architectures',
          body: (
            <>
              <p>
                AiBHive deploys against your existing channels rather than forcing a rip-and-replace.
                Web chat widgets, Twilio SMS, WhatsApp Business APIs, and email ingestion are common
                entry points. Voice handoff modules are available where telephony integrations exist,
                using the same policy core as text channels for consistent answers.
              </p>
              <p>
                Sentiment and urgency scoring prioritize VIP accounts and SLA breaches. When backlog
                grows, supervisors receive digests of stalled threads with recommended bulk actions
                rather than blind headcount increases.
              </p>
            </>
          ),
        },
        {
          heading: 'Metrics that matter to COOs and support leaders',
          body: (
            <>
              <p>
                Executives want deflection rate, but smart operators want <em>quality-weighted</em>{' '}
                automation: resolved on first contact without reopen, CSAT maintained, and revenue
                per thousand tickets. AiBHive dashboards expose all three, segmented by product line
                and channel.
              </p>
              <p>
                Implementation typically starts with one high-volume intent cluster (WISMO or
                returns), proves ROI in thirty days, then expands to billing, technical troubleshooting,
                and proactive outreach—each wave adding agents without multiplying vendor contracts.
              </p>
            </>
          ),
        },
        {
          heading: 'Future-proofing support as channels multiply',
          body: (
            <>
              <p>
                Social DMs, marketplace seller messages, and in-app chat are converging on the same
                operational backlog as email and phone. Brands that bolt on a new bot per channel recreate
                the fragmentation problem agentic ops was meant to solve. AiBHive centralizes policy,
                permissions, and customer memory so every surface draws from one operational brain.
              </p>
              <p>
                Proactive support is the next frontier: agents that detect delayed shipments before the
                customer asks, offer resolution plus a retention coupon within policy, and close the loop
                without a human touch—while logging every decision for QA sampling. Early adopters report
                measurable churn reduction because frustration never escalates to a public review.
              </p>
              <p>
                Training cost collapses when new SKUs launch: update the RAG knowledge base and agent
                guardrails once; all channels inherit the change. Compare that to retraining hundreds of
                macros across regions and languages every product cycle.
              </p>
              <p>
                Whether you are a nine-figure DTC brand or a regional service franchise, the strategic
                question is identical: will customer operations remain a reactive cost center, or become an
                autonomous revenue and retention layer? AiBHive is built for teams choosing the second path.
              </p>
            </>
          ),
        },
      ]}
      techStack={[
        {
          name: 'OMS & commerce APIs',
          description: 'Shopify, BigCommerce, custom carts—live order and inventory state.',
        },
        {
          name: 'Ticketing sync',
          description: 'Zendesk, Intercom, Freshdesk bi-directional thread updates.',
        },
        {
          name: 'Sentiment & escalation',
          description: 'Real-time scoring routes edge cases to humans with context.',
        },
        {
          name: 'Revenue playbooks',
          description: 'Upsell modules grounded in SKU margin and eligibility rules.',
        },
      ]}
      comparison={[
        {
          feature: 'Data access',
          legacy: 'Static FAQ only',
          aibhive: 'Live CRM / OMS reads and writes',
        },
        {
          feature: 'Cross-channel',
          legacy: 'Siloed per widget',
          aibhive: 'Unified conversation memory',
        },
        {
          feature: 'Refunds',
          legacy: 'Always human',
          aibhive: 'Policy-bound auto + HITL above threshold',
        },
        {
          feature: 'Upsell',
          legacy: 'Rare / manual',
          aibhive: 'Contextual offers in-thread',
        },
      ]}
      checklist={[
        'Scoped API credentials with least-privilege enforcement',
        'Slack/email HITL approvals for high-risk actions',
        'CSAT and reopen-rate tracking per agent workflow',
        'Brand voice tuning via RAG over macros and policies',
        'Peak-season scaling without linear hiring',
      ]}
      faqs={[
        {
          q: 'Can agents issue refunds automatically?',
          a: 'Yes, within limits you configure. Larger amounts pause for human approval with full context attached.',
        },
        {
          q: 'Do you replace Zendesk or Intercom?',
          a: 'No—we integrate with them. Your team keeps familiar tooling; agents do the heavy lifting inside it.',
        },
        {
          q: 'How do you handle angry customers?',
          a: 'Sentiment models escalate early; tone controls and de-escalation playbooks are customized per brand.',
        },
        {
          q: 'Is PCI or HIPAA required?',
          a: 'We architect around your compliance tier—tokenized payments, BAA workflows for healthcare intake, etc.',
        },
      ]}
      relatedLinks={RELATED}
    />
  );
}
