import { useState, useEffect, useRef } from 'react';

const STEP_MS = 3800;

const STEPS = [
  {
    id: 0,
    label: 'Host starts a session',
    sublabel: 'Pick a flow. Get a shareable link.',
  },
  {
    id: 1,
    label: 'Guest opens the link',
    sublabel: 'No account. No install. Just answers.',
  },
  {
    id: 2,
    label: 'Both sides submit privately',
    sublabel: 'Neither sees the other's context yet.',
  },
  {
    id: 3,
    label: 'Claude synthesizes',
    sublabel: 'Overlap found. Path forward built.',
  },
];

// ── Step screens ──────────────────────────────────────────────────

function Step0() {
  const [typed, setTyped] = useState('');
  const full = 'salary-negotiation';
  useEffect(() => {
    setTyped('');
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
        New Fabric session
      </div>
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Flow:</span>
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--cyan)' }}>
          {typed}
          <span className="inline-block w-0.5 h-3 ml-0.5 align-middle" style={{ background: 'var(--cyan)', animation: 'blink 1s step-end infinite' }} />
        </span>
      </div>
      <div
        className="rounded-xl px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>What's the context? (optional)</div>
        <div className="text-xs" style={{ color: 'var(--text-primary)' }}>Q4 raise conversation with my manager</div>
      </div>
      <button
        className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
        style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--purple)' }}
      >
        Create Fabric session →
      </button>
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', animation: 'fabric-fade-up 0.5s ease 1.8s both' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Guest link:</span>
        <span className="text-xs font-mono truncate" style={{ color: 'var(--purple)' }}>flowfabric.io/fabric/a3f9...</span>
        <span className="ml-auto text-xs font-semibold shrink-0" style={{ color: 'var(--purple)', opacity: 0.7 }}>Copy</span>
      </div>
    </div>
  );
}

function Step1() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col gap-3 p-5">
      {/* Notification banner */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.2)',
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'all 0.4s ease',
        }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: 'rgba(167,139,250,0.15)' }}>⚡</div>
        <div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Jordan sent you a Fabric</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>salary-negotiation · tap to open</div>
        </div>
      </div>

      {/* Guest view */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.4s ease',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--purple)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>salary-negotiation · Fabric</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Jordan has started a structured session. Add your context — they won't see it until Claude synthesizes both sides.
        </p>
        <div
          className="text-xs font-semibold py-2 rounded-lg text-center"
          style={{
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.2)',
            color: 'var(--purple)',
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          Add my context →
        </div>
      </div>
      <div
        className="text-xs text-center"
        style={{
          color: 'var(--text-secondary)',
          opacity: phase >= 2 ? 0.5 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        No account needed · opens in browser
      </div>
    </div>
  );
}

function Step2() {
  const [hostDone, setHostDone] = useState(false);
  const [guestDone, setGuestDone] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setHostDone(true), 700);
    const t2 = setTimeout(() => setGuestDone(true), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const hostItems = ['Current comp: $112K', 'Target: $128K', 'Strong Q3 performance'];
  const guestItems = ['Band max: $120K', 'Budget frozen til Q2', 'Open to equity'];

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Jordan', color: 'var(--cyan)', bg: 'rgba(56,189,248,0.05)', border: 'rgba(56,189,248,0.12)', items: hostItems, done: hostDone },
          { label: 'Alex (mgr)', color: 'var(--purple)', bg: 'rgba(167,139,250,0.05)', border: 'rgba(167,139,250,0.12)', items: guestItems, done: guestDone, guest: true },
        ].map(side => (
          <div
            key={side.label}
            className="rounded-xl p-3 flex flex-col gap-2"
            style={{ background: side.bg, border: `1px solid ${side.border}` }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: side.bg, border: `1px solid ${side.border}`, color: side.color }}
              >
                {side.label[0]}
              </div>
              <span className="text-xs font-semibold truncate" style={{ color: side.color }}>{side.label}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {side.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1"
                  style={{
                    opacity: side.done ? 1 : 0,
                    transform: side.done ? 'translateY(0)' : 'translateY(4px)',
                    transition: `all 0.35s ease ${i * 0.12}s`,
                  }}
                >
                  <span className="text-xs shrink-0 mt-0.5" style={{ color: side.color }}>✓</span>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{item}</span>
                </div>
              ))}
            </div>
            {side.done && (
              <div
                className="text-xs font-semibold text-center rounded-lg py-1 mt-1"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: side.color,
                  opacity: 0.7,
                  fontSize: '0.6rem',
                  letterSpacing: '0.05em',
                }}
              >
                SUBMITTED
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        className="rounded-xl px-3 py-2 text-xs text-center"
        style={{
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.15)',
          color: 'var(--purple)',
          opacity: hostDone && guestDone ? 1 : 0,
          transition: 'opacity 0.5s ease 0.3s',
        }}
      >
        Both sides in · ready to synthesize
      </div>
    </div>
  );
}

