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
          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white'
      } ${className}`}
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      title={light ? 'Dark mode' : 'Light mode'}
    >
      {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      <span className="hidden sm:inline">{light ? 'Dark' : 'Light'}</span>
    </button>
  );
}
