import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Hexagon, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Transcription', path: '/transcription' },
  { name: 'Voice Lab', path: '/voice-clone' },
  { name: 'Grow', path: '/grow' },
  { name: 'Pricing', path: '/get-started#pricing' }
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
                className="w-8 h-8 text-bee-amber drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-500"
                strokeWidth={2.5}
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-white font-display">
              Ai<span className="text-bee-amber">B</span>Hive
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

              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className={cn(
                    "flex items-center text-sm font-semibold transition-all duration-300 hover:text-bee-amber outline-none",
                    (location.pathname === '/about' || location.pathname === '/faq')
                      ? "text-bee-amber"
                      : "text-slate-300"
                  )}>
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
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/about"
                            className={cn(
                              active ? 'bg-white/5 text-bee-amber' : 'text-slate-300',
                              'block px-4 py-2.5 text-sm transition-colors'
                            )}
                          >
                            About Us
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/faq"
                            className={cn(
                              active ? 'bg-white/5 text-bee-amber' : 'text-slate-300',
                              'block px-4 py-2.5 text-sm transition-colors'
                            )}
                          >
                            FAQ
                          </Link>
                        )}
                      </Menu.Item>
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
          
          <div className="md:hidden">
            {/* Mobile menu button would go here */}
          </div>
        </div>
      </div>
    </nav>
  );
}
