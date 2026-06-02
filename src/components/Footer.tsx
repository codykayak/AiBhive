import { Link } from 'react-router-dom';
import { Mail, Hexagon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bee-black border-t border-bee-amber/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center group mb-6">
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
            <p className="text-slate-400 max-w-xs">
              The world's most accurate multi-agent AI hive for transcription, translation, and voice cloning.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Agentic solutions</h3>
            <ul className="space-y-2">
              <li><Link to="/solutions/ai-lead-generation-automation" className="text-slate-400 hover:text-bee-amber transition-colors">Lead Generation</Link></li>
              <li><Link to="/solutions/ai-customer-operations-automation" className="text-slate-400 hover:text-bee-amber transition-colors">Customer Operations</Link></li>
              <li><Link to="/solutions/intelligent-document-processing-erp" className="text-slate-400 hover:text-bee-amber transition-colors">Document & ERP Sync</Link></li>
              <li><Link to="/solutions/enterprise-workflow-orchestration" className="text-slate-400 hover:text-bee-amber transition-colors">Workflow Orchestration</Link></li>
              <li><Link to="/solutions/medical-legal-multi-agent-compliance" className="text-slate-400 hover:text-bee-amber transition-colors">Medical & Legal AI</Link></li>
              <li><Link to="/solutions/real-estate-ai-automation" className="text-slate-400 hover:text-bee-amber transition-colors">Real Estate</Link></li>
              <li><Link to="/solutions/phone-systems-ai-integration" className="text-slate-400 hover:text-bee-amber transition-colors">Phone Systems</Link></li>
              <li><Link to="/book-consultation" className="text-slate-400 hover:text-bee-amber transition-colors font-medium">Book a live call</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Transcription services</h3>
            <ul className="space-y-2">
              <li><Link to="/transcription" className="text-slate-400 hover:text-bee-amber transition-colors">Transcription Studio</Link></li>
              <li><Link to="/voice-clone" className="text-slate-400 hover:text-bee-amber transition-colors">Voice Clone Lab</Link></li>
              <li><Link to="/grow" className="text-slate-400 hover:text-bee-amber transition-colors">Grow Globally</Link></li>
              <li><Link to="/get-started" className="text-slate-400 hover:text-bee-amber transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Use Cases</h3>
            <ul className="space-y-2">
              <li><Link to="/use-cases/podcasters" className="text-slate-400 hover:text-bee-amber transition-colors">For Podcasters</Link></li>
              <li><Link to="/use-cases/youtubers" className="text-slate-400 hover:text-bee-amber transition-colors">For YouTubers</Link></li>
              <li><Link to="/use-cases/legal-transcription" className="text-slate-400 hover:text-bee-amber transition-colors">Legal Transcription</Link></li>
              <li><Link to="/use-cases/medical-transcription" className="text-slate-400 hover:text-bee-amber transition-colors">Medical Transcription</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-slate-400 hover:text-bee-amber transition-colors">About</Link></li>
              <li><Link to="/faq" className="text-slate-400 hover:text-bee-amber transition-colors">FAQ</Link></li>
              <li>
                <a href="mailto:hello@aibhive.com" className="text-slate-400 hover:text-bee-amber transition-colors flex items-center">
                  <Mail className="w-4 h-4 mr-2" /> Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-bee-amber/5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} AiBHive. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-slate-500 hover:text-slate-300 text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-slate-500 hover:text-slate-300 text-sm">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
