import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Hexagon } from 'lucide-react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Transcription', path: '/transcription' },
  { name: 'Voice Lab', path: '/voice-clone' },
  { name: 'Grow', path: '/grow' },
  { name: 'About', path: '/about' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-bee-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center group">
            <div className="relative flex items-center justify-center mr-3">
              <Hexagon 
                className="w-10 h-10 text-bee-amber drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-500" 
                strokeWidth={2.5}
              />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white font-display">
              Ai<span className="text-bee-amber">Bhive</span>
            </span>
          </Link>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-bee-amber relative group",
                    location.pathname === link.path
                      ? "text-bee-amber"
                      : "text-slate-300"
                  )}
                >
                  {link.name}
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-bee-amber transition-all duration-300 group-hover:w-full",
                    location.pathname === link.path && "w-full"
                  )} />
                </Link>
              ))}
              <Link 
                to="/get-started" 
                className="px-6 py-2.5 bg-bee-amber text-bee-black font-bold rounded-full hover:bg-bee-yellow transition-all neon-glow text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
          
          <div className="md:hidden">
            {/* Mobile menu button would go here */}
          </div>
        </div>
      </div>
    </nav>
  );
}
