import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const WORKSPACE_PATH = '/research-lab/workspace';

type Props = {
  className?: string;
  size?: 'md' | 'lg';
};

export default function StartResearchingButton({ className = '', size = 'lg' }: Props) {
  const sizeClass =
    size === 'lg'
      ? 'px-8 py-4 text-base sm:text-lg'
      : 'px-6 py-3 text-sm sm:text-base';

  return (
    <Link
      to={WORKSPACE_PATH}
      className={`inline-flex items-center justify-center gap-2 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors neon-glow ${sizeClass} ${className}`}
    >
      Start Researching
      <ArrowRight className="w-5 h-5" aria-hidden />
    </Link>
  );
}

export { WORKSPACE_PATH };
