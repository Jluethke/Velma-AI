import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGateCheck } from '../hooks/useGateCheck';

export default function HeroSection() {
  const { isConnected, canChain } = useGateCheck();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Keyframes for the layered gradient mesh */}
      <style>{`
        @keyframes hero-mesh-a {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(8%, -12%) scale(1.08); }
          66%  { transform: translate(-6%, 10%) scale(0.95); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes hero-mesh-b {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(-10%, 8%) scale(1.05); }
          66%  { transform: translate(12%, -6%) scale(1.1); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes hero-mesh-c {
          0%   { transform: translate(0%, 0%) scale(1); }
          50%  { transform: translate(6%, 6%) scale(1.06); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
      `}</style>

      {/* Deep layered gradient mesh — three orbs that drift independently */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: 'none', overflow: 'hidden' }}
      >
        {/* Orb A — cyan, top-left */}
        <div style={{
          position: 'absolute',
          width: '800px',
          height: '800px',
          top: '-20%',
          left: '-15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.13) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'hero-mesh-a 22s ease-in-out infinite',
        }} />
        {/* Orb B — purple, bottom-right */}
        <div style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          bottom: '-15%',
          right: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'hero-mesh-b 28s ease-in-out infinite',
        }} />
        {/* Orb C — gold, centre */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          top: '35%',
          left: '45%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'hero-mesh-c 18s ease-in-out infinite',
        }} />
        {/* Fine dot grid layered on top of the mesh */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px',
          opacity: 0.05,
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up"
          style={{ lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Create AI Flows.</span>
          <br />
          <span
            className="animate-shimmer gradient-text"
            style={{
              display: 'inline-block',
              marginTop: '0.1em',
              filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.2))',
            }}
          >
            Built on TRUST.
          </span>
        </h1>

        <p
          className="text-base md:text-lg mb-12 max-w-2xl mx-auto animate-fade-in-up stagger-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          Hundreds of AI flows you can try free. Connect them into pipelines in a visual composer.
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

          {/* Secondary: Try a single flow free */}
          <Link
            to="/skill/budget-builder"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline cursor-pointer"
          >
            <span className="text-sm">Try a flow free</span>
            <span style={{ color: 'var(--cyan)', transition: 'transform 0.3s' }}>&rarr;</span>
          </Link>
        </div>

        <p className="text-xs animate-fade-in-up stagger-4" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
          No account needed to try flows. Connect a wallet with TRUST to unlock composition.
        </p>
      </div>
    </section>
  );
}
