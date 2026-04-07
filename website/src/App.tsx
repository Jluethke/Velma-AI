import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages (no auth)
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import Whitepaper from './pages/Whitepaper';
import Pricing from './pages/Pricing';

// Authenticated pages (login required — soft-gated for now)
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Chains from './pages/Chains';
import SkillDetail from './pages/SkillDetail';
import Profile from './pages/Profile';
import Agents from './pages/Agents';
import Bounties from './pages/Bounties';
import Activity from './pages/Activity';

// Web3 Portal (wallet connect required)
import Portal from './pages/Portal';
import PortalStake from './pages/PortalStake';
import PortalMarketplace from './pages/PortalMarketplace';
import PortalValidators from './pages/PortalValidators';
import PortalNetwork from './pages/PortalNetwork';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Authenticated */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skills" element={<Explore />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/chains" element={<Chains />} />
        <Route path="/skill/:name" element={<SkillDetail />} />
        <Route path="/achievements" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/bounties" element={<Bounties />} />
        <Route path="/activity" element={<Activity />} />

        {/* Web3 Portal */}
        <Route path="/portal" element={<Portal />} />
        <Route path="/portal/stake" element={<PortalStake />} />
        <Route path="/portal/marketplace" element={<PortalMarketplace />} />
        <Route path="/portal/validators" element={<PortalValidators />} />
        <Route path="/portal/network" element={<PortalNetwork />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
