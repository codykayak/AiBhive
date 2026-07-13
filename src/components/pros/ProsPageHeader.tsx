import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type ProsPageHeaderProps = {
  variant?: 'light' | 'dark';
  transparent?: boolean;
};

export default function ProsPageHeader({ variant = 'light', transparent = false }: ProsPageHeaderProps) {
  const isDark = variant === 'dark';

  return (
    <header
      className={`${transparent ? 'absolute top-0 left-0 right-0' : 'sticky top-0'} z-50 border-b ${
        transparent
          ? 'border-transparent bg-transparent'
          : isDark
            ? 'border-white/10 bg-slate-900/80 backdrop-blur-xl'
            : 'border-slate-200/80 bg-white/80 backdrop-blur-xl'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/pros" className={`font-black text-lg tracking-tight ${isDark ? 'text-white' : ''}`}>
          AiB<span className="text-[#F5A623]">hive</span>{' '}
          <span className={`font-bold text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pros</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`text-sm hidden sm:inline ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            AiBhive home
          </Link>
          <Link
            to="/pros/app"
            className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold text-sm px-4 py-2.5"
          >
            Open admin <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
