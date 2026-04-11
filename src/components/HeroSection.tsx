import { useState, useEffect, useRef } from 'react';
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

function LiveTicker() {
  const [offset, setOffset] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const speed = 35; // px/sec

  useEffect(() => {
    const totalWidth = TICKER_ITEMS.length * 220;

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      setOffset((elapsed * speed) % totalWidth);
      frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="w-full"
      style={{
        overflow: 'hidden',
        overflowX: 'clip',
        maxWidth: '100vw',
        maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className="flex gap-3 w-max"
        style={{ transform: `translateX(-${offset}px)`, willChange: 'transform' }}
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

// ── Stat strip ────────────────────────────────────────────────────

const STATS = [
  { value: '165+', label: 'flows' },
  { value: '166', label: 'pipelines' },
  { value: '9', label: 'categories' },
  { value: '∞', label: 'memory' },
];

// ── Hero ──────────────────────────────────────────────────────────

export default function HeroSection() {
  const { canChain } = useGateCheck();

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
      `}</style>

      {/* Background orbs */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '900px', height: '900px',
          top: '-25%', left: '-20%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.11) 0%, rgba(56,189,248,0.03) 40%, transparent 70%)',
          filter: 'blur(80px)', animation: 'hero-orb-a 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '700px', height: '700px',
          bottom: '-15%', right: '-10%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0.03) 40%, transparent 70%)',
          filter: 'blur(80px)', animation: 'hero-orb-b 28s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          top: '40%', left: '42%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'hero-orb-c 18s ease-in-out infinite',
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
            Native MCP · Claude Code + Desktop
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
          <span style={{ color: 'var(--text-primary)' }}>Your AI keeps forgetting.</span>
          <br />
          <span
            className="gradient-text"
            style={{ filter: 'drop-shadow(0 0 24px rgba(56,189,248,0.18))' }}
          >
            Ours doesn't.
          </span>
        </h1>

        {/* Sub */}
        <p
          className="text-base md:text-lg mb-3 max-w-2xl mx-auto animate-fade-in-up stagger-2 px-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.75, overflowWrap: 'break-word' }}
        >
          FlowFabric gives Claude structured, step-by-step flows that ask for what they need,
          execute with your approval, and build a memory across every session —
          so each run starts smarter than the last.
        </p>

        <p
          className="text-sm mb-10 animate-fade-in-up stagger-2 px-2"
          style={{ color: 'var(--text-secondary)', opacity: 0.55, overflowWrap: 'break-word' }}
        >
          No prompt engineering.{' '}
          <span style={{ color: 'var(--cyan)', opacity: 1 }}>Just describe what you need and run.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-up stagger-3">
          <Link
            to="/get-started"
            className="btn-primary inline-flex items-center gap-3 px-8 py-4 no-underline text-sm md:text-base font-semibold"
          >
            Get started free
            <span style={{ fontSize: 18 }}>→</span>
          </Link>
          {canChain ? (
            <Link to="/compose" className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm">
              Open Composer <span style={{ color: 'var(--cyan)' }}>→</span>
            </Link>
          ) : (
            <Link to="/flows" className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm">
              Browse 165+ flows <span style={{ color: 'var(--cyan)' }}>→</span>
            </Link>
          )}
        </div>

        {/* Stat strip */}
        <div
          className="inline-flex items-center gap-6 md:gap-10 mb-14 animate-fade-in-up stagger-4 flex-wrap justify-center"
        >
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div
                className="text-xl md:text-2xl font-bold"
                style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

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
