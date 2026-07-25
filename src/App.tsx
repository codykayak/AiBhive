import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeAssistantWeb from './components/HomeAssistantWeb';
import SiteAnalyticsBeacon from './components/SiteAnalyticsBeacon';
import SiteGuideTour from './components/SiteGuideTour';
import { AssistantDockProvider } from './context/AssistantDockContext';
import ScrollToTop from './components/ScrollToTop';
import AppLayout, { AppRedirect } from './pages/app/AppLayout';
import { isPlantsMobileApp } from './lib/oregonPlantMedicine/plantsMobileShell';

const Home = lazy(() => import('./pages/Home'));
const TranscriptionStudio = lazy(() => import('./pages/TranscriptionStudio'));
const VoiceCloneLab = lazy(() => import('./pages/VoiceCloneLab'));
const OcrLab = lazy(() => import('./pages/ocr-lab/OcrLab'));
const FableScrape = lazy(() => import('./pages/fable-scrape/FableScrape'));
const FableScrapeGuide = lazy(() => import('./pages/fable-scrape/FableScrapeGuide'));
const GrowGlobally = lazy(() => import('./pages/GrowGlobally'));
const AboutContact = lazy(() => import('./pages/AboutContact'));
const GetStarted = lazy(() => import('./pages/GetStarted'));
const FAQ = lazy(() => import('./pages/FAQ'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProsLanding = lazy(() => import('./pages/ProsLanding'));
const ProsTradePage = lazy(() => import('./pages/ProsTradePage'));
const ProsDashboard = lazy(() => import('./pages/ProsDashboard'));
const Homework = lazy(() => import('./pages/Homework'));
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
const FieldServiceAi = lazy(() => import('./pages/solutions/FieldServiceAi'));
const BookConsultation = lazy(() => import('./pages/BookConsultation'));
const ResearchPage = lazy(() => import('./pages/app/ResearchPage'));
const AppHub = lazy(() => import('./pages/app/AppHub'));
const AppTopicPage = lazy(() => import('./pages/app/AppTopicPage'));
const WebSettingsPage = lazy(() => import('./pages/app/WebSettingsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ToolsHubPage = lazy(() => import('./pages/tools/ToolsHubPage'));
const RealEstateAiToolsPage = lazy(() => import('./pages/tools/RealEstateAiToolsPage'));
const HiveAppsLayout = lazy(() => import('./pages/hive-apps/HiveAppsLayout'));
const HiveAppsBrowse = lazy(() => import('./pages/hive-apps/HiveAppsBrowse'));
const HiveAppDetailPage = lazy(() => import('./pages/hive-apps/HiveAppDetailPage'));
const HiveAppRunPage = lazy(() => import('./pages/hive-apps/HiveAppRunPage'));
const HiveAppEmbedPage = lazy(() => import('./pages/hive-apps/HiveAppEmbedPage'));
const HiveAppsBuildPage = lazy(() => import('./pages/hive-apps/HiveAppsBuildPage'));
const OldWorldResearchRedirect = lazy(() => import('./pages/research-lab/OldWorldResearchRedirect'));
const PlantsPage = lazy(() => import('./pages/plants/PlantsPage'));
const HolisticRemediesPage = lazy(() => import('./pages/plants/HolisticRemediesPage'));
const HypnosisEnergyPage = lazy(() => import('./pages/plants/HypnosisEnergyPage'));
const AnimalHealthPage = lazy(() => import('./pages/plants/AnimalHealthPage'));
const HerbsPage = lazy(() => import('./pages/plants/HerbsPage'));
const SupplementsPage = lazy(() => import('./pages/plants/SupplementsPage'));
const ResearchLabLandingPage = lazy(() => import('./pages/research-lab/ResearchLabLandingPage'));
const DmtMatrixDecoderPage = lazy(() => import('./pages/research-lab/DmtMatrixDecoderPage'));
const DmtMatrixLibraryPage = lazy(() => import('./pages/research-lab/DmtMatrixLibraryPage'));
const ResearchLabWorkspacePage = lazy(() => import('./pages/research-lab/ResearchLabWorkspacePage'));
const ResearchLabCategoryPage = lazy(() => import('./pages/research-lab/ResearchLabCategoryPage'));
const CommunalLibraryPage = lazy(() => import('./pages/research-lab/CommunalLibraryPage'));
const CommunalArchiveTopicPage = lazy(() => import('./pages/research-lab/CommunalArchiveTopicPage'));
const DiagnoseWebLanding = lazy(() => import('./pages/diagnose-web/DiagnoseWebLanding'));
const DiagnoseWebLayout = lazy(() => import('./pages/diagnose-web/DiagnoseWebLayout'));
const DiagnoseWebHome = lazy(() => import('./pages/diagnose-web/DiagnoseWebHome'));
const DiagnoseWebChat = lazy(() => import('./pages/diagnose-web/DiagnoseWebChat'));
const DiagnoseWebPacks = lazy(() => import('./pages/diagnose-web/DiagnoseWebPacks'));
const DiagnoseWebPackDetail = lazy(() => import('./pages/diagnose-web/DiagnoseWebPackDetail'));
const DiagnoseWebJobs = lazy(() => import('./pages/diagnose-web/DiagnoseWebJobs'));
const DiagnoseWebTools = lazy(() => import('./pages/diagnose-web/DiagnoseWebTools'));
const DiagnoseWebLibrary = lazy(() => import('./pages/diagnose-web/DiagnoseWebLibrary'));
const DiagnoseWebCodes = lazy(() => import('./pages/diagnose-web/DiagnoseWebCodes'));
const DiagnoseWebSafety = lazy(() => import('./pages/diagnose-web/DiagnoseWebSafety'));
const DiagnoseWebGuidedList = lazy(() => import('./pages/diagnose-web/DiagnoseWebGuided'));
const DiagnoseWebGuidedPlayer = lazy(() => import('./pages/diagnose-web/DiagnoseWebGuidedPlayer'));
const DiagnoseWebFault = lazy(() => import('./pages/diagnose-web/DiagnoseWebFault'));
const DiagnoseWebAccount = lazy(() => import('./pages/diagnose-web/DiagnoseWebAccount'));
const DiagnoseWebPoolChem = lazy(() => import('./pages/diagnose-web/charts/DiagnoseWebPoolChem'));
const DiagnoseWebWireChart = lazy(() => import('./pages/diagnose-web/charts/DiagnoseWebWireChart'));
const DiagnoseWebPipeChart = lazy(() => import('./pages/diagnose-web/charts/DiagnoseWebPipeChart'));
const DiagnoseWebHvacChart = lazy(() => import('./pages/diagnose-web/charts/DiagnoseWebHvacChart'));
const DiagnoseWebFiberChart = lazy(() => import('./pages/diagnose-web/charts/DiagnoseWebFiberChart'));

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
            <Route path="/fable-scrape" element={<FableScrape />} />
            <Route path="/fable-scrape/guide" element={<FableScrapeGuide />} />
            <Route path="/grow" element={<GrowGlobally />} />
            <Route path="/about" element={<AboutContact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/tools" element={<ToolsHubPage />} />
            <Route path="/tools/real-estate-ai" element={<RealEstateAiToolsPage />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/pros" element={<ProsLanding />} />
            <Route path="/pros/:tradeSlug" element={<ProsTradePage />} />
            <Route path="/diagnose" element={<DiagnoseWebLanding />} />
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
            <Route path="/solutions/field-service-ai" element={<FieldServiceAi />} />
            <Route path="/book-consultation" element={<BookConsultation />} />
            <Route path="/intel-gathering" element={<AppRedirect to="/app/research" />} />
            <Route path="/research" element={<AppRedirect to="/app/research" />} />
            <Route path="/app/build" element={<AppRedirect to="/hive-apps/build" />} />
            <Route path="/app/apps" element={<AppRedirect to="/hive-apps" />} />
            <Route path="/app/jobs" element={<AppRedirect to="/hive-apps/run/example-job-hunter" />} />
            <Route path="/app/job-hunter" element={<AppRedirect to="/hive-apps/run/example-job-hunter" />} />
            <Route path="/app/social-hunter" element={<AppRedirect to="/hive-apps/run/example-social-post-hunter" />} />
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
            <Route path="/research-lab" element={<ResearchLabLandingPage />} />
            <Route path="/research-lab/dmt-matrix-decoder" element={<DmtMatrixDecoderPage />} />
            <Route path="/research-lab/dmt-matrix-library" element={<DmtMatrixLibraryPage />} />
            <Route path="/research-lab/dmt-matrix-library/:entryId" element={<DmtMatrixLibraryPage />} />
            <Route path="/research-lab/workspace" element={<ResearchLabWorkspacePage />} />
            <Route path="/research-lab/communal-library" element={<CommunalLibraryPage />} />
            <Route
              path="/research-lab/communal-library/:topicId"
              element={<CommunalArchiveTopicPage />}
            />
            <Route
              path="/research-lab/historical-ancient"
              element={<ResearchLabCategoryPage categoryId="historical-ancient" />}
            />
            <Route
              path="/research-lab/medical-holistic"
              element={<ResearchLabCategoryPage categoryId="medical-holistic" />}
            />
            <Route
              path="/research-lab/legal-findings"
              element={<ResearchLabCategoryPage categoryId="legal-findings" />}
            />
            <Route
              path="/research-lab/academia-scholarly"
              element={<ResearchLabCategoryPage categoryId="academia-scholarly" />}
            />
            <Route path="/old-world-research" element={<OldWorldResearchRedirect />} />
            <Route path="/old-world-research/*" element={<OldWorldResearchRedirect />} />
            <Route path="/plants/holistic-remedies-and-protocols" element={<HolisticRemediesPage />} />
            <Route path="/plants/hypnosis-and-energy" element={<HypnosisEnergyPage />} />
            <Route path="/plants/animal-health" element={<AnimalHealthPage />} />
            <Route path="/plants/herbs" element={<HerbsPage />} />
            <Route path="/plants/supplements" element={<SupplementsPage />} />
            <Route path="/plants" element={<PlantsPage />} />
            <Route path="/hive-apps/run/example-old-tartar-research" element={<AppRedirect to="/research-lab" />} />
            <Route
              path="/hive-apps/run/example-oregon-plant-medicine"
              element={<AppRedirect to="/plants" />}
            />
            <Route path="/hive-apps" element={<HiveAppsLayout />}>
              <Route index element={<HiveAppsBrowse />} />
              <Route path="app/:appId" element={<HiveAppDetailPage />} />
              <Route path="run/:appId" element={<HiveAppRunPage />} />
              <Route path="embed/:appId" element={<HiveAppEmbedPage />} />
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
  const isProsAdminRoute = pathname.startsWith('/pros/app');
  const isProsPublicRoute = pathname.startsWith('/pros') && !pathname.startsWith('/pros/app');
  const isDiagnosePublicRoute = pathname === '/diagnose';
  const isHomeworkRoute = pathname.startsWith('/homework');
  const isDiagnoseAppRoute = pathname.startsWith('/diagnose/app');
  const isPrivateRoute = isAdminRoute || isProsAdminRoute || isHomeworkRoute || isDiagnoseAppRoute;
  const isEmbedRoute = pathname.startsWith('/hive-apps/embed');
  const isPlantsMobileShell = pathname.startsWith('/plants') && isPlantsMobileApp();
  const hideSiteAssistant = pathname.startsWith('/plants');
  const hideFooter =
    pathname.startsWith('/app/research') ||
    pathname.startsWith('/research-lab/workspace') ||
    pathname.startsWith('/plants') ||
    pathname.startsWith('/hive-apps/run') ||
    pathname.startsWith('/hive-apps/embed') ||
    pathname.startsWith('/hive-apps/build') ||
    pathname.startsWith('/diagnose/app');

  return (
    <AssistantDockProvider>
      <div className="min-h-screen flex flex-col honeycomb-pattern selection:bg-bee-amber selection:text-bee-black">
        {!isPrivateRoute && !isEmbedRoute && !isProsPublicRoute && !isDiagnosePublicRoute && !isPlantsMobileShell && (
          <header className="fixed top-0 left-0 right-0 z-50">
            <Navbar />
          </header>
        )}
        {!isPrivateRoute && !isEmbedRoute && !hideSiteAssistant && !isPlantsMobileShell && <HomeAssistantWeb />}
        {!isPrivateRoute && !isEmbedRoute && <SiteAnalyticsBeacon />}
        {!isPrivateRoute && !isEmbedRoute && pathname.startsWith('/app') && <SiteGuideTour />}
        <main
          className={`flex-grow ${isEmbedRoute || isProsPublicRoute || isDiagnosePublicRoute || isPlantsMobileShell ? '' : 'pt-20'} ${hideFooter ? 'pb-4' : ''}`}
        >
          {isPrivateRoute ? (
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/pros/app" element={<ProsDashboard />} />
                <Route path="/homework" element={<Homework />} />
                <Route path="/diagnose/app" element={<DiagnoseWebLayout />}>
                  <Route index element={<DiagnoseWebHome />} />
                  <Route path="chat" element={<DiagnoseWebChat />} />
                  <Route path="packs" element={<DiagnoseWebPacks />} />
                  <Route path="packs/:packId" element={<DiagnoseWebPackDetail />} />
                  <Route path="jobs" element={<DiagnoseWebJobs />} />
                  <Route path="tools" element={<DiagnoseWebTools />} />
                  <Route path="tools/library" element={<DiagnoseWebLibrary />} />
                  <Route path="tools/codes" element={<DiagnoseWebCodes />} />
                  <Route path="tools/safety" element={<DiagnoseWebSafety />} />
                  <Route path="tools/chemistry" element={<DiagnoseWebPoolChem />} />
                  <Route path="tools/wire" element={<DiagnoseWebWireChart />} />
                  <Route path="tools/pipe" element={<DiagnoseWebPipeChart />} />
                  <Route path="tools/hvac" element={<DiagnoseWebHvacChart />} />
                  <Route path="tools/fiber" element={<DiagnoseWebFiberChart />} />
                  <Route path="guided" element={<DiagnoseWebGuidedList />} />
                  <Route path="guided/:flowId" element={<DiagnoseWebGuidedPlayer />} />
                  <Route path="fault/:faultId" element={<DiagnoseWebFault />} />
                  <Route path="account" element={<DiagnoseWebAccount />} />
                </Route>
              </Routes>
            </Suspense>
          ) : (
            <AnimatedRoutes />
          )}
        </main>
        {!isPrivateRoute && !hideFooter && (
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
      <ScrollToTop />
      <AppShell />
    </Router>
  );
}
