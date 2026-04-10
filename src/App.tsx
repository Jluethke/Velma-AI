import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VelmaWidget from './components/VelmaWidget';

// Public pages (no auth)
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import Whitepaper from './pages/Whitepaper';
import Pricing from './pages/Pricing';
import GettingStarted from './pages/GettingStarted';

// Content pages
import Explore from './pages/Explore';
import Chains from './pages/Chains';
import SkillDetail from './pages/SkillDetail';
import ChainComposer from './pages/ChainComposer';
import Install from './pages/Install';
import Memory from './pages/Memory';

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
      <MobileBanner />
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/get-started" element={<GettingStarted />} />

        {/* Content */}
        <Route path="/skills" element={<Explore />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/chains" element={<Chains />} />
        <Route path="/skill/:name" element={<SkillDetail />} />
        <Route path="/compose" element={<ChainComposer />} />
        <Route path="/install" element={<Install />} />
        <Route path="/memory" element={<Memory />} />
      </Routes>
      <Footer />
      <VelmaWidget />
    </BrowserRouter>
  );
}

export default App;
