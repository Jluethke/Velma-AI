import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VelmaWidget from './components/VelmaWidget';
import { VelmaProvider } from './contexts/VelmaContext';

// Public pages (no auth)
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import Whitepaper from './pages/Whitepaper';
import Pricing from './pages/Pricing';
import GettingStarted from './pages/GettingStarted';

// Content pages
import Explore from './pages/Explore';
import Chains from './pages/Chains';
import FlowDetail from './pages/FlowDetail';
import ChainComposer from './pages/ChainComposer';
import Install from './pages/Install';
import Memory from './pages/Memory';
import Bounties from './pages/Bounties';
import Activity from './pages/Activity';
import Leaderboard from './pages/Leaderboard';
import Fabric from './pages/Fabric';
import FabricStart from './pages/FabricStart';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import Discovery from './pages/Discovery';
import DiscoveryNew from './pages/DiscoveryNew';
import DiscoveryMatches from './pages/DiscoveryMatches';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Agents from './pages/Agents';
import Portal from './pages/Portal';
import PortalTrainer from './pages/PortalTrainer';
import PortalAchievements from './pages/PortalAchievements';
import PortalSkilldex from './pages/PortalSkilldex';
import PortalSkills from './pages/PortalSkills';
import PortalNetwork from './pages/PortalNetwork';
import PortalStake from './pages/PortalStake';
import PortalMarketplace from './pages/PortalMarketplace';
import PortalValidators from './pages/PortalValidators';
import OnboardingGuide from './components/OnboardingGuide';
import FlowStudio from './pages/FlowStudio';

const BANNER_KEY = 'flowfabric-mobile-banner-dismissed';

function MobileBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024 && !localStorage.getItem(BANNER_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(BANNER_KEY, '1');
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 40px 6px 16px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      <span>
        FlowFabric is best experienced on desktop. Some features are limited on mobile.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '16px',
          cursor: 'pointer',
          lineHeight: 1,
          padding: '4px 6px',
        }}
      >
        &times;
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <VelmaProvider>
        <MobileBanner />
        <Navbar />
        {/* page-wrap clips horizontal overflow without touching fixed Navbar/Banner */}
        <div style={{ overflowX: 'hidden', width: '100%', position: 'relative' }}>
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
            <Route path="/compose" element={<ChainComposer />} />
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
            <Route path="/studio" element={<FlowStudio />} />
          </Routes>
          <Footer />
        </div>
        <OnboardingGuide />
        <VelmaWidget />
      </VelmaProvider>
    </BrowserRouter>
  );
}

export default App;
