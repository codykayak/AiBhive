import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import TranscriptionStudio from './pages/TranscriptionStudio';
import VoiceCloneLab from './pages/VoiceCloneLab';
import GrowGlobally from './pages/GrowGlobally';
import AboutContact from './pages/AboutContact';
import GetStarted from './pages/GetStarted';
import { SEO } from './components/SEO';
import FAQChatbot from './components/FAQChatbot';

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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transcription" element={<TranscriptionStudio />} />
            <Route path="/voice-clone" element={<VoiceCloneLab />} />
            <Route path="/grow" element={<GrowGlobally />} />
            <Route path="/about" element={<AboutContact />} />
            <Route path="/get-started" element={<GetStarted />} />
          </Routes>
        </main>
        <footer className="relative z-10">
          <Footer />
        </footer>
      </div>
    </Router>
  );
}
