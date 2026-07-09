import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Shield,
  Globe,
  Layers,
  Filter,
  ScanText,
  Server,
  Wifi,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { SEO } from '../../components/SEO';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-card p-6 sm:p-8 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <Icon className="w-6 h-6 mr-3 text-bee-amber" />
        {title}
      </h2>
      <div className="space-y-3 text-slate-300 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export default function FableScrapeGuide() {
  return (
    <main className="py-24">
      <SEO
        title="Fable Scrape — Complete User Guide | AiBhive"
        description="How to use Fable Scrape: stealth engines, content filters, multi-page crawling, IP routing with residential proxies (DataImpulse, IPRoyal, Webshare), and one-pass OCR."
        keywords="fable scrape guide, stealth scraper tutorial, residential proxy scraping, crawl depth, OCR archive"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/fable-scrape" className="inline-flex items-center gap-2 text-bee-amber font-bold text-sm mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Fable Scrape
        </Link>

        <header className="mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6 border border-bee-amber/20"
          >
            <BookOpen className="w-4 h-4" />
            User Guide
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How <span className="text-gradient">Fable Scrape</span> works
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Fable Scrape is a stealth research harvester for archives that normally detect and block bots. It finds
            images, PDFs, documents, and videos on a page (or across a whole site), downloads them undetected, and can
            OCR the images in one pass — all while protecting the shared AiBhive server IP from bans.
          </p>
        </header>

        <div className="space-y-6">
          <Section icon={Globe} title="1. The two run modes">
            <p>
              <strong className="text-white">Single page</strong> — scans exactly one URL. Fastest, and best when you
              already know the page holding your documents (e.g. a specific manuscript record).
            </p>
            <p>
              <strong className="text-white">Crawl site</strong> — starts at your URL and follows links to discover more
              pages, aggregating every asset it finds. Use the scope controls so you know exactly how much you're pulling:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white">Max pages</strong> — hard stop on how many pages are visited (capped at 40).</li>
              <li><strong className="text-white">Link depth</strong> — how many links deep to follow from the start page (0 = start page only, capped at 4).</li>
              <li><strong className="text-white">Same domain only</strong> — stay on the starting site and never wander off to external hosts.</li>
            </ul>
            <p className="text-slate-400 text-sm">
              A polite delay runs between page fetches, and a total time budget prevents runaway crawls. This is what
              stops "just scrape wikipedia.com" from trying to download the entire encyclopedia — you set the ceiling.
            </p>
          </Section>

          <Section icon={Filter} title="2. Content filters — take only what you need">
            <p>Before scanning, tick the asset types you want. Everything else is ignored, so you know the scale up front:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white">Images</strong> — photos, scans, plates. Toggle <em>Include icons &amp; UI sprites</em> to also grab tiny logos/buttons (off by default to skip clutter).</li>
              <li><strong className="text-white">PDFs</strong> — listed and downloadable separately.</li>
              <li><strong className="text-white">Text &amp; documents</strong> — .txt, .doc(x), .csv, .rtf, .epub, .djvu, .xml, and more.</li>
              <li><strong className="text-white">Videos</strong> — mp4/webm/mov plus <code>&lt;video&gt;</code> sources and og:video. Videos can be large, so they're opt-in.</li>
            </ul>
            <p>After a scan, the summary bar shows exact counts per type so you can gauge the download before committing.</p>
          </Section>

          <Section icon={Shield} title="3. Stealth engines">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white">Auto</strong> — uses the best engine available on the server.</li>
              <li><strong className="text-white">Standard</strong> — emulates a real browser: rotating User-Agent + client hints, browser-like headers, a plausible referer, cookie replay, and jittered retries with backoff when a site soft-blocks (403/429/503).</li>
              <li><strong className="text-white">Max stealth</strong> — routes page fetches through a cloud anti-bot service (Firecrawl) that handles heavier challenges like Cloudflare. Requires a Firecrawl key on the server.</li>
            </ul>
          </Section>

          <Section icon={Wifi} title="4. IP routing — keep the host from getting banned">
            <p>This is the most important choice. It decides <em>whose IP address</em> the target site sees:</p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white font-bold flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-400" /> My IP (browser) — free</p>
              <p className="text-sm mt-1">
                Bulk asset downloads run <strong className="text-white">inside your browser</strong>, so the target sees
                <strong className="text-white"> your</strong> IP, not AiBhive's. Free and unlimited. Because browsers
                enforce CORS, some hosts won't allow client-side downloads — those items are flagged so you can switch
                routing for them. See the risk note below.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white font-bold flex items-center gap-2"><Server className="w-4 h-4 text-bee-amber" /> AiBhive residential proxies (rotating)</p>
              <p className="text-sm mt-1">
                Server-side downloads egress through AiBhive's rotating residential proxy pool. Each request can present
                a different residential IP, spreading load so no single address gets flagged — and the AiBhive datacenter
                IP is never exposed. Availability shows in the tool when configured.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white font-bold flex items-center gap-2"><KeyRound className="w-4 h-4 text-sky-400" /> Custom proxy (your provider)</p>
              <p className="text-sm mt-1">
                Plug in your own residential proxy from providers like <strong className="text-white">DataImpulse</strong>,
                <strong className="text-white"> IPRoyal</strong>, or <strong className="text-white">Webshare</strong>.
                Pick the provider preset to auto-fill the endpoint, add your username/password, and hit
                <em> Test connection</em> to confirm the exit IP before scanning.
              </p>
            </div>
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-300 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Risk note for "My IP (browser)"
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm mt-2 text-amber-100/90">
                <li>The target site can see and log <strong>your</strong> home/office IP address.</li>
                <li>Aggressive scraping from your IP can get <strong>your</strong> address rate-limited or banned by that site.</li>
                <li>Your ISP and the target may associate the activity with you personally.</li>
                <li>Only scrape content you're allowed to, and respect each site's terms and robots policy.</li>
              </ul>
            </div>
          </Section>

          <Section icon={KeyRound} title="5. Connecting a residential proxy provider">
            <p>Two ways to route through residential IPs:</p>
            <p><strong className="text-white">A) Per-session (Custom proxy, in the tool):</strong> choose a provider preset, fill in your credentials, test, and go. Nothing is stored server-side.</p>
            <p><strong className="text-white">B) Platform-wide (admin / env):</strong> set the proxy on the server so every "residential" run uses it. Providers give a rotating gateway URL:</p>
            <div className="rounded-xl border border-white/10 bg-[#0f1115]/70 p-4 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
              <div># DataImpulse</div>
              <div>FABLE_SCRAPE_RESIDENTIAL_PROXY=http://USER:PASS@gw.dataimpulse.com:823</div>
              <div className="pt-2"># IPRoyal</div>
              <div>FABLE_SCRAPE_RESIDENTIAL_PROXY=http://USER:PASS@geo.iproyal.com:12321</div>
              <div className="pt-2"># Webshare</div>
              <div>FABLE_SCRAPE_RESIDENTIAL_PROXY=http://USER:PASS@p.webshare.io:80</div>
              <div className="pt-2"># Or a pool (one chosen at random per request)</div>
              <div>FABLE_SCRAPE_PROXIES=http://USER:PASS@host1:port,http://USER:PASS@host2:port</div>
            </div>
            <p className="text-slate-400 text-sm">HTTP/HTTPS proxy endpoints are supported (the standard format for these providers).</p>
          </Section>

          <Section icon={ScanText} title="6. Downloading & OCR">
            <p>
              After a scan, select the images you want (Select all / individual checkboxes) and choose{' '}
              <strong className="text-white">Download selected</strong>. PDFs, documents, and videos each get their own
              list with one-click downloads. Page text can be copied or saved as .txt.
            </p>
            <p>
              <strong className="text-white">One-pass OCR:</strong> pick a format (Markdown, Plain Text, Preserve Layout)
              and hit <em>Extract text</em>. Fable Scrape fetches the selected scans (through your chosen IP route) and
              runs them through AiBhive's OCR — turning a folder of manuscript images into searchable text without the
              manual save-then-OCR grind.
            </p>
          </Section>

          <Section icon={Layers} title="7. Suggested workflow for huge archives">
            <ul className="list-disc pl-6 space-y-1">
              <li>Start with <strong className="text-white">Single page</strong> to confirm the site exposes what you need.</li>
              <li>Switch to <strong className="text-white">Crawl</strong> with a small <em>Max pages</em> (e.g. 5) and <em>depth 1</em> to sample scale.</li>
              <li>Check the counts, then raise the caps deliberately.</li>
              <li>Use <strong className="text-white">residential</strong> or <strong className="text-white">custom</strong> routing for big jobs so no single IP gets hammered.</li>
              <li>Enable <strong className="text-white">Max stealth</strong> for sites behind Cloudflare.</li>
            </ul>
          </Section>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-bold">Ready to try it</p>
              <p className="text-slate-300 text-sm mt-1">
                Head back to the tool, paste an archive URL, tick your content types, choose an IP route, and scan.
              </p>
              <Link
                to="/fable-scrape"
                className="inline-block mt-4 px-6 py-3 rounded-xl bg-bee-amber text-bee-black font-bold text-sm hover:bg-bee-yellow transition-colors"
              >
                Open Fable Scrape
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
