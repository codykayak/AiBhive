import { ExternalLink } from 'lucide-react';
import { parseDorkLinks } from '../../lib/intelDorkLinks';

type Props = {
  data?: string;
};

/** Clickable Google dork links from free OSINT tool output. */
export default function IntelDorkLinks({ data }: Props) {
  const links = parseDorkLinks(data);
  if (!links.length) return null;

  return (
    <div className="rounded-xl border border-bee-amber/30 bg-bee-amber/5 p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-bee-amber">Google dork links</p>
        <p className="text-xs text-slate-400 mt-1">
          AiBhive does not scrape Google directly — tap a link to open the search in your browser. For
          automatic company extraction, enable <strong className="text-slate-300">Quick factual search</strong>{' '}
          (SerpAPI) or <strong className="text-slate-300">Deep web search</strong> (Firecrawl).
        </p>
      </div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-black/20 hover:border-bee-amber/40 hover:bg-bee-amber/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{link.label}</span>
                {link.query ? (
                  <span className="block text-xs text-slate-500 mt-1 line-clamp-2">{link.query}</span>
                ) : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
