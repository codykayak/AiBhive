import { Moon, Sun } from 'lucide-react';
import { useLivingKnowledgeTheme } from './LivingKnowledgeThemeContext';

type Props = {
  className?: string;
};

export default function LivingKnowledgeThemeToggle({ className = '' }: Props) {
  const { theme, toggleTheme } = useLivingKnowledgeTheme();
  const light = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors ${
        light
          ? 'border-emerald-600/30 bg-white/80 text-emerald-800 hover:bg-white'
          : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-200'
      } ${className}`}
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      title={light ? 'Dark mode' : 'Light mode'}
    >
      {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      <span className="hidden sm:inline">{light ? 'Dark' : 'Light'}</span>
    </button>
  );
}
