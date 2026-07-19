import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Wrench } from 'lucide-react';
import CategorySeoPage from '../../components/CategorySeoPage';
import heroImg from '../../1775559497156.png';
import sectionImg from '../../ai_voice_translation_clone_lab.png';

const TRADE_PACKS = [
  { label: 'HVAC', href: '/pros/hvac', color: '#7B9FD4' },
  { label: 'Plumbing', href: '/pros/plumbing', color: '#4A90A4' },
  { label: 'Electrical', href: '/pros/electrical', color: '#E8B84A' },
  { label: 'Pool', href: '/pros/pool', color: '#5BC0BE' },
  { label: 'Property', href: '/pros/property', color: '#8B7EC8' },
  { label: 'Fiber', href: '/pros/fiber', color: '#6B8F71' },
] as const;

const RELATED = [
  { label: 'Phone Systems & SMS', href: '/solutions/phone-systems-ai-integration' },
  { label: 'Customer Operations', href: '/solutions/ai-customer-operations-automation' },
  { label: 'Workflow Orchestration', href: '/solutions/enterprise-workflow-orchestration' },
  { label: 'Real Estate AI', href: '/solutions/real-estate-ai-automation' },
];

function FieldServiceLoop() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 mb-16">
      <div className="rounded-2xl border border-bee-amber/20 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-bee-amber mb-4">The AiBhive field stack</p>
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <Link
            to="/pros"
            className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:border-bee-amber/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-bee-amber" />
              <span className="font-bold text-white">AiBhive Pros</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Company HQ — dispatch, roster, periodic GPS, and a living knowledge base that grows from every truck.
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-bee-amber mt-3 font-semibold group-hover:gap-2 transition-all">
              Explore Pros <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <div className="hidden md:flex flex-col items-center gap-1 text-center px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">sync</span>
            <div className="w-px h-8 bg-bee-amber/30" />
            <span className="text-2xl text-bee-amber">↔</span>
            <div className="w-px h-8 bg-bee-amber/30" />
            <span className="text-xs text-slate-500">compound</span>
          </div>

          <Link
            to="/diagnose"
            className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:border-bee-amber/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-5 h-5 text-bee-amber" />
              <span className="font-bold text-white">AiBhive Diagnose</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Field app — Grok chat, photo vision, 100+ fault playbooks, guided flows, and trade-specific RAG packs.
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-bee-amber mt-3 font-semibold group-hover:gap-2 transition-all">
              Try Diagnose <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Trade packs</p>
          <div className="flex flex-wrap gap-2">
            {TRADE_PACKS.map((pack) => (
              <Link
                key={pack.href}
                to={pack.href}
                className="rounded-full border px-3 py-1.5 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
                style={{ borderColor: `${pack.color}55`, backgroundColor: `${pack.color}18` }}
              >
                {pack.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldServiceAi() {
  return (
    <CategorySeoPage
      seo={{
        title: 'Field Service AI — HVAC & Plumbing Diagnosis, Pros HQ & Living Knowledge | AiBHive',
        description:
          'AiBhive Field Service AI pairs AiBhive Pros (dispatch, shop memory, GPS roster) with AiBhive Diagnose (Grok chat, photo vision, fault playbooks) for HVAC, plumbing, electrical, pool, and property teams.',
        keywords:
          'field service AI, HVAC diagnosis AI, plumbing AI troubleshooting, trade knowledge base, AiBhive Pros, AiBhive Diagnose, field technician AI, dispatch software trades',
      }}
      eyebrow="Solution Category · Field Service"
      title="Field service AI"
      highlight="that compounds with every truck roll."
      subtitle="Pair AiBhive Pros company HQ with AiBhive Diagnose in the field — Grok-powered diagnosis, photo vision, and a living knowledge base your whole shop inherits."
      heroImage={heroImg}
      heroAlt="Enterprise field service AI and trade diagnosis technology"
      stats={[
        { value: '6', label: 'Trade packs' },
        { value: '100+', label: 'Fault playbooks' },
        { value: 'Grok', label: 'Photo + chat AI' },
        { value: '24/7', label: 'Shop memory' },
      ]}
      intro={
        <>
          <p>
            Home services and commercial trades lose margin in the same places: callbacks because the first tech
            guessed wrong, senior techs repeating the same coaching calls, and dispatch flying blind when the truck
            is still on site. Spreadsheets and group texts do not scale when you run fifteen trucks across HVAC,
            plumbing, and electrical.
          </p>
          <p>
            <strong className="text-white">AiBhive Field Service AI</strong> is the enterprise story behind two
            products already on the road: <strong className="text-white">AiBhive Pros</strong> — your company HQ for
            dispatch, roster, periodic GPS, and a searchable knowledge base — and{' '}
            <strong className="text-white">AiBhive Diagnose</strong> — the field app where techs chat with Grok,
            upload equipment photos, walk guided fault trees, and pull NEC, pool chemistry, and HVAC references
            offline when cell service drops.
          </p>
          <p>
            Every diagnosis, photo, and &quot;that fixed it&quot; note can flow back to Pros HQ. The next tech on a
            similar unit starts with your shop&apos;s history — not a blank screen. That is the compound loop:
            diagnose in the truck, document at the panel, grow institutional memory in the cloud.
          </p>
        </>
      }
      afterIntro={<FieldServiceLoop />}
      sections={[
        {
          heading: 'AiBhive Diagnose — AI diagnosis for HVAC, plumbing, and every trade pack',
          image: sectionImg,
          imageAlt: 'AI-powered field diagnosis and trade intelligence',
          imagePosition: 'right',
          body: (
            <>
              <p>
                Diagnose ships six trade packs — HVAC, plumbing, electrical, pool, property maintenance, and
                fiber/low voltage — each with fault playbooks, error-code libraries, safety checklists, and
                glove-friendly guided flows. Techs ask in plain English: &quot;Carrier 24ACC warm air at vents,
                outdoor fan running&quot; or snap a nameplate photo and let vision models read model and serial data.
              </p>
              <p>
                Live Grok reasoning runs on Hive credits; the offline pack library is always available. Web access at{' '}
                <Link to="/diagnose" className="text-bee-amber hover:underline">
                  aibhive.com/diagnose
                </Link>{' '}
                mirrors the Android app so estimators and call-center staff can troubleshoot before they dispatch.
                New sign-ins receive welcome credits to test AI on real tickets.
              </p>
              <p>
                HVAC and plumbing teams get the deepest coverage today — refrigeration fundamentals, heat-pump
                defrost logic, water-heater venting, slab leak isolation, and drain-clearing decision trees — with
                electrical NEC references and pool chemistry charts in the same shell.
              </p>
            </>
          ),
        },
        {
          heading: 'AiBhive Pros — dispatch, roster, and living shop memory',
          body: (
            <>
              <p>
                Pros is HQ for owners and ops managers: create a company, invite techs with a code, push job context
                to Diagnose, and watch the knowledge graph grow. Dispatch can attach symptoms, equipment tags, and
                customer history before the truck rolls. When the job closes, completion notes and photos sync back
                automatically.
              </p>
              <p>
                Periodic GPS check-ins (not live stalking) show who is in the field when tracking is enabled.
                Managers see roster status on a map; techs control when location shares. Push notifications keep
                Diagnose aligned with the job board so the field app always knows what they are walking into.
              </p>
              <p>
                Trade-specific landing pages —{' '}
                <Link to="/pros/hvac" className="text-bee-amber hover:underline">
                  HVAC
                </Link>
                ,{' '}
                <Link to="/pros/plumbing" className="text-bee-amber hover:underline">
                  plumbing
                </Link>
                , electrical, pool, property, and fiber — explain how each pack maps to your service mix.
              </p>
            </>
          ),
        },
        {
          heading: 'The knowledge loop: diagnose → document → compound',
          body: (
            <>
              <p>
                Legacy field-service software stores tickets. AiBhive stores judgment. When a senior tech finally
                isolates a bad TXV on a recurring callback unit, that fix becomes searchable for the whole shop —
                anonymized tips can even strengthen the broader network while keeping customer data private.
              </p>
              <p>
                RAG corpora ingest manuals, internal SOPs, and past job outcomes. The next apprentice on a similar
                call gets ranked suggestions before they open the panel. Dispatch sees which techs have solved this
                equipment family before and can route accordingly.
              </p>
              <p>
                Pair the loop with{' '}
                <Link to="/solutions/phone-systems-ai-integration" className="text-bee-amber hover:underline">
                  Phone Systems integration
                </Link>{' '}
                so missed emergency calls trigger intelligent SMS while your on-call tech is under a house — same
                hive, different workflow.
              </p>
            </>
          ),
        },
        {
          heading: 'Enterprise rollout for multi-trade shops',
          body: (
            <>
              <p>
                Roll out Diagnose to the trucks first — low friction, immediate value on the next no-heat call.
                Layer Pros HQ when you are ready to centralize dispatch, permissions, and knowledge ownership.
                Enterprise engagements add custom RAG on your manuals, ServiceTitan or Housecall Pro webhooks, and
                compliance guardrails for customer PII.
              </p>
              <p>
                Property-management and facilities teams use the property pack for multi-site maintenance, vendor
                coordination, and recurring unit turnover. Fiber and low-voltage crews get OTDR-style troubleshooting
                prompts and splice reference charts in the same Diagnose shell.
              </p>
              <p>
                Book a strategy session with your trade mix and truck count — we will map the Pros + Diagnose path
                and estimate callback reduction from a living knowledge base alone.
              </p>
            </>
          ),
        },
        {
          heading: 'What technicians actually use in the van',
          body: (
            <>
              <p>
                Glove-friendly UI, large tap targets, and offline-first pack libraries mean Diagnose works in
                crawlspaces and mechanical rooms with no signal. Photo upload feeds vision models for nameplate OCR
                and visual fault hints. Chat history stays on the job so the office can review what was tried before
                authorizing a second truck roll.
              </p>
              <p>
                Safety checklists and code references (NEC, pool bonding, gas venting) are one tap away — not buried
                in a PDF folder on someone&apos;s phone. Guided flows walk junior techs through structured diagnosis
                without replacing senior judgment; escalation paths flag when a master license is required.
              </p>
              <p>
                Android APK and web app share the same packs. Company accounts link through Pros; independent techs
                can run Diagnose standalone with Hive credits.
              </p>
            </>
          ),
        },
      ]}
      pipeline={[
        {
          step: '01',
          title: 'Dispatch in Pros',
          description: 'Job context, equipment tags, and customer history push to Diagnose.',
        },
        {
          step: '02',
          title: 'Diagnose in field',
          description: 'Chat, photo vision, guided flows, and offline playbooks on site.',
        },
        {
          step: '03',
          title: 'Capture the fix',
          description: 'Notes, photos, and parts sync back to Pros HQ automatically.',
        },
        {
          step: '04',
          title: 'Compound knowledge',
          description: 'Next similar call starts with your shop’s ranked history and tips.',
        },
      ]}
      techStack={[
        {
          name: 'Grok + vision',
          description: 'Live reasoning and photo analysis with Hive credit metering.',
        },
        {
          name: 'Trade RAG packs',
          description: 'HVAC, plumbing, electrical, pool, property, and fiber corpora.',
        },
        {
          name: 'Pros HQ',
          description: 'Dispatch, roster, GPS check-ins, and company knowledge graph.',
        },
        {
          name: 'Integrations',
          description: 'Webhooks to CRM, FSM, and phone/SMS layers on request.',
        },
      ]}
      comparison={[
        {
          feature: 'Field diagnosis',
          legacy: 'Phone a senior tech',
          aibhive: 'Grok + playbooks in Diagnose',
        },
        {
          feature: 'Shop memory',
          legacy: 'Tribal knowledge',
          aibhive: 'Searchable Pros knowledge base',
        },
        {
          feature: 'Dispatch context',
          legacy: 'Text thread screenshots',
          aibhive: 'Job pushed to field app',
        },
        {
          feature: 'Callbacks',
          legacy: 'Repeat guesswork',
          aibhive: 'Prior fixes ranked on device',
        },
      ]}
      checklist={[
        'AiBhive Diagnose with six trade packs and offline fault library',
        'AiBhive Pros HQ — dispatch, roster, and knowledge capture',
        'Grok chat and photo vision with welcome Hive credits',
        'Trade landing pages for HVAC, plumbing, electrical, pool, property, fiber',
        'Enterprise path: custom RAG, FSM webhooks, and phone/SMS pairing',
      ]}
      faqs={[
        {
          q: 'Do I need both Pros and Diagnose?',
          a: 'No. Diagnose works standalone for individual techs. Pros adds company dispatch, roster, and the knowledge loop when you are ready.',
        },
        {
          q: 'Which trades are supported today?',
          a: 'Six packs: HVAC, plumbing, electrical, pool, property maintenance, and fiber/low voltage — same packs on web and Android.',
        },
        {
          q: 'Does Diagnose work offline?',
          a: 'The fault library, guided flows, and reference charts work offline. Live Grok AI requires connectivity and Hive credits.',
        },
        {
          q: 'How does this compare to ServiceTitan or Housecall Pro?',
          a: 'AiBhive focuses on diagnosis intelligence and compounding shop knowledge. Many customers run Pros + Diagnose alongside existing FSM; we integrate via webhooks on enterprise plans.',
        },
        {
          q: 'Can office staff use Diagnose without going to the field?',
          a: 'Yes — the web landing at /diagnose gives call-center and dispatch staff the same packs and Grok chat to pre-qualify tickets before dispatch.',
        },
      ]}
      relatedLinks={RELATED}
    />
  );
}
