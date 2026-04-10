import { Link } from 'react-router-dom';
import { useGateCheck } from '../hooks/useGateCheck';

export default function HeroSection() {
  const { canChain } = useGateCheck();

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

        {/* Pill label */}
        <div className="inline-flex items-center gap-2 mb-6 animate-fade-in-up">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              color: 'var(--cyan)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            165+ flows and counting · Claude Pro + Desktop · Free to browse
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up"
          style={{ lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>AI that actually</span>
          <br />
          <span
            className="animate-shimmer gradient-text"
            style={{
              display: 'inline-block',
              marginTop: '0.1em',
              filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.2))',
            }}
          >
            finishes the job.
          </span>
        </h1>

        <p
          className="text-base md:text-lg mb-4 max-w-2xl mx-auto animate-fade-in-up stagger-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          Structured flows for Claude Desktop. Each one asks for what it needs, executes step by step with your approval, and remembers everything across sessions — so the next flow starts smarter than the last.
        </p>

        {/* Proof line */}
        <p className="text-sm mb-10 animate-fade-in-up stagger-2" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          Resume builder. Interview coach. Budget planner. Business plan. Salary negotiator.{' '}
          <span style={{ color: 'var(--cyan)' }}>One conversation. Done properly.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fade-in-up stagger-3">
          {/* Primary: Get Started */}
          <Link
            to="/get-started"
            className="btn-primary inline-flex items-center gap-3 px-8 py-4 no-underline cursor-pointer text-sm md:text-base font-semibold"
          >
            <span>Get started free</span>
            <span style={{ fontSize: '18px' }}>&rarr;</span>
          </Link>

          {/* Secondary: Compose (wallet required) */}
          {canChain ? (
            <Link
              to="/compose"
              className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline cursor-pointer"
            >
              <span className="text-sm">Open Composer</span>
              <span style={{ color: 'var(--cyan)' }}>&rarr;</span>
            </Link>
          ) : (
            <Link
              to="/flows"
              className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline cursor-pointer"
            >
              <span className="text-sm">Browse 165+ flows</span>
              <span style={{ color: 'var(--cyan)' }}>&rarr;</span>
            </Link>
          )}
        </div>

        {/* Social proof / trust line */}
        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up stagger-4">
          {[
            'Browse flows free',
            'Requires Claude Pro + Desktop for MCP',
            'Memory that compounds',
            'Publish & earn TRUST',
          ].map(item => (
            <span key={item} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
              <span style={{ color: 'var(--cyan)', opacity: 0.8 }}>✓</span>
              {item}
            </span>
          ))}
        </div>

      </div>

      {/* Below-fold teaser: chat mockup strip */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-16 animate-fade-in-up stagger-4">
        <div
          className="glass-card overflow-hidden"
          style={{ padding: 0 }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>Claude Desktop — FlowFabric MCP</span>
          </div>
          {/* Chat messages */}
          <div className="p-5 flex flex-col gap-3" style={{ background: 'var(--bg-secondary)' }}>
            {[
              { role: 'user', text: 'Build me a resume for a senior product manager role at a fintech startup' },
              { role: 'claude', text: 'Before I start, I need a few things: your current resume or work history, the specific job description, and your target comp range. Paste any of those and I\'ll build from there.' },
              { role: 'user', text: '[pastes resume + JD]' },
              { role: 'claude', text: 'Got it. Running resume-builder — Step 1 of 4: ATS keyword analysis...' },
            ].map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="text-xs px-3 py-2 rounded-xl max-w-[80%]"
                  style={{
                    background: msg.role === 'user' ? 'rgba(56,189,248,0.12)' : 'var(--bg-card)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(56,189,248,0.2)' : 'var(--border)'}`,
                    color: msg.role === 'user' ? 'var(--cyan)' : 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <div
                className="text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    animation: 'hero-mesh-c 1.2s ease-in-out infinite',
                  }}
                />
                Analyzing keywords against job description...
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
