import { useEffect, Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Hexagon, ChevronDown, Menu as MenuIcon, X } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Transcription', path: '/transcription' },
  { name: 'Voice Lab', path: '/voice-clone' },
  { name: 'Grow', path: '/grow' },
  { name: 'Pricing', path: '/get-started#pricing' },
];

const aboutLinks = [
  { name: 'About Us', path: '/about' },
  { name: 'FAQ', path: '/faq' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-bee-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center group">
            <div className="relative flex items-center justify-center mr-3">
              <Hexagon
                className="w-8 h-8 text-bee-amber drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-500"
                strokeWidth={2.5}
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-white font-display">
              Ai<span className="text-bee-amber">Bhive</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'text-sm font-semibold transition-all duration-300 hover:text-bee-amber relative group',
                    location.pathname === link.path ? 'text-bee-amber' : 'text-slate-300',
                  )}
                >
                  {link.name}
                  <span
                    className={cn(
                      'absolute -bottom-1 left-0 w-0 h-0.5 bg-bee-amber transition-all duration-300 group-hover:w-full',
                      location.pathname === link.path && 'w-full',
                    )}
                  />
                </Link>
              ))}

              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button
                    className={cn(
                      'flex items-center text-sm font-semibold transition-all duration-300 hover:text-bee-amber outline-none',
                      location.pathname === '/about' || location.pathname === '/faq'
                        ? 'text-bee-amber'
                        : 'text-slate-300',
                    )}
                  >
                    About
                    <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-4 w-40 origin-top-right rounded-xl bg-bee-black border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                    <div className="py-1">
                      {aboutLinks.map((al) => (
                        <Menu.Item key={al.path}>
                          {({ active }) => (
                            <Link
                              to={al.path}
                              className={cn(
                                active ? 'bg-white/5 text-bee-amber' : 'text-slate-300',
                                'block px-4 py-2.5 text-sm transition-colors',
                              )}
                            >
                              {al.name}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <Link
                to="/get-started"
                className="px-6 py-2.5 bg-bee-amber text-bee-black font-bold rounded-full hover:bg-bee-yellow transition-all neon-glow text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/5 text-bee-amber hover:bg-bee-amber/10 hover:border-bee-amber/40 transition-colors outline-none focus:ring-2 focus:ring-bee-amber/40"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" strokeWidth={2.5} />
              ) : (
                <MenuIcon className="w-5 h-5" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-white/5 bg-bee-black/95 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-base font-semibold transition-colors',
                    location.pathname === link.path
                      ? 'bg-bee-amber/10 text-bee-amber'
                      : 'text-slate-200 hover:bg-white/5 hover:text-bee-amber',
                  )}
                >
                  {link.name}
                </Link>
              ))}

              <div className="px-4 pt-5 pb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                About
              </div>
              {aboutLinks.map((al) => (
                <Link
                  key={al.path}
                  to={al.path}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-base font-semibold transition-colors',
                    location.pathname === al.path
                      ? 'bg-bee-amber/10 text-bee-amber'
                      : 'text-slate-200 hover:bg-white/5 hover:text-bee-amber',
                  )}
                >
                  {al.name}
                </Link>
              ))}

              <div className="pt-6">
                <Link
                  to="/get-started"
                  className="block text-center px-6 py-4 bg-bee-amber text-bee-black font-extrabold rounded-full hover:bg-bee-yellow transition-all neon-glow"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
