import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import TranscriptionStudio from './pages/TranscriptionStudio';
import VoiceCloneLab from './pages/VoiceCloneLab';
import GrowGlobally from './pages/GrowGlobally';
import AboutContact from './pages/AboutContact';
import GetStarted from './pages/GetStarted';
import FAQ from './pages/FAQ';
import TestGetStarted from './pages/TestGetStarted';
import AdminDashboard from './pages/AdminDashboard';
import { SEO } from './components/SEO';
import FAQChatbot from './components/FAQChatbot';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/transcription" element={<TranscriptionStudio />} />
          <Route path="/voice-clone" element={<VoiceCloneLab />} />
          <Route path="/grow" element={<GrowGlobally />} />
          <Route path="/about" element={<AboutContact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/test" element={<TestGetStarted />} />
          <Route path="/admin" element={<AdminDashboard />} />
                                                </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col honeycomb-pattern selection:bg-bee-amber selection:text-bee-black">
        <SEO />
        <header className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </header>
        <FAQChatbot />
        <main className="flex-grow pt-20">
          <AnimatedRoutes />
        </main>
        <footer className="relative z-10">
          <Footer />
        </footer>
      </div>
    </Router>
  );
}
