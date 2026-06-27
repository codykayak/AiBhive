import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Hexagon, ChevronDown, Menu, X } from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import {
  SOLUTION_CATEGORIES,
  TRANSCRIPTION_SERVICES_LINKS,
  BOOK_CONSULTATION_PATH,
} from '../constants/navigation';

const aboutLinks = [
  { name: 'About Us', path: '/about' },
  { name: 'FAQ', path: '/faq' },
];

function isPathInList(pathname: string, links: readonly { path: string }[]) {
  return links.some(
    (l) => pathname === l.path || pathname.startsWith(l.path.split('#')[0] + '/')
  );
}

function isSolutionPath(pathname: string) {
  return pathname.startsWith('/solutions/');
}

function isTranscriptionPath(pathname: string) {
  return isPathInList(pathname, TRANSCRIPTION_SERVICES_LINKS);
}

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const solutionsActive = isSolutionPath(location.pathname);
  const transcriptionActive = isTranscriptionPath(location.pathname);

  return (
    <nav className="sticky top-0 z-50 bg-bee-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center group" onClick={() => setMobileOpen(false)}>
            <div className="relative flex items-center justify-center mr-3">
              <Hexagon
                className="w-8 h-8 text-bee-amber drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-500"
                strokeWidth={2.5}
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-white font-display">
              Ai<span className="text-bee-amber">B</span>Hive
            </span>
          </Link>

          <div className="hidden lg:block">
            <div className="flex items-center space-x-6 xl:space-x-8">
              <Link
                to="/"
                className={cn(
                  'text-sm font-semibold transition-all duration-300 hover:text-bee-amber',
                  location.pathname === '/' ? 'text-bee-amber' : 'text-slate-300'
                )}
              >
                Home
              </Link>

              <Link
                to="/app"
                className={cn(
                  'text-sm font-semibold transition-all duration-300 hover:text-bee-amber',
                  location.pathname.startsWith('/app') ? 'text-bee-amber' : 'text-slate-300'
                )}
              >
                App
              </Link>

              <Link
                to="/hive-apps"
                className={cn(
                  'text-sm font-semibold transition-all duration-300 hover:text-bee-amber',
                  location.pathname.startsWith('/hive-apps') ? 'text-bee-amber' : 'text-slate-300'
                )}
              >
                Hive Apps
              </Link>

              <HeadlessMenu as="div" className="relative inline-block text-left">
                <HeadlessMenu.Button
                  className={cn(
                    'flex items-center text-sm font-semibold transition-all duration-300 hover:text-bee-amber outline-none',
                    solutionsActive ? 'text-bee-amber' : 'text-slate-300'
                  )}
                >
                  Solutions
                  <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
                </HeadlessMenu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <HeadlessMenu.Items className="absolute left-0 mt-4 w-64 origin-top-left rounded-xl bg-bee-black border border-white/10 shadow-lg focus:outline-none overflow-hidden z-50">
                    <div className="py-1">
                      {SOLUTION_CATEGORIES.map((link) => (
                        <HeadlessMenu.Item key={link.path}>
                          {({ active }) => (
                            <Link
                              to={link.path}
                              className={cn(
                                active ? 'bg-white/5 text-bee-amber' : 'text-slate-300',
                                'block px-4 py-2.5 text-sm transition-colors',
                                location.pathname === link.path && 'text-bee-amber'
                              )}
                            >
                              {link.name}
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                      ))}
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>

              <HeadlessMenu as="div" className="relative inline-block text-left">
                <HeadlessMenu.Button
                  className={cn(
                    'flex items-center text-sm font-semibold transition-all duration-300 hover:text-bee-amber outline-none',
                    transcriptionActive ? 'text-bee-amber' : 'text-slate-300'
                  )}
                >
                  Transcription services
                  <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
                </HeadlessMenu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <HeadlessMenu.Items className="absolute left-0 mt-4 w-56 origin-top-left rounded-xl bg-bee-black border border-white/10 shadow-lg focus:outline-none overflow-hidden z-50">
                    <div className="py-1">
                      {TRANSCRIPTION_SERVICES_LINKS.map((link) => (
                        <HeadlessMenu.Item key={link.path}>
                          {({ active }) => (
                            <Link
                              to={link.path}
                              className={cn(
                                active ? 'bg-white/5 text-bee-amber' : 'text-slate-300',
                                'block px-4 py-2.5 text-sm transition-colors'
                              )}
                            >
                              {link.name}
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                      ))}
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>

              <HeadlessMenu as="div" className="relative inline-block text-left">
                <HeadlessMenu.Button
                  className={cn(
                    'flex items-center text-sm font-semibold transition-all duration-300 hover:text-bee-amber outline-none',
                    location.pathname === '/about' || location.pathname === '/faq'
                      ? 'text-bee-amber'
                      : 'text-slate-300'
                  )}
                >
                  About
                  <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
                </HeadlessMenu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-4 w-40 origin-top-right rounded-xl bg-bee-black border border-white/10 shadow-lg focus:outline-none overflow-hidden">
                    <div className="py-1">
                      {aboutLinks.map((link) => (
                        <HeadlessMenu.Item key={link.path}>
                          {({ active }) => (
                            <Link
                              to={link.path}
                              className={cn(
                                active ? 'bg-white/5 text-bee-amber' : 'text-slate-300',
                                'block px-4 py-2.5 text-sm transition-colors'
                              )}
                            >
                              {link.name}
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                      ))}
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>

              <Link
                to={BOOK_CONSULTATION_PATH}
                className="px-5 py-2.5 bg-bee-amber text-bee-black font-bold rounded-full hover:bg-bee-yellow transition-all neon-glow text-sm whitespace-nowrap"
              >
                Book a call
              </Link>
            </div>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-6 border-t border-white/5 mt-2 pt-4 space-y-1 max-h-[80vh] overflow-y-auto">
            <Link
              to="/"
              className="block px-3 py-2.5 text-slate-300 hover:text-bee-amber font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/app"
              className="block px-3 py-2.5 text-slate-300 hover:text-bee-amber font-medium"
              onClick={() => setMobileOpen(false)}
            >
              App
            </Link>
            <Link
              to="/hive-apps"
              className="block px-3 py-2.5 text-slate-300 hover:text-bee-amber font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Hive Apps
            </Link>
            <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Solutions
            </p>
            {SOLUTION_CATEGORIES.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-5 py-2 text-slate-400 hover:text-bee-amber text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Transcription services
            </p>
            {TRANSCRIPTION_SERVICES_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-5 py-2 text-slate-400 hover:text-bee-amber text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              About
            </p>
            {aboutLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-5 py-2 text-slate-400 hover:text-bee-amber text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to={BOOK_CONSULTATION_PATH}
              className="block mx-3 mt-4 py-3 text-center bg-bee-amber text-bee-black font-bold rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Book a live call
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
