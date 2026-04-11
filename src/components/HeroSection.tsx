import { Link } from 'react-router-dom';
import { useGateCheck } from '../hooks/useGateCheck';

// ── Live ticker data ──────────────────────────────────────────────

const TICKER_ITEMS = [
  { flow: 'business-in-a-box', ago: '2m ago' },
  { flow: 'salary-negotiator', ago: '4m ago' },
  { flow: 'resume-builder', ago: '7m ago' },
  { flow: 'idea-validator', ago: '9m ago' },
  { flow: 'budget-builder', ago: '12m ago' },
  { flow: 'interview-coach', ago: '14m ago' },
  { flow: 'career-pivot', ago: '18m ago' },
  { flow: 'market-research', ago: '21m ago' },
  { flow: 'pricing-strategy', ago: '23m ago' },
  { flow: 'debt-payoff-planner', ago: '27m ago' },
  { flow: 'sleep-protocol-designer', ago: '30m ago' },
  { flow: 'competitor-teardown', ago: '33m ago' },
];

// CSS animation: position:absolute removes from layout flow so iOS Safari
// can't measure the wide inner div as page scroll width.
function LiveTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="w-full"
      style={{
        overflow: 'hidden',
        position: 'relative',
        height: '36px',
        maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className="flex gap-3"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          animation: 'ticker-scroll 48s linear infinite',
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              width: '210px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                flexShrink: 0,
                boxShadow: '0 0 6px rgba(74,222,128,0.6)',
              }}
            />
            <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
              {item.flow}
            </span>
            <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
              {item.ago}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Flow preview card ─────────────────────────────────────────────

function FlowPreview() {
  return (
    <div
      className="glass-card p-4 md:p-5 max-w-lg mx-auto mb-14 animate-fade-in-up stagger-4 text-left"
      style={{ borderColor: 'rgba(56,189,248,0.12)' }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px rgba(74,222,128,0.8)' }} />
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--cyan)' }}>salary-negotiator</span>
        <span className="text-xs ml-auto font-mono" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>Phase 3 of 5</span>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {[
          { icon: '✓', text: 'Role: Senior Engineer · 6 YOE', hi: false },
          { icon: '✓', text: 'Current: $112K · Offer received: $128K', hi: false },
          { icon: '→', text: 'Market range: $138K–$162K · Your leverage: High', hi: true },
        ].map((row, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-xs mt-0.5 shrink-0" style={{ color: row.hi ? 'var(--cyan)' : 'var(--green)' }}>{row.icon}</span>
            <span className="text-xs leading-relaxed" style={{ color: row.hi ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: row.hi ? 500 : 400 }}>{row.text}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)' }}>
        <div className="text-xs mb-1.5 font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>Procedure output</div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          Counter at <span style={{ color: 'var(--green)', fontWeight: 600 }}>$148K</span> + $10K signing bonus.
          Lead with market data. Your BATNA is strong — don't accept same-day.
        </p>
      </div>

      <div className="w-full text-xs py-2.5 rounded-lg font-semibold text-center" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', color: 'var(--cyan)' }}>
        Approve &amp; run Phase 4: Counter-offer script →
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────

export default function HeroSection() {
  useGateCheck();

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      <style>{`
        @keyframes hero-orb-a {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(8%, -12%) scale(1.08); }
          66%  { transform: translate(-6%, 10%) scale(0.95); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes hero-orb-b {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(-10%, 8%) scale(1.05); }
          66%  { transform: translate(12%, -6%) scale(1.1); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes hero-orb-c {
          0%   { transform: translate(0%, 0%) scale(1); }
          50%  { transform: translate(6%, 6%) scale(1.06); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes word-in {
          from { opacity: 0; transform: translateY(12px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }
        .word-animate {
          display: inline-block;
          animation: word-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      {/* Background orbs — no filter:blur (breaks overflow:hidden on iOS Safari) */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '900px', height: '900px',
          top: '-25%', left: '-20%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.09) 0%, rgba(56,189,248,0.04) 35%, rgba(56,189,248,0.01) 60%, transparent 80%)',
          animation: 'hero-orb-a 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '700px', height: '700px',
          bottom: '-15%', right: '-10%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.04) 35%, rgba(167,139,250,0.01) 60%, transparent 80%)',
          animation: 'hero-orb-b 28s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          top: '40%', left: '42%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,0.04) 0%, rgba(74,222,128,0.01) 50%, transparent 75%)',
          animation: 'hero-orb-c 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px', opacity: 0.04,
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* MCP pill */}
        <div className="flex justify-center mb-8 animate-fade-in-up px-4">
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 text-center"
            style={{
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              color: 'var(--green)',
              letterSpacing: '0.04em',
              maxWidth: '100%',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
            165+ proven flows · runs in Claude
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-bold mb-6 animate-fade-in-up px-2"
          style={{
            fontSize: 'clamp(1.75rem, 6vw, 5.5rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Flows.</span>
          <br />
          <span
            className="gradient-text"
            style={{ filter: 'drop-shadow(0 0 24px rgba(56,189,248,0.18))' }}
          >
            And Fabric.
          </span>
        </h1>

        {/* Sub */}
        <p
          className="text-base md:text-lg mb-3 max-w-2xl mx-auto animate-fade-in-up stagger-2 px-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.75, overflowWrap: 'break-word' }}
        >
          Expert procedures for what you need to do.
          Shared sessions for what you need to work through with someone else.
        </p>

        <p
          className="text-sm mb-10 animate-fade-in-up stagger-2 px-2"
          style={{ color: 'var(--text-secondary)', opacity: 0.55, overflowWrap: 'break-word' }}
        >
          Run alone.{' '}
          <span style={{ color: 'var(--cyan)', opacity: 1 }}>Or weave together.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 animate-fade-in-up stagger-3">
          <Link
            to="/get-started"
            className="btn-primary inline-flex items-center gap-3 px-8 py-4 no-underline text-sm md:text-base font-semibold"
          >
            Run your first flow
            <span style={{ fontSize: 18 }}>→</span>
          </Link>
          <Link
            to="/get-started"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm"
            style={{ borderColor: 'rgba(167,139,250,0.3)', color: 'var(--purple)' }}
          >
            Join the Fabric waitlist <span>→</span>
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs mb-10 animate-fade-in-up stagger-3" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
          Free to start · No prompt engineering · Runs in Claude
        </p>

        {/* Flow preview card */}
        <FlowPreview />

        {/* Live ticker */}
        <div className="animate-fade-in-up stagger-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
              flows running now
            </span>
          </div>
          <LiveTicker />
        </div>

      </div>
    </section>
  );
}
