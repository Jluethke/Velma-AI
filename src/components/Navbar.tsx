import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useSendTrust, useTrustBalance } from '../hooks/useSendTrust';
import { useGateCheck, TIER_LABELS, TIER_COLORS } from '../hooks/useGateCheck';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const location = useLocation();
  const { isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { send, state: sendState, reset: resetSend } = useSendTrust();
  const balance = useTrustBalance();
  const { tier } = useGateCheck();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/install', label: 'Install' },
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
        className="fixed top-0 left-0 right-0 z-50 px-6 py-3 gradient-border-bottom"
        style={{
          background: theme === 'dark' ? 'rgba(9, 9, 11, 0.8)' : 'rgba(250, 250, 249, 0.8)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-0 no-underline">
            <span
              className="text-xl font-bold gradient-text"
              style={{ letterSpacing: '-0.02em' }}
            >
              Flow
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Fabric</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm no-underline px-3 py-1.5 rounded-lg"
                style={{
                  color: isActive(link.to) ? 'var(--cyan)' : 'var(--text-secondary)',
                  background: isActive(link.to) ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  fontWeight: isActive(link.to) ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.to)) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(56, 189, 248, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.to)) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
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
                  <span style={{ color: TIER_COLORS[tier], marginLeft: '4px', fontSize: '10px' }}>
                    {TIER_LABELS[tier]}
                  </span>
                </span>
                <button
                  onClick={() => { setShowSend(!showSend); resetSend(); }}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    color: 'var(--gold)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(251, 191, 36, 0.15)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(251, 191, 36, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(251, 191, 36, 0.08)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  Send TRUST
                </button>
              </>
            )}

            {!isConnected && (
              <Link
                to="/skill/budget-builder"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs no-underline"
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  color: 'var(--cyan)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(56, 189, 248, 0.15)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(56, 189, 248, 0.08)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                Try a Flow
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-sm cursor-pointer"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                lineHeight: 1,
                transition: 'all 0.3s',
              }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56, 189, 248, 0.2)';
                (e.currentTarget as HTMLElement).style.transform = 'rotate(15deg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg)';
              }}
            >
              {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>

            {isConnected ? (
              <button
                onClick={() => {
                  disconnect({ connector });
                  localStorage.removeItem('wagmi.store');
                  localStorage.removeItem('wagmi.connected');
                  localStorage.removeItem('wagmi.wallet');
                  localStorage.removeItem('rk-recent');
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('wagmi') || key.startsWith('rk-') || key.startsWith('wc@')) {
                      localStorage.removeItem(key);
                    }
                  });
                  window.location.reload();
                }}
                className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                style={{
                  background: 'rgba(248, 113, 113, 0.08)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  color: 'var(--red)',
                  transition: 'all 0.3s',
                }}
              >
                Disconnect
              </button>
            ) : (
              <ConnectButton
                chainStatus="icon"
                accountStatus="address"
                showBalance={false}
              />
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
            style={{ background: 'transparent', border: 'none' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5" style={{
              background: 'var(--text-primary)',
              transform: mobileOpen ? 'rotate(45deg) translateY(4px)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
            <span className="block w-5 h-0.5" style={{
              background: 'var(--text-primary)',
              opacity: mobileOpen ? 0 : 1,
              transition: 'opacity 0.2s',
            }} />
            <span className="block w-5 h-0.5" style={{
              background: 'var(--text-primary)',
              transform: mobileOpen ? 'rotate(-45deg) translateY(-4px)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              <>
                <span className="text-xs font-mono mt-2" style={{ color: 'var(--gold)' }}>
                  {balance.display} TRUST
                  <span style={{ color: TIER_COLORS[tier], marginLeft: '4px', fontSize: '10px' }}>
                    {TIER_LABELS[tier]}
                  </span>
                </span>
                <button
                  onClick={() => { setShowSend(!showSend); resetSend(); setMobileOpen(false); }}
                  className="px-4 py-2.5 rounded-lg text-xs cursor-pointer transition-all mt-2"
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    color: 'var(--gold)',
                  }}
                >
                  Send TRUST
                </button>
                <button
                  onClick={() => {
                    disconnect({ connector });
                    localStorage.removeItem('wagmi.store');
                    localStorage.removeItem('wagmi.connected');
                    localStorage.removeItem('wagmi.wallet');
                    localStorage.removeItem('rk-recent');
                    Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('wagmi') || key.startsWith('rk-') || key.startsWith('wc@')) {
                        localStorage.removeItem(key);
                      }
                    });
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 rounded-lg text-xs cursor-pointer transition-all mt-1"
                  style={{
                    background: 'rgba(248, 113, 113, 0.08)',
                    border: '1px solid rgba(248, 113, 113, 0.2)',
                    color: 'var(--red)',
                  }}
                >
                  Disconnect
                </button>
              </>
            )}
            {!isConnected && (
              <div className="mt-2">
                <ConnectButton
                  chainStatus="icon"
                  accountStatus="address"
                  showBalance={false}
                />
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Send TRUST modal */}
      {showSend && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowSend(false)}
        >
          <div
            className="glass-card p-6 max-w-sm w-full animate-fade-in-up"
            style={{ animationDuration: '0.3s' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)', marginTop: 0 }}>
              Send TRUST
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Balance: <span className="gradient-text-gold" style={{ fontWeight: 600 }}>{balance.display} TRUST</span>
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
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56, 189, 248, 0.4)'; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
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
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251, 191, 36, 0.4)'; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            />

            {/* Quick amounts */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['100', '1000', '10000', '100000'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSendAmount(amt)}
                  className="text-xs px-3 py-2 rounded cursor-pointer"
                  style={{
                    background: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    color: 'var(--gold)',
                    minHeight: '36px',
                    minWidth: '44px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.12)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.06)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.15)';
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
                  background: sendTo && sendAmount ? 'rgba(251,191,36,0.12)' : 'var(--bg-secondary)',
                  border: `1px solid ${sendTo && sendAmount ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
                  color: sendTo && sendAmount ? 'var(--gold)' : 'var(--text-secondary)',
                  opacity: sendState.status === 'sending' ? 0.6 : 1,
                  transition: 'all 0.3s',
                }}
              >
                {sendState.status === 'sending' ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => setShowSend(false)}
                className="btn-secondary px-4 py-2 text-sm cursor-pointer"
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
