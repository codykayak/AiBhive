import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { SEO } from './components/SEO';
import HomeAssistantWeb from './components/HomeAssistantWeb';
import SiteGuideTour from './components/SiteGuideTour';
import { AssistantDockProvider } from './context/AssistantDockContext';
import AppLayout, { AppRedirect } from './pages/app/AppLayout';

const Home = lazy(() => import('./pages/Home'));
const TranscriptionStudio = lazy(() => import('./pages/TranscriptionStudio'));
const VoiceCloneLab = lazy(() => import('./pages/VoiceCloneLab'));
const OcrLab = lazy(() => import('./pages/ocr-lab/OcrLab'));
const GrowGlobally = lazy(() => import('./pages/GrowGlobally'));
const AboutContact = lazy(() => import('./pages/AboutContact'));
const GetStarted = lazy(() => import('./pages/GetStarted'));
const FAQ = lazy(() => import('./pages/FAQ'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TestGetStarted = lazy(() => import('./pages/TestGetStarted'));
const Podcasters = lazy(() => import('./pages/use-cases/Podcasters'));
const YouTubers = lazy(() => import('./pages/use-cases/YouTubers'));
const LegalTranscription = lazy(() => import('./pages/use-cases/LegalTranscription'));
const MedicalTranscription = lazy(() => import('./pages/use-cases/MedicalTranscription'));
const LeadGenerationAutomation = lazy(() => import('./pages/solutions/LeadGenerationAutomation'));
const CustomerOperationsAutomation = lazy(() => import('./pages/solutions/CustomerOperationsAutomation'));
const DocumentProcessingErp = lazy(() => import('./pages/solutions/DocumentProcessingErp'));
const WorkflowOrchestration = lazy(() => import('./pages/solutions/WorkflowOrchestration'));
const MedicalLegalMultiAgent = lazy(() => import('./pages/solutions/MedicalLegalMultiAgent'));
const RealEstateSolutions = lazy(() => import('./pages/solutions/RealEstateSolutions'));
const PhoneSystemsIntegration = lazy(() => import('./pages/solutions/PhoneSystemsIntegration'));
const BookConsultation = lazy(() => import('./pages/BookConsultation'));
const ResearchPage = lazy(() => import('./pages/app/ResearchPage'));
const AppHub = lazy(() => import('./pages/app/AppHub'));
const AppTopicPage = lazy(() => import('./pages/app/AppTopicPage'));
const WebSettingsPage = lazy(() => import('./pages/app/WebSettingsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const HiveAppsLayout = lazy(() => import('./pages/hive-apps/HiveAppsLayout'));
const HiveAppsBrowse = lazy(() => import('./pages/hive-apps/HiveAppsBrowse'));
const HiveAppDetailPage = lazy(() => import('./pages/hive-apps/HiveAppDetailPage'));
const HiveAppRunPage = lazy(() => import('./pages/hive-apps/HiveAppRunPage'));
const HiveAppsBuildPage = lazy(() => import('./pages/hive-apps/HiveAppsBuildPage'));

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
      Loading…
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/transcription" element={<TranscriptionStudio />} />
            <Route path="/voice-clone" element={<VoiceCloneLab />} />
            <Route path="/ocr-lab" element={<OcrLab />} />
            <Route path="/grow" element={<GrowGlobally />} />
            <Route path="/about" element={<AboutContact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/test" element={<TestGetStarted />} />
            <Route path="/use-cases/podcasters" element={<Podcasters />} />
            <Route path="/use-cases/youtubers" element={<YouTubers />} />
            <Route path="/use-cases/legal-transcription" element={<LegalTranscription />} />
            <Route path="/use-cases/medical-transcription" element={<MedicalTranscription />} />
            <Route path="/solutions/ai-lead-generation-automation" element={<LeadGenerationAutomation />} />
            <Route path="/solutions/ai-customer-operations-automation" element={<CustomerOperationsAutomation />} />
            <Route path="/solutions/intelligent-document-processing-erp" element={<DocumentProcessingErp />} />
            <Route path="/solutions/enterprise-workflow-orchestration" element={<WorkflowOrchestration />} />
            <Route path="/solutions/medical-legal-multi-agent-compliance" element={<MedicalLegalMultiAgent />} />
            <Route path="/solutions/real-estate-ai-automation" element={<RealEstateSolutions />} />
            <Route path="/solutions/phone-systems-ai-integration" element={<PhoneSystemsIntegration />} />
            <Route path="/book-consultation" element={<BookConsultation />} />
            <Route path="/intel-gathering" element={<AppRedirect to="/app/research" />} />
            <Route path="/research" element={<AppRedirect to="/app/research" />} />
            <Route path="/app/build" element={<AppRedirect to="/hive-apps/build" />} />
            <Route path="/app/apps" element={<AppRedirect to="/hive-apps" />} />
            <Route path="/app/jobs" element={<AppRedirect to="/hive-apps/run/example-job-tracker" />} />
            <Route path="/app/mock-realestate" element={<AppRedirect to="/hive-apps/run/example-mock-realestate" />} />
            <Route path="/app/admin" element={<AppRedirect to="/admin" />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<AppHub />} />
              <Route path="automated-social-media" element={<AppTopicPage />} />
              <Route path="phone-intelligence" element={<AppTopicPage />} />
              <Route path="lead-generation" element={<AppTopicPage />} />
              <Route path="productivity" element={<AppTopicPage />} />
              <Route path="research" element={<ResearchPage />} />
              <Route path="settings" element={<WebSettingsPage />} />
            </Route>
            <Route path="/hive-apps" element={<HiveAppsLayout />}>
              <Route index element={<HiveAppsBrowse />} />
              <Route path="app/:appId" element={<HiveAppDetailPage />} />
              <Route path="run/:appId" element={<HiveAppRunPage />} />
              <Route path="build" element={<HiveAppsBuildPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  const hideFooter =
    pathname.startsWith('/app/research') ||
    pathname.startsWith('/hive-apps/run') ||
    pathname.startsWith('/hive-apps/build');

  return (
    <AssistantDockProvider>
      <div className="min-h-screen flex flex-col honeycomb-pattern selection:bg-bee-amber selection:text-bee-black">
        <SEO />
        <header className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </header>
        {!isAdminRoute && <HomeAssistantWeb />}
        {!isAdminRoute && pathname.startsWith('/app') && <SiteGuideTour />}
        <main className={`flex-grow pt-20 ${hideFooter ? 'pb-4' : ''}`}>
          {isAdminRoute ? (
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
          ) : (
            <AnimatedRoutes />
          )}
        </main>
        {!isAdminRoute && !hideFooter && (
          <footer className="relative z-10">
            <Footer />
          </footer>
        )}
      </div>
    </AssistantDockProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
