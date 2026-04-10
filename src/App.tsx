import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages (no auth)
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import Whitepaper from './pages/Whitepaper';
import Pricing from './pages/Pricing';

// Content pages
import Explore from './pages/Explore';
import Chains from './pages/Chains';
import SkillDetail from './pages/SkillDetail';
import ChainComposer from './pages/ChainComposer';
import Install from './pages/Install';
import Memory from './pages/Memory';

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
    </BrowserRouter>
  );
}

export default App;