function Step3() {
  const lines = [
    { icon: '✓', color: 'var(--green)', text: 'Comp overlap: meet at ', bold: '$118K', rest: ' is reachable' },
    { icon: '→', color: 'var(--gold)', text: 'Timeline gap: band resets ', bold: 'Feb 1', rest: ' — worth naming' },
    { icon: '→', color: 'var(--gold)', text: 'Equity not on Jordan\'s radar — ', bold: 'surface it', rest: '' },
    { icon: '✓', color: 'var(--green)', text: 'Both sides value retention — ', bold: 'strong foundation', rest: '' },
  ];
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  useEffect(() => {
    setVisibleLines(0);
    setShowCTA(false);
    lines.forEach((_, i) => {
      setTimeout(() => setVisibleLines(v => Math.max(v, i + 1)), 400 + i * 500);
    });
    setTimeout(() => setShowCTA(true), 400 + lines.length * 500 + 200);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--purple)', boxShadow: '0 0 6px rgba(167,139,250,0.8)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--purple)', opacity: 0.7 }}>Claude's synthesis</span>
      </div>
      <div
        className="rounded-xl p-4 flex flex-col gap-2.5"
        style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)' }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs"
            style={{
              opacity: visibleLines > i ? 1 : 0,
              transform: visibleLines > i ? 'translateY(0)' : 'translateY(6px)',
              transition: 'all 0.4s ease',
            }}
          >
            <span className="shrink-0 mt-0.5" style={{ color: line.color }}>{line.icon}</span>
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {line.text}
              {line.bold && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{line.bold}</span>}
              {line.rest}
            </span>
          </div>
        ))}
      </div>
      <div
        className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
        style={{
          background: 'rgba(167,139,250,0.1)',
          border: '1px solid rgba(167,139,250,0.3)',
          color: 'var(--purple)',
          opacity: showCTA ? 1 : 0,
          transform: showCTA ? 'translateY(0)' : 'translateY(6px)',
          transition: 'all 0.4s ease',
        }}
      >
        Share synthesis with both sides →
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS = [Step0, Step1, Step2, Step3];

// ── Main component ────────────────────────────────────────────────

export default function FabricWalkthrough() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (next: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, 300);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      goTo((step + 1) % STEPS.length);
    }, STEP_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step]);

  const Screen = SCREEN_COMPONENTS[step];

  return (
    <section className="px-6 py-20 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2
          className="text-2xl md:text-4xl font-bold mb-3"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          How a Fabric session works
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Four steps. Two people. One clear outcome.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Step list */}
        <div className="flex flex-col gap-2 md:w-56 shrink-0 w-full">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); goTo(i); }}
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: step === i ? 'rgba(167,139,250,0.08)' : 'transparent',
                border: `1px solid ${step === i ? 'rgba(167,139,250,0.25)' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{
                  background: step === i ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                  color: step === i ? 'var(--purple)' : 'var(--text-secondary)',
                  border: `1px solid ${step === i ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s ease',
                }}
              >
                {i + 1}
              </div>
              <div>
                <div
                  className="text-xs font-semibold leading-tight"
                  style={{ color: step === i ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}
                >
                  {s.label}
                </div>
                <div
                  className="text-xs mt-0.5 leading-snug"
                  style={{ color: 'var(--text-secondary)', opacity: step === i ? 0.7 : 0.4, transition: 'opacity 0.3s ease' }}
                >
                  {s.sublabel}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Phone frame */}
        <div className="flex-1 flex justify-center">
          <div
            className="relative w-full max-w-xs rounded-3xl overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 6px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.4)',
              minHeight: 340,
            }}
          >
            {/* Phone notch */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--purple)', boxShadow: '0 0 6px rgba(167,139,250,0.8)' }} />
                <span className="text-xs font-mono" style={{ color: 'var(--purple)', opacity: 0.8 }}>Fabric</span>
              </div>
              {/* Progress dots */}
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: step === i ? 16 : 6,
                      height: 6,
                      background: step === i ? 'var(--purple)' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Screen content */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}
            >
              <Screen />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-progress bar */}
      <div className="mt-8 max-w-xs mx-auto md:mx-0 md:ml-[256px]">
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            key={step}
            className="h-full rounded-full"
            style={{
              background: 'var(--purple)',
              animation: `fabric-progress ${STEP_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fabric-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes fabric-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
