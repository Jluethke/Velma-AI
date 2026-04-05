import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/explore', label: 'Explore' },
    { to: '/chains', label: 'Chains' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/agents', label: 'Agents' },
    { to: '/bounties', label: 'Bounties' },
    { to: '/activity', label: 'Activity' },
    { to: '/docs', label: 'Docs' },
    { to: '/whitepaper', label: 'Whitepaper' },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText('pip install skillchain');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-3"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0 no-underline">
          <span className="text-xl font-bold" style={{ color: 'var(--cyan)' }}>VELMA</span>
          <span className="text-xl font-light" style={{ color: 'var(--text-secondary)' }}>.AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm no-underline transition-colors"
              style={{
                color: location.pathname === link.to ? 'var(--cyan)' : 'var(--text-secondary)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs cursor-pointer transition-all"
            style={{
              background: 'rgba(0, 255, 200, 0.08)',
              border: '1px solid rgba(0, 255, 200, 0.2)',
              color: copied ? 'var(--green)' : 'var(--cyan)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>$</span>
            {copied ? 'copied!' : 'pip install skillchain'}
          </button>
          <WalletConnect />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
          style={{ background: 'transparent', border: 'none' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 transition-transform" style={{
            background: 'var(--text-primary)',
            transform: mobileOpen ? 'rotate(45deg) translateY(4px)' : 'none',
          }} />
          <span className="block w-5 h-0.5 transition-opacity" style={{
            background: 'var(--text-primary)',
            opacity: mobileOpen ? 0 : 1,
          }} />
          <span className="block w-5 h-0.5 transition-transform" style={{
            background: 'var(--text-primary)',
            transform: mobileOpen ? 'rotate(-45deg) translateY(-4px)' : 'none',
          }} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-4 items-center" style={{ borderTop: '1px solid var(--border)' }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm no-underline pt-4"
              style={{ color: location.pathname === link.to ? 'var(--cyan)' : 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => { handleCopy(); setMobileOpen(false); }}
            className="mt-2 px-4 py-2 rounded-lg text-xs cursor-pointer"
            style={{
              background: 'rgba(0, 255, 200, 0.08)',
              border: '1px solid rgba(0, 255, 200, 0.2)',
              color: 'var(--cyan)',
            }}
          >
            $ pip install skillchain
          </button>
        </div>
      )}
    </nav>
  );
}
