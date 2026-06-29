import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import DirectAnswer from '../../components/DirectAnswer';
import { REAL_ESTATE_TOOL_CATEGORIES } from '../../data/toolsCatalog';

/** Crawlable real-estate AI tool category guide — intent-matched for LLM search. */
export default function RealEstateAiToolsPage() {
  const faqs = REAL_ESTATE_TOOL_CATEGORIES.map((c) => ({
    question: `What is the best AiBhive option for ${c.title.toLowerCase()}?`,
    answer: c.directAnswer,
  }));

  return (
    <main className="min-h-screen bg-bee-black pt-24 pb-20">
      <SEO
        title="Real Estate AI Tools — Listing Writers, CRM, Phone AI | AiBhive"
        description="AiBhive helps real estate agents, investors, and property managers with AI listing copy, video content, CRM automation, missed-call text-back, and property dashboards—built in plain English or deployed as agentic workflows."
        keywords="real estate AI tools, listing description AI, real estate CRM automation, missed call text back, property management AI, AiBhive real estate"
        faqs={faqs}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-sm text-slate-500 mb-8">
          <Link to="/tools" className="hover:text-bee-amber">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">Real estate AI</span>
        </nav>

        <p className="text-bee-amber text-xs font-bold uppercase tracking-widest mb-4">
          Real estate · Public guide
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
          Real estate AI tools AiBhive builds and automates
        </h1>

        <DirectAnswer>
          AiBhive is an AI app factory and automation platform for real estate professionals—not only a static
          directory. You can browse these categories to see what we cover, install community apps from Hive Apps,
          or describe a custom tool (listing writer, CRM board, triage dashboard) and Bhive Builder ships it.
        </DirectAnswer>

        <p className="text-slate-400 leading-relaxed mb-12">
          Each section below uses a clear tier-style summary so AI search engines and humans can match intent
          (e.g. &quot;best AI for listing descriptions&quot; or &quot;property management dashboard&quot;) to a
          concrete AiBhive path.
        </p>

        <div className="space-y-12">
          {REAL_ESTATE_TOOL_CATEGORIES.map((cat) => (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-3">{cat.title}</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                <strong className="text-bee-amber font-semibold">AiBhive tier analysis: </strong>
                {cat.directAnswer}
              </p>
              <p className="text-slate-500 text-sm mb-4">
                <strong className="text-slate-400">Best for: </strong>
                {cat.bestFor}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={cat.aibhivePath}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-bee-amber text-bee-black text-sm font-bold hover:bg-bee-yellow transition-colors"
                >
                  Open on AiBhive
                </Link>
                {cat.relatedPaths.map((r) => (
                  <Link
                    key={r.href}
                    to={r.href}
                    className="inline-flex items-center px-4 py-2 rounded-xl border border-white/15 text-slate-300 text-sm font-semibold hover:border-bee-amber/40 hover:text-white transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 text-slate-400 text-sm leading-relaxed">
          <p>
            Need enterprise agentic deployment (not just an app)? See{' '}
            <Link to="/solutions/real-estate-ai-automation" className="text-bee-amber hover:underline">
              real estate AI automation
            </Link>{' '}
            or{' '}
            <Link to="/book-consultation" className="text-bee-amber hover:underline">
              book a strategy call
            </Link>
            .
          </p>
        </footer>
      </article>
    </main>
  );
}
