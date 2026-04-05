import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import Pricing from './pages/Pricing';
import Chains from './pages/Chains';
import Agents from './pages/Agents';
import Bounties from './pages/Bounties';
import Activity from './pages/Activity';
import Docs from './pages/Docs';
import Whitepaper from './pages/Whitepaper';
import SkillDetail from './pages/SkillDetail';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/chains" element={<Chains />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/bounties" element={<Bounties />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/whitepaper" element={<Whitepaper />} />
          <Route path="/skill/:name" element={<SkillDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
