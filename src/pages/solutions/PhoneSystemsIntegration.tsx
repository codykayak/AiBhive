import CategorySeoPage from '../../components/CategorySeoPage';
import PhoneSystemsFlow from '../../components/PhoneSystemsFlow';
import heroImg from '../../ai_voice_translation_clone_lab.png';
import sectionImg from '../../1775556316513.png';

const RELATED = [
  { label: 'Field Service AI', href: '/solutions/field-service-ai' },
  { label: 'Real Estate AI', href: '/solutions/real-estate-ai-automation' },
  { label: 'Lead Generation', href: '/solutions/ai-lead-generation-automation' },
  { label: 'Customer Operations', href: '/solutions/ai-customer-operations-automation' },
  { label: 'Medical & Legal AI', href: '/solutions/medical-legal-multi-agent-compliance' },
];

export default function PhoneSystemsIntegration() {
  return (
    <CategorySeoPage
      seo={{
        title: 'Phone & SMS AI Integration — Missed Call Text-Back & Appointment Booking | AiBHive',
        description:
          'Integrate AiBHive with Twilio, RingCentral, and business phone systems. Missed calls trigger RAG-trained SMS agents that qualify leads and book appointments automatically.',
        keywords:
          'missed call text back AI, phone system AI integration, Twilio AI SMS, intelligent text automation, appointment booking SMS, AiBHive phone',
      }}
      eyebrow="Solution Category · Phone Systems"
      title="Phone & SMS intelligence"
      highlight="on every missed call."
      subtitle="AiBHive plugs into your existing phone and texting platforms—training agents on your business so every missed call becomes an intelligent conversation that books appointments."
      heroImage={heroImg}
      heroAlt="AI voice and phone system integration technology"
      stats={[
        { value: '<60s', label: 'Text-after-miss' },
        { value: '2-way', label: 'SMS conversations' },
        { value: 'RAG', label: 'Your knowledge base' },
        { value: 'Auto', label: 'Calendar booking' },
      ]}
      intro={
        <>
          <p>
            Your business phone system already rings, records, and forwards. What it does not do is
            think. When a prospect calls during showings, after hours, or while your team is on another
            line, voicemail is where deals go to die—studies consistently show most callers never leave
            a message and never call back.
          </p>
          <p>
            <strong className="text-white">AiBHive Phone Systems Integration</strong> connects to the
            platforms you already trust—Twilio, RingCentral, OpenPhone, Dialpad, CallRail, Vonage, and
            custom SIP/WebRTC stacks via webhooks. The moment a call is missed or a new SMS arrives, a
            RAG-trained agent responds with context from your pricing, services, availability, and
            approved scripts—not a one-line &quot;Sorry we missed you.&quot;
          </p>
          <p>
            The agent holds intelligent two-way text conversations, qualifies intent, answers FAQs from
            your private documents, and books live appointments on your calendar. Humans step in when
            sentiment, compliance, or deal size requires it; until then, the hive works the thread.
          </p>
        </>
      }
      afterIntro={<PhoneSystemsFlow />}
      sections={[
        {
          heading: 'Platforms we integrate with',
          image: sectionImg,
          imageAlt: 'AI communication and voice technology integration',
          imagePosition: 'right',
          body: (
            <>
              <p>
                AiBHive is platform-agnostic at the telephony layer. We consume standard webhooks and
                REST APIs: Twilio Programmable Voice and Messaging, RingCentral webhooks, OpenPhone
                events, CallRail missed-call triggers, and middleware like Zapier or Make when direct
                APIs are not exposed.
              </p>
              <p>
                Implementation typically takes your existing business number (or a tracking pool) and
                routes missed-call and inbound-SMS events to our orchestration layer. Outbound replies
                send through the same carrier relationship so your caller ID and 10DLC registration stay
                intact.
              </p>
              <p>
                We do not ask you to port numbers on day one—many customers parallel-run a pilot line
                before moving primary inbound traffic.
              </p>
            </>
          ),
        },
        {
          heading: 'Missed-call text-back with RAG—not templates',
          body: (
            <>
              <p>
                Static templates (&quot;Sorry we missed your call, reply YES for info&quot;) convert
                poorly because they ignore why the person called. AiBHive agents pull from your RAG
                corpus: service menus, pricing tiers, service areas, bios, and objection handlers written
                in your voice.
              </p>
              <p>
                A homeowner who missed reaching your HVAC line might receive: &quot;Hi—this is Alex
                with [Company]. Sorry we missed you. Are you looking for emergency service or a
                maintenance visit? We have openings Thursday in your zip.&quot; A dental patient gets
                different language entirely—same infrastructure, different knowledge base.
              </p>
              <p>
                Follow-up messages adapt to replies. If the prospect asks about insurance or financing,
                the agent retrieves the right snippet instead of hallucinating policy.
              </p>
            </>
          ),
        },
        {
          heading: 'Automatic appointment booking over text',
          body: (
            <>
              <p>
                Once qualified, agents offer booking links (Calendly, Acuity, CRM schedulers) or query
                live calendar availability via API and propose times in-thread: &quot;I can hold
                Tuesday 2 p.m. or Wednesday 10 a.m.—which works?&quot; Confirmations write to CRM with
                the full SMS transcript attached.
              </p>
              <p>
                Reminder sequences reduce no-shows: agents send day-before and hour-before texts within
                policy limits. Cancellations re-open the slot and can trigger waitlist outreach to other
                warm leads in the same pipeline.
              </p>
            </>
          ),
        },
        {
          heading: 'Compliance, opt-out, and human handoff',
          body: (
            <>
              <p>
                TCPA, 10DLC registration, and quiet-hour rules are encoded in workflow policy—not left to
                chance. Every outbound message logs consent basis where applicable; STOP requests halt
                automation immediately and sync suppression lists to your CRM.
              </p>
              <p>
                Sentiment and keyword triggers (&quot;lawyer,&quot; &quot;complaint,&quot; &quot;speak
                to someone&quot;) route to humans via Slack, email, or in-app queues with one-click
                takeover. The agent stops texting; your rep continues with full context.
              </p>
            </>
          ),
        },
        {
          heading: 'Use cases beyond real estate',
          body: (
            <>
              <p>
                Home services, medical and dental intake, legal consultation scheduling, automotive
                service, and high-ticket B2B sales all share the same pattern: missed calls are common,
                speed matters, and answers must be accurate. AiBHive deploys industry-specific RAG packs
                on the same phone integration core.
              </p>
              <p>
                Pair phone agents with our Customer Operations category for post-booking support, or
                with Lead Generation for outbound nurture after the first booked call—one hive, multiple
                workflows.
              </p>
              <p>
                Ready to connect your numbers? Bring your current phone vendor to a strategy session—we
                will diagram the webhook path and estimate lift from missed-call recovery alone.
              </p>
            </>
          ),
        },
      ]}
      pipeline={[
        {
          step: '01',
          title: 'Telephony webhook',
          description: 'Missed call or inbound SMS event hits AiBHive orchestration.',
        },
        {
          step: '02',
          title: 'RAG context load',
          description: 'Agent loads your scripts, FAQs, and calendar rules.',
        },
        {
          step: '03',
          title: 'Intelligent SMS',
          description: 'Personalized outbound + two-way dialogue until qualified.',
        },
        {
          step: '04',
          title: 'Book & log',
          description: 'Appointment confirmed; CRM + call record updated.',
        },
      ]}
      techStack={[
        {
          name: 'CPaaS APIs',
          description: 'Twilio, Bandwidth, Telnyx messaging and voice webhooks.',
        },
        {
          name: 'Business phone SaaS',
          description: 'RingCentral, OpenPhone, Dialpad, Grasshopper integrations.',
        },
        {
          name: 'RAG knowledge hub',
          description: 'PDFs, Notion, URLs, and CRM fields as agent context.',
        },
        {
          name: 'Scheduling APIs',
          description: 'Google Calendar, Outlook, Calendly, GHL calendars.',
        },
      ]}
      comparison={[
        {
          feature: 'Missed call response',
          legacy: 'Voicemail only',
          aibhive: 'Instant RAG SMS in <60s',
        },
        {
          feature: 'Conversation',
          legacy: 'One-way blast',
          aibhive: 'Two-way qualification',
        },
        {
          feature: 'Accuracy',
          legacy: 'Fixed template',
          aibhive: 'Grounded in your docs',
        },
        {
          feature: 'Outcome',
          legacy: 'Hope they call back',
          aibhive: 'Booked appointment in CRM',
        },
      ]}
      checklist={[
        'Webhook integration with your current phone vendor',
        'Custom RAG training on scripts, pricing, and FAQs',
        'Two-way SMS with human takeover and STOP handling',
        'Calendar booking inside the text thread',
        'Call recording links and transcripts in CRM notes',
      ]}
      faqs={[
        {
          q: 'Do I need to switch phone providers?',
          a: 'Usually no. We integrate with what you have; some clients add a dedicated Twilio subaccount for AI traffic.',
        },
        {
          q: 'How fast is the missed-call text?',
          a: 'Typically under 60 seconds from hang-up—configurable per brand to feel natural.',
        },
        {
          q: 'Can it handle inbound SMS marketing replies?',
          a: 'Yes—inbound SMS to your business line can route to the same RAG agent with different playbooks.',
        },
        {
          q: 'What about voice AI on the call itself?',
          a: 'Phone integration focuses on SMS follow-up and booking; voice agents can be scoped as a separate phase.',
        },
      ]}
      relatedLinks={RELATED}
    />
  );
}
