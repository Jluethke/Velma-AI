import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VelmaWidget from './components/VelmaWidget';
import { VelmaProvider } from './contexts/VelmaContext';

// Static imports (needed on every page load)
import Landing from './pages/Landing';
import OnboardingGuide from './components/OnboardingGuide';

// Lazy-loaded pages
const Docs = lazy(() => import('./pages/Docs'));
const Whitepaper = lazy(() => import('./pages/Whitepaper'));
const Pricing = lazy(() => import('./pages/Pricing'));
const GettingStarted = lazy(() => import('./pages/GettingStarted'));
const Explore = lazy(() => import('./pages/Explore'));
const Chains = lazy(() => import('./pages/Chains'));
const FlowDetail = lazy(() => import('./pages/FlowDetail'));
const Install = lazy(() => import('./pages/Install'));
const Memory = lazy(() => import('./pages/Memory'));
const Bounties = lazy(() => import('./pages/Bounties'));
const Activity = lazy(() => import('./pages/Activity'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Fabric = lazy(() => import('./pages/Fabric'));
const FabricStart = lazy(() => import('./pages/FabricStart'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Settings = lazy(() => import('./pages/Settings'));
const Discovery = lazy(() => import('./pages/Discovery'));
const DiscoveryNew = lazy(() => import('./pages/DiscoveryNew'));
const DiscoveryMatches = lazy(() => import('./pages/DiscoveryMatches'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Agents = lazy(() => import('./pages/Agents'));
const Portal = lazy(() => import('./pages/Portal'));
const PortalTrainer = lazy(() => import('./pages/PortalTrainer'));
const PortalAchievements = lazy(() => import('./pages/PortalAchievements'));
const PortalSkilldex = lazy(() => import('./pages/PortalSkilldex'));
const PortalSkills = lazy(() => import('./pages/PortalSkills'));
const PortalNetwork = lazy(() => import('./pages/PortalNetwork'));
const PortalStake = lazy(() => import('./pages/PortalStake'));
const PortalMarketplace = lazy(() => import('./pages/PortalMarketplace'));
const PortalValidators = lazy(() => import('./pages/PortalValidators'));
const Studio = lazy(() => import('./pages/Studio'));
const FabricRecord = lazy(() => import('./pages/FabricRecord'));


function PageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '6rem 1.5rem 0' }}>
        <div style={{ height: '2rem', width: '16rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', marginBottom: '1rem' }} />
        <div style={{ height: '1rem', width: '24rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }} />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <VelmaProvider>
        <Navbar />
        {/* page-wrap clips horizontal overflow without touching fixed Navbar/Banner */}
        <div style={{ overflowX: 'hidden', width: '100%', position: 'relative' }}>
          <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/whitepaper" element={<Whitepaper />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/get-started" element={<GettingStarted />} />

            {/* Content */}
            <Route path="/flows" element={<Explore />} />
            <Route path="/skills" element={<Explore />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/chains" element={<Chains />} />
            <Route path="/flow/:name" element={<FlowDetail />} />
            <Route path="/skill/:name" element={<FlowDetail />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/install" element={<Install />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/bounties" element={<Bounties />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Fabric — multiplayer flow sessions */}
            <Route path="/start" element={<FabricStart />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/fabric/:sessionId" element={<Fabric />} />
            <Route path="/record/:sessionId" element={<FabricRecord />} />

            {/* Discovery — AI-powered counterpart matching */}
            <Route path="/discover" element={<Discovery />} />
            <Route path="/discover/new" element={<DiscoveryNew />} />
            <Route path="/discover/matches" element={<DiscoveryMatches />} />

            {/* User — dashboard, profile, agents */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/agents" element={<Agents />} />

            {/* Portal — on-chain stats and gamification */}
            <Route path="/portal" element={<Portal />} />
            <Route path="/portal/trainer" element={<PortalTrainer />} />
            <Route path="/portal/achievements" element={<PortalAchievements />} />
            <Route path="/portal/skilldex" element={<PortalSkilldex />} />
            <Route path="/portal/skills" element={<PortalSkills />} />
            <Route path="/portal/network" element={<PortalNetwork />} />
            <Route path="/portal/stake" element={<PortalStake />} />
            <Route path="/portal/marketplace" element={<PortalMarketplace />} />
            <Route path="/portal/validators" element={<PortalValidators />} />
          </Routes>
          </Suspense>
          <Footer />
        </div>
        <OnboardingGuide />
        <VelmaWidget />
      </VelmaProvider>
    </BrowserRouter>
  );
}

export default App;
