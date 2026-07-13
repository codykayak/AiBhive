import { useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { BookOpen, Loader2 } from 'lucide-react';
import { prosAssistantKnowledge } from '../../lib/prosApi';
import { prosAdmin as t } from './prosAdminTheme';

function renderMarkdown(md: string) {
  const lines = md.split('\n');
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="list-disc pl-5 space-y-1 text-slate-700 text-sm my-3">
        {listItems.map((item) => (
          <li key={item.slice(0, 40)}>{item}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      flushList();
      nodes.push(
        <h1 key={i} className="text-2xl font-black text-slate-900 mt-8 mb-3 first:mt-0">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      nodes.push(
        <h2 key={i} className="text-xl font-bold text-amber-700 mt-8 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      nodes.push(
        <h3 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      listItems.push(line.slice(2).replace(/\*\*/g, ''));
    } else if (line.startsWith('|') && line.includes('---')) {
      continue;
    } else if (line.startsWith('|')) {
      flushList();
      const cells = line.split('|').filter(Boolean).map((c) => c.trim());
      if (cells.length >= 2) {
        nodes.push(
          <div key={i} className="grid grid-cols-2 gap-2 text-sm border-b border-slate-200 py-2">
            <span className="font-semibold text-slate-800">{cells[0]}</span>
            <span className="text-slate-600">{cells[1]}</span>
          </div>
        );
      }
    } else if (line.trim() === '---') {
      flushList();
      nodes.push(<hr key={i} className="border-slate-200 my-6" />);
    } else if (line.trim()) {
      flushList();
      nodes.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed my-2">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    }
  }
  flushList();
  return nodes;
}

type Props = {
  user: User;
};

export default function ProsAdminManualPanel({ user }: Props) {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await prosAssistantKnowledge(user);
        if (!cancelled) setMarkdown(res.markdown || '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load manual');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="max-w-3xl">
      <div className={`${t.card} p-5 mb-6 flex items-start gap-3`}>
        <BookOpen className="w-6 h-6 text-sky-600 shrink-0" />
        <div>
          <h2 className="font-bold text-lg">Administrator user manual</h2>
          <p className="text-sm text-slate-600 mt-1">
            Full guide to Pros HQ and the Diagnose field app. The <strong className="text-slate-900">Pros Assistant</strong>{' '}
            (bottom right) is trained on this document — ask natural-language questions anytime.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading manual…
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <article className={`${t.card} p-6 sm:p-8`}>
          {renderMarkdown(markdown)}
        </article>
      )}
    </div>
  );
}
