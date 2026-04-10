import { useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SkillShowcase from '../components/SkillShowcase';
import FAQ from '../components/FAQ';

// ── 3-D tilt helper ───────────────────────────────────────────────

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -5;   // max ±5 deg
    const rotateY = ((x - cx) / cx) * 5;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(56,189,248,0.12)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    el.style.boxShadow = '';
  };

  return { ref, onMouseMove, onMouseLeave };
}

// ── Reusable tilt card wrapper ────────────────────────────────────

function TiltCard({ children, color }: { children: React.ReactNode; color?: string }) {
  const tilt = useTilt();
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="glass-card p-5"
      style={{
        borderColor: color ? `${color}10` : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

// ── Composer Preview Section ──────────────────────────────────────

function ComposerPreview() {
  const skills = [
    { name: 'idea-validator', domain: 'business', color: '#a855f7' },
    { name: 'market-research', domain: 'business', color: '#a855f7' },
    { name: 'pricing-strategy', domain: 'business', color: '#a855f7' },
    { name: 'pitch-practice', domain: 'marketing', color: '#ff69b4' },
  ];

  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Connect flows into chains.{' '}
          <span className="gradient-text">Visually.</span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Drag flows onto a canvas, connect them, customize inputs and outputs, then run the whole chain in Claude Code. Create flows that don't exist yet with natural language.
        </p>
      </div>

      {/* Mock composer visual */}
      <div
        className="glass-card overflow-hidden max-w-4xl mx-auto"
        style={{ padding: 0 }}
      >
        {/* Toolbar mock */}
        <div
          className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 flex-wrap overflow-x-auto"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            startup-validation
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>|</span>
          {[
            { label: 'Validate', bg: 'rgba(56,189,248,0.08)', color: 'var(--cyan)', border: 'rgba(56,189,248,0.2)' },
            { label: 'Export', bg: 'rgba(56,189,248,0.12)', color: 'var(--cyan)', border: 'rgba(56,189,248,0.25)' },
            { label: 'Run', bg: 'rgba(74,222,128,0.1)', color: 'var(--green)', border: 'rgba(74,222,128,0.25)', bold: true },
            { label: 'Publish On-Chain', bg: 'rgba(251,191,36,0.08)', color: 'var(--gold)', border: 'rgba(251,191,36,0.2)', bold: true },
          ].map(btn => (
            <span
              key={btn.label}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                background: btn.bg,
                color: btn.color,
                border: `1px solid ${btn.border}`,
                fontWeight: btn.bold ? 600 : 400,
              }}
            >
              {btn.label}
            </span>
          ))}
        </div>

        {/* Canvas mock */}
        <div
          className="p-4 md:p-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 md:flex-wrap"
          style={{
            background: 'var(--bg-secondary)',
            minHeight: '280px',
            position: 'relative',
          }}
        >
          {/* Subtle grid lines on canvas */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--text-secondary) 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px',
              opacity: 0.03,
              pointerEvents: 'none',
            }}
          />

          {skills.map((skill, i, arr) => (
            <div key={skill.name} className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto relative z-10">
              <div
                className="rounded-xl p-4 w-full md:w-auto"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${skill.color}30`,
                  minWidth: '150px',
                  boxShadow: `0 4px 16px ${skill.color}08, 0 0 0 1px ${skill.color}10`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${skill.color}15, 0 0 0 1px ${skill.color}25`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${skill.color}08, 0 0 0 1px ${skill.color}10`;
                }}
              >
                <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{skill.name}</div>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background: `${skill.color}15`, color: skill.color, fontWeight: 500 }}
                >
                  {skill.domain}
                </span>
              </div>
              {i < arr.length - 1 && (
                <span
                  className="text-lg hidden md:block"
                  style={{
                    color: 'var(--cyan)',
                    opacity: 0.5,
                    animation: 'arrow-bounce 2s ease-in-out infinite',
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  &rarr;
                </span>
              )}
              {i < arr.length - 1 && (
                <span
                  className="text-lg md:hidden"
                  style={{
                    color: 'var(--cyan)',
                    opacity: 0.5,
                    animation: 'arrow-bounce 2s ease-in-out infinite',
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  &darr;
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <Link
          to="/compose"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold no-underline"
        >
          Open the Composer
          <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

// ── TRUST Economy Section ─────────────────────────────────────────

function TrustStepCard({ item, delay }: { item: { step: string; title: string; desc: string; color: string }; delay: number }) {
  const tilt = useTilt();
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`glass-card p-5 animate-fade-in-up stagger-${delay}`}
      style={{
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        willChange: 'transform',
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${item.color}25, ${item.color}10)`,
          border: `2px solid ${item.color}40`,
          color: item.color,
          boxShadow: `0 0 16px ${item.color}10`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {item.step}
      </div>
      <h3 className="text-sm font-bold mb-2" style={{ color: item.color }}>{item.title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
    </div>
  );
}

function TrustEconomy() {
  const steps = [
    {
      step: '1',
      title: 'Try Flows Free',
      desc: 'Run any flow for free in Claude Code. No wallet needed. See what AI can do with structured procedures.',
      color: 'var(--cyan)',
    },
    {
      step: '2',
      title: 'Connect Wallet',
      desc: 'Create a MetaMask wallet right in your browser. Connect it on the site. This is your identity in the TRUST ecosystem.',
      color: 'var(--purple)',
    },
    {
      step: '3',
      title: 'Compose & Publish',
      desc: 'Unlock the visual composer. Build chains from existing flows or create new ones. Publish on-chain — your wallet is credited as the author.',
      color: 'var(--gold)',
    },
    {
      step: '4',
      title: 'Earn TRUST',
      desc: 'When others use your flows or derivatives of them, TRUST goes to your wallet. 70% to creators, 15% to validators, 15% to the treasury.',
      color: 'var(--green)',
    },
  ];

  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          How{' '}
          <span className="gradient-text-gold">TRUST</span>
          {' '}works
        </h2>
        <p className="text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          TRUST isn't bought. It's earned. Create flows, validate quality, publish chains, earn royalties.
        </p>
      </div>

      {/* Steps with connecting line */}
      <div className="relative">
        {/* Connecting line (desktop) */}
        <div
          className="hidden lg:block absolute"
          style={{
            top: '22px',
            left: 'calc(12.5% + 14px)',
            right: 'calc(12.5% + 14px)',
            height: '2px',
            background: 'linear-gradient(90deg, var(--cyan), var(--purple), var(--gold), var(--green))',
            opacity: 0.2,
            borderRadius: '1px',
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((item, i) => (
            <TrustStepCard key={item.step} item={item} delay={i + 1} />
          ))}
        </div>
      </div>

      <div
        className="mt-10 glass-card p-5 text-center"
        style={{
          background: 'rgba(251, 191, 36, 0.03)',
          borderColor: 'rgba(251, 191, 36, 0.1)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <span className="font-semibold gradient-text-gold">Derivatives earn royalties for everyone in the flow.</span>{' '}
          If you modify someone's flow and publish it, 15% of TRUST earned goes to the original creator automatically via smart contract. Innovation compounds.
        </p>
      </div>
    </section>
  );
}

// ── Skill Evolution Section ────────────────────────────────────────

function SkillEvolution() {
  const stages = [
    { label: 'Prompt', desc: 'Natural language. Anyone can write one.', color: 'var(--text-secondary)', scale: 0.85 },
    { label: 'Flow', desc: 'Structured phases with quality gates.', color: 'var(--cyan)', scale: 0.9 },
    { label: 'Validated', desc: 'Shadow-tested. Trust-scored on-chain.', color: 'var(--purple)', scale: 0.95 },
    { label: 'Graduated', desc: 'Proven consistent across hundreds of runs.', color: 'var(--gold)', scale: 1.0 },
    { label: 'Compiled', desc: 'Runs as code. No AI needed. Deterministic.', color: 'var(--green)', scale: 1.05 },
  ];

  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Flows{' '}
          <span style={{ color: 'var(--green)' }}>evolve</span>
        </h2>
        <p className="text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          A flow starts as natural language. Through validation and consensus, it graduates into executable code — software born from conversation, proven by the network.
        </p>
      </div>

      {/* Evolution stages with progressive scaling */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 mb-10">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex-1 flex items-center gap-3">
            <div
              className="glass-card flex-1 p-4 text-center"
              style={{
                transform: `scale(${stage.scale})`,
                borderColor: `${stage.color}20`,
                boxShadow: `0 ${2 + i * 2}px ${8 + i * 4}px ${stage.color}06`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = `scale(${stage.scale + 0.03})`;
                (e.currentTarget as HTMLElement).style.borderColor = `${stage.color}40`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 ${4 + i * 3}px ${16 + i * 6}px ${stage.color}12`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = `scale(${stage.scale})`;
                (e.currentTarget as HTMLElement).style.borderColor = `${stage.color}20`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 ${2 + i * 2}px ${8 + i * 4}px ${stage.color}06`;
              }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: stage.color }}>{stage.label}</div>
              <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{stage.desc}</div>
            </div>
            {i < stages.length - 1 && (
              <span
                className="hidden md:block text-lg"
                style={{
                  color: 'var(--text-secondary)',
                  opacity: 0.15 + (i * 0.15),
                  transition: 'opacity 0.3s',
                }}
              >
                &rarr;
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Open Infrastructure',
            desc: 'Every base flow is free to run. They\'re the building blocks — open, validated, and available to everyone.',
            color: 'var(--cyan)',
          },
          {
            title: 'Revenue Split',
            desc: '70% to creators. 15% to original authors (derivatives). 15% to validators. Enforced by smart contract. No middleman.',
            color: 'var(--gold)',
          },
          {
            title: 'AI Independent',
            desc: 'Graduated flows compile to code. They run without an LLM — deterministic, instant, zero token cost. Software born from language.',
            color: 'var(--green)',
          },
        ].map(card => (
          <TiltCard key={card.title} color={card.color}>
            <div className="text-xs font-bold mb-2" style={{ color: card.color }}>{card.title}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {card.desc}
            </p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

// ── Landing Page ──────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      <HeroSection />
      <SkillShowcase />
      <ComposerPreview />
      <TrustEconomy />
      <SkillEvolution />
      <FAQ />
    </>
  );
}
