import { Link } from 'react-router-dom';

// ── Flow categories ticker ─────────────────────────────────────────

const FLOW_CATEGORIES = [
  { label: 'Goal Planning', color: 'var(--cyan)' },
  { label: 'Job Interviews', color: 'var(--green)' },
  { label: 'Side Business', color: 'var(--purple)' },
  { label: 'Raise Negotiation', color: 'var(--gold)' },
  { label: 'Budget & Savings', color: 'var(--green)' },
  { label: 'Hard Conversations', color: 'var(--cyan)' },
  { label: 'Career Change', color: 'var(--purple)' },
  { label: 'Meal Planning', color: 'var(--green)' },
  { label: 'Freelance Contracts', color: 'var(--gold)' },
  { label: 'Resume Writing', color: 'var(--cyan)' },
  { label: 'Investment Strategy', color: 'var(--green)' },
  { label: 'Startup Launch', color: 'var(--purple)' },
  { label: 'Lease Review', color: 'var(--gold)' },
  { label: 'Team Alignment', color: 'var(--cyan)' },
  { label: 'Life Decisions', color: 'var(--green)' },
  { label: 'API Design', color: 'var(--purple)' },
];

function CategoryTicker() {
  const doubled = [...FLOW_CATEGORIES, ...FLOW_CATEGORIES];
  return (
    <div style={{ overflow: 'hidden', width: '100%', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      <div style={{ display: 'flex', gap: '10px', animation: 'ticker-scroll 30s linear infinite', width: 'max-content' }}>
        {doubled.map((cat, i) => (
          <span
            key={i}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium"
            style={{
              background: `${cat.color}10`,
              border: `1px solid ${cat.color}25`,
              color: cat.color,
            }}
          >
            {cat.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Flow preview card ──────────────────────────────────────────────

function FlowPreview() {
  return (
    <div className="glass-card p-5 md:p-6 max-w-lg mx-auto text-left"
      style={{ borderColor: 'rgba(0,255,200,0.15)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px rgba(0,255,200,0.8)' }} />
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--cyan)' }}>
          running · 90-day-goal-planner
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
          phase 1 of 4
        </span>
      </div>

      {/* Phase steps */}
      <div className="space-y-2 mb-4">
        {[
          { label: 'Clarify goal', done: true, color: 'var(--green)' },
          { label: 'Define milestones', done: true, color: 'var(--green)' },
          { label: 'Weekly task breakdown', active: true, color: 'var(--cyan)' },
          { label: 'Risk & resource plan', color: 'var(--text-secondary)' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full${step.active ? ' animate-pulse' : ''}`}
              style={{
                background: step.done ? 'rgba(0,255,136,0.1)' : step.active ? 'rgba(0,255,200,0.1)' : 'rgba(255,255,255,0.04)',
                color: step.done ? 'var(--green)' : step.active ? 'var(--cyan)' : 'var(--text-secondary)',
                border: `1px solid ${step.done ? 'rgba(0,255,136,0.2)' : step.active ? 'rgba(0,255,200,0.2)' : 'var(--border)'}`,
              }}
            >
              {step.done ? '✓' : step.active ? '●' : '○'}
            </span>
            <span className="text-xs" style={{ color: step.done ? 'var(--text-primary)' : step.active ? 'var(--cyan)' : 'var(--text-secondary)' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Streaming output */}
      <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--cyan)' }}>Week 1–2:</span> Set up Shopify store, photograph 3 products, write descriptions.{' '}
          <span style={{ color: 'var(--cyan)' }}>Week 3–4:</span> Launch soft launch to friends, collect first 5 orders
        </span>
        <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle animate-pulse" style={{ background: 'var(--cyan)', borderRadius: '1px' }} />
      </div>
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    title: 'Pick a flow',
    body: '165+ structured AI workflows across life, career, money, business, health, and more. Free. No account needed.',
    color: 'var(--cyan)',
  },
  {
    n: '2',
    title: 'Describe your situation',
    body: 'Tell the flow what\'s going on. The more context you give, the more specific and useful the output.',
    color: 'var(--purple)',
  },
  {
    n: '3',
    title: 'Watch it work',
    body: 'Each phase runs step by step, streamed live. You get structured, actionable output — not a wall of generic advice.',
    color: 'var(--green)',
  },
];

// ── Hero ──────────────────────────────────────────────────────────

export default function HeroSection() {
  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
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
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      {/* Background orbs */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '900px', height: '900px',
          top: '-25%', left: '-20%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,200,0.07) 0%, rgba(0,255,200,0.03) 35%, transparent 70%)',
          animation: 'hero-orb-a 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '700px', height: '700px',
          bottom: '-15%', right: '-10%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.04) 35%, transparent 70%)',
          animation: 'hero-orb-b 28s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px', opacity: 0.04,
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Pill */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{ background: 'rgba(0,255,200,0.08)', border: '1px solid rgba(0,255,200,0.2)', color: 'var(--cyan)', letterSpacing: '0.04em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 6px rgba(0,255,200,0.8)' }} />
            Free &middot; No account needed &middot; 165+ flows
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-bold mb-5 animate-fade-in-up px-2"
          style={{
            fontSize: 'clamp(2rem, 6.5vw, 5.5rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          AI flows for<br />
          <span className="gradient-text" style={{ filter: 'drop-shadow(0 0 24px rgba(0,255,200,0.18))' }}>
            everything.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-2 px-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          Structured AI workflows that run step by step, streamed live in your browser.
          Pick a flow, describe your situation, and get real, actionable output — not a wall of generic advice.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fade-in-up stagger-3">
          <Link to="/explore" className="btn-primary inline-flex items-center gap-3 px-8 py-4 no-underline text-sm md:text-base font-semibold">
            Explore Flows
            <span style={{ fontSize: 18 }}>&rarr;</span>
          </Link>
          <Link to="/chains"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm"
            style={{ borderColor: 'rgba(167,139,250,0.3)', color: 'var(--purple)' }}>
            Try a Pipeline &rarr;
          </Link>
        </div>

        {/* Category ticker */}
        <div className="mb-14 animate-fade-in-up stagger-3">
          <CategoryTicker />
        </div>

        {/* Flow preview */}
        <div className="mb-20 animate-fade-in-up stagger-4">
          <FlowPreview />
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {STEPS.map(step => (
            <div key={step.n} className="glass-card p-5" style={{ borderColor: `${step.color}15` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-3"
                style={{ background: `${step.color}12`, color: step.color, border: `1px solid ${step.color}25` }}>
                {step.n}
              </div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {step.title}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
