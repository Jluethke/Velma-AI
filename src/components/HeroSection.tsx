import { Link } from 'react-router-dom';
import { useGateCheck } from '../hooks/useGateCheck';

// ── How it works steps ────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    title: 'Start a session',
    body: 'Pick what you\'re working through — hiring, negotiating, co-founding, scoping. Give it a name. You get a private link and a guest link to send to the other side.',
    color: 'var(--cyan)',
  },
  {
    n: '2',
    title: 'Both sides answer privately',
    body: 'You answer on your end. They answer on theirs. Neither of you sees the other\'s responses. No posturing. No anchoring. Just honest answers.',
    color: 'var(--purple)',
  },
  {
    n: '3',
    title: 'Claude shows you the truth',
    body: 'Once both sides submit, Claude reads each set of answers in isolation, extracts both positions, then synthesises them into a neutral analysis — common ground, gaps, and a concrete path forward.',
    color: 'var(--green)',
  },
];

// ── Synthesis preview card ────────────────────────────────────────

function SynthesisPreview() {
  return (
    <div className="glass-card p-5 md:p-6 max-w-lg mx-auto text-left"
      style={{ borderColor: 'rgba(74,222,128,0.15)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px rgba(74,222,128,0.8)' }} />
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--green)' }}>
          synthesis complete
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
          freelance-brief
        </span>
      </div>

      {/* Agreement */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--green)', opacity: 0.7 }}>
          \u2713 Where you agree
        </div>
        {['$120\u2013$140/day rate range', 'Remote-first, async communication', '6-week timeline'].map(item => (
          <div key={item} className="flex items-center gap-2 mb-1.5">
            <span className="text-xs" style={{ color: 'var(--green)' }}>\u2714</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Gap */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--gold)', opacity: 0.7 }}>
          \u2192 Gap to bridge
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.12)' }}>
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Revision rounds</div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Client expects unlimited. Freelancer budgeted for 2. <span style={{ color: 'var(--gold)' }}>Suggest: 3 rounds included, \u00d41.5x day rate after.</span>
          </div>
        </div>
      </div>

      {/* Trade-off */}
      <div>
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--cyan)', opacity: 0.7 }}>
          \u2696 Trade-off
        </div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Freelancer accepts slightly lower day rate in exchange for a firm revision cap. Client gets certainty on cost. Both get what they actually care about.
        </div>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────

export default function HeroSection() {
  useGateCheck();

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
          background: 'radial-gradient(circle, rgba(56,189,248,0.09) 0%, rgba(56,189,248,0.04) 35%, transparent 70%)',
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
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--green)', letterSpacing: '0.04em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
            Free to use &middot; No account needed &middot; Works across every industry
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
          Get aligned<br />
          <span className="gradient-text" style={{ filter: 'drop-shadow(0 0 24px rgba(56,189,248,0.18))' }}>
            before you commit.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-base md:text-lg mb-3 max-w-2xl mx-auto animate-fade-in-up stagger-2 px-2"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          Both sides answer privately. Claude reads each set of answers in isolation,
          then shows you both the same neutral analysis &mdash; common ground, gaps, and a path forward.
        </p>
        <p className="text-sm mb-10 animate-fade-in-up stagger-2"
          style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
          No awkward calls. No anchoring. No one shows their hand first.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-in-up stagger-3">
          <Link to="/start" className="btn-primary inline-flex items-center gap-3 px-8 py-4 no-underline text-sm md:text-base font-semibold">
            Start an alignment session
            <span style={{ fontSize: 18 }}>&rarr;</span>
          </Link>
          <Link to="/discover/new"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm"
            style={{ borderColor: 'rgba(167,139,250,0.3)', color: 'var(--purple)' }}>
            Find a counterpart &rarr;
          </Link>
        </div>

        {/* Synthesis preview */}
        <div className="mb-20 animate-fade-in-up stagger-4">
          <SynthesisPreview />
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
