import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGateCheck } from '../hooks/useGateCheck';

export default function HeroSection() {
  const { isConnected, canChain } = useGateCheck();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Animated gradient orbs */}
      <div
        className="absolute animate-float"
        style={{
          width: '600px',
          height: '600px',
          top: '-10%',
          left: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="absolute animate-float-delayed"
        style={{
          width: '500px',
          height: '500px',
          bottom: '-5%',
          right: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '300px',
          height: '300px',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--text-secondary) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up"
          style={{ lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Create AI Flows.</span>
          <br />
          <span
            className="animate-shimmer gradient-text-gold"
            style={{
              display: 'inline-block',
              marginTop: '0.1em',
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.15))',
            }}
          >
            Built on TRUST.
          </span>
        </h1>

        <p
          className="text-base md:text-lg mb-12 max-w-2xl mx-auto animate-fade-in-up stagger-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          Hundreds of AI skills you can try free. Connect them into flows in a visual composer.
          Publish on-chain and earn TRUST tokens when others use your work.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fade-in-up stagger-3">
          {/* Primary: Open Composer (or Connect Wallet) */}
          {canChain ? (
            <Link
              to="/compose"
              className="btn-primary inline-flex items-center gap-3 px-8 py-4 no-underline cursor-pointer text-sm md:text-base font-semibold"
            >
              <span>Open Composer</span>
              <span style={{ fontSize: '18px' }}>&rarr;</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <ConnectButton label="Connect Wallet to Compose" />
              {isConnected && !canChain && (
                <span className="text-xs" style={{ color: 'var(--gold)' }}>
                  Builder tier (500 TRUST) required to build flows
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
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline cursor-pointer"
          >
            <span className="text-sm">Try a skill free</span>
            <span style={{ color: 'var(--cyan)', transition: 'transform 0.3s' }}>&rarr;</span>
          </Link>
        </div>

        <p className="text-xs animate-fade-in-up stagger-4" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
          No account needed to try skills. Connect a wallet with TRUST to unlock flows.
        </p>
      </div>
    </section>
  );
}
