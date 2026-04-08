import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGateCheck } from '../hooks/useGateCheck';

export default function HeroSection() {
  const { isConnected, canChain } = useGateCheck();

  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(0, 255, 200, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(170, 136, 255, 0.06) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
          style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}
        >
          Build AI skill chains.{' '}
          <span className="block md:inline" style={{
            background: 'linear-gradient(135deg, var(--cyan), var(--gold))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Earn from them.
          </span>
        </h1>

        <p
          className="text-base md:text-lg mb-10 max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Hundreds of AI skills you can try free. Chain them together in a visual composer.
          Publish on-chain and earn TRUST tokens when others use your work.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          {/* Primary: Open Composer (or Connect Wallet) */}
          {canChain ? (
            <Link
              to="/compose"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl no-underline cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(170,136,255,0.15))',
                border: '1px solid rgba(0,255,200,0.3)',
                color: 'var(--cyan)',
              }}
            >
              <span className="text-sm md:text-base font-semibold">
                Open Composer
              </span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <ConnectButton label="Connect Wallet to Compose" />
              {isConnected && !canChain && (
                <span className="text-xs" style={{ color: 'var(--gold)' }}>
                  Builder tier (500 TRUST) required to chain skills
                </span>
              )}
              {!isConnected && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                <span className="text-xs text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                  On mobile? Open this site in the MetaMask app browser for easy wallet connection
                </span>
              )}
            </div>
          )}

          {/* Secondary: Try a single skill free */}
          <Link
            to="/skill/budget-builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl no-underline cursor-pointer transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="text-sm">Try a skill free</span>
            <span style={{ color: 'var(--cyan)' }}>&rarr;</span>
          </Link>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          No account needed to try skills. Connect a wallet with TRUST to unlock chaining.
        </p>
      </div>
    </section>
  );
}
