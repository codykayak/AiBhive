import { cn } from '../utils';

/** Lightweight markdown for diagnose replies (bold, headers, lists). */
export function DiagnoseMarkdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  return (
    <div className={cn('space-y-2 text-sm leading-relaxed text-slate-200', className)}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.indexOf('**', 2) === trimmed.length - 2) {
          return (
            <p key={i} className="font-bold text-white text-base mt-3 first:mt-0">
              {trimmed.slice(2, -2)}
            </p>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <p key={i} className="pl-3 border-l-2 border-white/10 text-slate-300">
              {renderInline(trimmed.slice(2))}
            </p>
          );
        }
        if (trimmed.startsWith('_') && trimmed.endsWith('_')) {
          return (
            <p key={i} className="text-slate-500 text-xs italic">
              {trimmed.slice(1, -1)}
            </p>
          );
        }
        return (
          <p key={i} className="text-slate-200">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
