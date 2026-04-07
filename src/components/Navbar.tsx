import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import InstallModal from './InstallModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Skills' },
    { to: '/chains', label: 'Chains' },
    { to: '/docs', label: 'Docs' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <>
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
            <span className="text-xl font-bold" style={{ color: 'var(--cyan)' }}>Velma</span>
            <span className="text-xl font-light" style={{ color: 'var(--text-secondary)' }}> AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm no-underline transition-colors"
                style={{
                  color: isActive(link.to) ? 'var(--cyan)' : 'var(--text-secondary)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowInstall(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              style={{
                background: 'rgba(0, 255, 200, 0.08)',
                border: '1px solid rgba(0, 255, 200, 0.2)',
                color: 'var(--cyan)',
              }}
            >
              Try Free
            </button>
            <ConnectButton
              chainStatus="icon"
              accountStatus="avatar"
              showBalance={false}
            />
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
                style={{ color: isActive(link.to) ? 'var(--cyan)' : 'var(--text-secondary)' }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2">
              <ConnectButton
                chainStatus="icon"
                accountStatus="avatar"
                showBalance={false}
              />
            </div>
          </div>
        )}
      </nav>

      {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}
    </>
  );
}
