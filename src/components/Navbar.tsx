import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useSendTrust, useTrustBalance } from '../hooks/useSendTrust';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const location = useLocation();
  const { isConnected } = useAccount();
  const { send, state: sendState, reset: resetSend } = useSendTrust();
  const balance = useTrustBalance();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/compose', label: 'Composer' },
    { to: '/docs', label: 'Docs' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const handleSend = async () => {
    const success = await send(sendTo, sendAmount);
    if (success) {
      setSendTo('');
      setSendAmount('');
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-3"
        style={{
          background: theme === 'dark' ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-0 no-underline">
            <span className="text-xl font-bold" style={{ color: 'var(--cyan)' }}>Skill</span>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Chain</span>
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

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* TRUST balance + Send button (only when connected) */}
            {isConnected && (
              <>
                <span className="text-xs font-mono" style={{ color: 'var(--gold)' }}>
                  {balance.display} TRUST
                </span>
                <button
                  onClick={() => { setShowSend(!showSend); resetSend(); }}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    color: 'var(--gold)',
                  }}
                >
                  Send TRUST
                </button>
              </>
            )}

            {!isConnected && (
              <Link
                to="/skill/budget-builder"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs no-underline transition-all"
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  color: 'var(--cyan)',
                }}
              >
                Try a Skill
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-sm cursor-pointer transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                lineHeight: 1,
              }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>

            <ConnectButton
              chainStatus="icon"
              accountStatus="address"
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
            {isConnected && (
              <span className="text-xs font-mono mt-2" style={{ color: 'var(--gold)' }}>
                {balance.display} TRUST
              </span>
            )}
            <div className="mt-2">
              <ConnectButton
                chainStatus="icon"
                accountStatus="address"
                showBalance={false}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Send TRUST modal */}
      {showSend && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSend(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Send TRUST
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Balance: <span style={{ color: 'var(--gold)' }}>{balance.display} TRUST</span>
            </p>

            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Recipient address
            </label>
            <input
              type="text"
              value={sendTo}
              onChange={e => setSendTo(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%', padding: '8px 12px', marginBottom: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
              }}
            />

            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Amount
            </label>
            <input
              type="text"
              value={sendAmount}
              onChange={e => setSendAmount(e.target.value)}
              placeholder="100"
              style={{
                width: '100%', padding: '8px 12px', marginBottom: '16px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />

            {/* Quick amounts */}
            <div className="flex gap-2 mb-4">
              {['100', '1000', '10000', '100000'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSendAmount(amt)}
                  className="text-xs px-2 py-1 rounded cursor-pointer"
                  style={{
                    background: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    color: 'var(--gold)',
                  }}
                >
                  {Number(amt).toLocaleString()}
                </button>
              ))}
            </div>

            {/* Status */}
            {sendState.status === 'error' && (
              <p className="text-xs mb-3" style={{ color: 'var(--red)' }}>{sendState.error}</p>
            )}
            {sendState.status === 'confirmed' && (
              <p className="text-xs mb-3" style={{ color: 'var(--green)' }}>
                Sent! Tx: {sendState.txHash?.slice(0, 12)}...
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={sendState.status === 'sending' || !sendTo || !sendAmount}
                className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                style={{
                  background: sendTo && sendAmount ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${sendTo && sendAmount ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
                  color: sendTo && sendAmount ? 'var(--gold)' : 'var(--text-secondary)',
                  opacity: sendState.status === 'sending' ? 0.6 : 1,
                }}
              >
                {sendState.status === 'sending' ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => setShowSend(false)}
                className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
