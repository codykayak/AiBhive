import { Link } from 'react-router-dom';
import { Mail, Hexagon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bee-black border-t border-bee-amber/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center group mb-6">
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
            <p className="text-slate-400 max-w-xs">
              The world's most accurate multi-agent AI hive for transcription, translation, and voice cloning.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/transcription" className="text-slate-400 hover:text-bee-amber transition-colors">Transcription Studio</Link></li>
              <li><Link to="/voice-clone" className="text-slate-400 hover:text-bee-amber transition-colors">Voice Clone Lab</Link></li>
              <li><Link to="/grow" className="text-slate-400 hover:text-bee-amber transition-colors">Grow Globally</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-bee-amber transition-colors">About & Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-bee-amber transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-bee-amber/5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} AiBhive. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-slate-500 hover:text-slate-300 text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-slate-500 hover:text-slate-300 text-sm">Terms of Service</Link>
            <Link to="/admin" className="text-slate-500 hover:text-slate-300 text-sm">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
