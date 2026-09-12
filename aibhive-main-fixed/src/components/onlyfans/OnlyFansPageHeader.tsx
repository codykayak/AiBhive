import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign } from 'lucide-react';

export default function OnlyFansPageHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/onlyfans" className="font-black text-lg tracking-tight text-white">
          AiB<span className="text-pink-400">hive</span>{' '}
          <span className="font-bold text-sm text-pink-200/80">Creator Chat</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/onlyfans/admin"
            className="text-sm hidden sm:inline text-slate-400 hover:text-white font-semibold"
          >
            Creator login
          </Link>
          <Link to="/" className="text-sm hidden md:inline text-slate-500 hover:text-white">
            AiBhive home
          </Link>
          <Link
            to="/book-consultation"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white font-bold text-sm px-4 py-2.5 shadow-lg shadow-pink-500/25"
          >
            <DollarSign className="w-4 h-4" />
            Get early access
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
