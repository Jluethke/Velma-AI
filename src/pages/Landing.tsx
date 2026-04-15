import { useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CategoryPicker from '../components/CategoryPicker';
import SkillShowcase from '../components/SkillShowcase';
import FAQ from '../components/FAQ';
import FabricWalkthrough from '../components/FabricWalkthrough';

// ── Discovery Section ─────────────────────────────────────────────

function DiscoverySection() {
  const posts = [
    { role: 'host', flow: 'kitchen-renovation', title: 'Need a kitchen designer in Austin', desc: 'Open plan reno, ~$40K budget. Looking for someone who has done modern-farmhouse before.', color: 'var(--cyan)', score: null },
    { role: 'guest', flow: 'interior-design-consult', title: 'Interior designer — Austin & remote', desc: 'Specialising in open-plan residential. Portfolio: 12 completed kitchens 2023–24.', color: 'var(--purple)', score: 9.2 },
    { role: 'guest', flow: 'contractor-bid', title: 'Licensed GC — kitchens & baths', desc: 'Base in Austin. Modern builds preferred. Availability: Q3 2026.', color: 'var(--green)', score: 7.8 },
  ];

  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="flex justify-center mb-8">
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.2)',
            color: 'var(--cyan)',
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
          Fabric Discovery
        </span>
      </div>

      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          The network that finds{' '}
          <span style={{ color: 'var(--cyan)' }}>the other end.</span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Post what you need in plain English. Claude reads every listing on the board, scores the best counterparts, and puts everyone in the same Fabric session. No search. No cold outreach. No back-and-forth.
        </p>
      </div>

      {/* Mock discovery board */}
      <div className="glass-card p-5 md:p-8 max-w-2xl mx-auto mb-12" style={{ borderColor: 'rgba(56,189,248,0.15)' }}>
        <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block', boxShadow: '0 0 8px rgba(56,189,248,0.8)' }} />
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--cyan)' }}>discovery board</span>
          <span className="text-xs ml-auto px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--cyan)', border: '1px solid rgba(56,189,248,0.2)' }}>Claude scoring&hellip;</span>
        </div>

        <div className="flex flex-col gap-3">
          {posts.map((post, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: i === 0 ? `rgba(56,189,248,0.04)` : 'rgba(255,255,255,0.02)', border: `1px solid ${post.color}20` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-semibold mr-2" style={{ color: post.color, opacity: 0.7 }}>{post.role}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>{post.flow}</span>
                </div>
                {post.score !== null && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: post.score >= 9 ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.1)', color: post.score >= 9 ? 'var(--green)' : 'var(--gold)', border: `1px solid ${post.score >= 9 ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.2)'}` }}>
                    {post.score} match
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{post.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.desc}</div>
              {post.score !== null && post.score >= 9 && (
                <div className="mt-3 text-xs py-2 rounded-lg font-semibold text-center cursor-default" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--green)' }}>
                  Accept &amp; start Fabric session &rarr;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {[
          { title: 'Every industry. Every role.', desc: 'Homeowners and contractors. Founders and investors. Freelancers and clients. Candidates and hiring managers. The board is open to any intent, any market, any size.', color: 'var(--cyan)' },
          { title: 'Claude reads both sides.', desc: 'AI scores every possible match on your behalf — reviewing descriptions, context, and fit. You see the reasoning, set the threshold, and decide. The human always makes the call.', color: 'var(--purple)' },
          { title: 'One tap into a structured session.', desc: 'Accepting a match creates a Fabric alignment session instantly. Both parties enter with their context. The flow mediates. No scheduling, no cold DMs, no wasted calls.', color: 'var(--green)' },
        ].map(card => (
          <div key={card.title} className="glass-card p-5" style={{ borderColor: `${card.color}10` }}>
            <div className="text-xs font-bold mb-2" style={{ color: card.color }}>{card.title}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/discover"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold no-underline"
        >
          Post your first listing &rarr;
        </Link>
        <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
          Free &middot; No account &middot; Claude handles the search
        </p>
      </div>
    </section>
  );
}

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
          Build pipelines.{' '}
          <span className="gradient-text">Visually.</span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          The web Composer lets you drag flows onto a canvas, connect them into pipelines, and publish them on-chain. Prefer natural language? The Claude Desktop MCP server does the same thing — just describe what you need.
        </p>
      </div>

      {/* Mock composer visual */}
      <div
        className="glass-card overflow-hidden max-w-4xl mx-auto"
        style={{ padding: 0 }}
      >
        {/* Toolbar mock */}
        <div
          className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 flex-wrap overflow-x-hidden"
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
          to="/studio?tab=chain"
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
      title: 'Sessions run on flows',
      desc: 'Every Fabric session is powered by a structured flow — a procedure that shapes the questions, the format, and the quality of Claude\'s synthesis.',
      color: 'var(--cyan)',
    },
    {
      step: '2',
      title: 'Contributors built them',
      desc: 'Every flow was built by someone in the network. When a session runs on their flow, they earn. 70% to the creator, 15% to validators who proved it works.',
      color: 'var(--purple)',
    },
    {
      step: '3',
      title: 'Better flows, better sessions',
      desc: 'The more sessions run, the more creators earn, the more they build. Fork an existing flow, improve it, publish it — the original author earns royalties on your version forever.',
      color: 'var(--gold)',
    },
    {
      step: '4',
      title: 'Anyone can earn',
      desc: 'Connect a wallet, build flows people use, validate quality. Your contributions are on-chain — provenance, royalties, and reputation that no platform can revoke.',
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
          The earners{' '}
          <span className="gradient-text-gold">behind every session</span>
        </h2>
        <p className="text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Collaboration is seamless. Behind it is an open network of contributors who build the flows, prove they work, and earn when they run.
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
      <div className="flex flex-col md:flex-row items-stretch gap-3 mb-10" style={{ overflow: 'hidden' }}>
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

// ── Fabric Section ────────────────────────────────────────────────

function FabricSection() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="flex justify-center mb-8">
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
            color: 'var(--purple)',
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
          Fabric Sessions
        </span>
      </div>

      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Put everyone in the{' '}
          <span style={{ color: 'var(--purple)' }}>same room.</span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Discovery finds your match. Fabric is what happens next.
          Each side enters their context privately. The flow mediates.
          Both parties see the synthesis and decide together.
          No account needed for the other person &mdash; just a link.
        </p>
      </div>

      {/* Fabric mockup */}
      <div
        className="glass-card p-5 md:p-8 max-w-2xl mx-auto mb-12"
        style={{ borderColor: 'rgba(167,139,250,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block', boxShadow: '0 0 8px rgba(167,139,250,0.8)' }} />
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--purple)' }}>contract-scope-alignment</span>
          <span className="text-xs ml-auto font-semibold uppercase tracking-widest" style={{ color: 'var(--purple)', opacity: 0.5 }}>Fabric</span>
        </div>

        {/* Privacy notice */}
        <div className="flex items-center justify-center gap-1.5 mb-4 text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.45 }}>
          <span>&#128274;</span>
          <span>Each side submits privately &mdash; neither party sees the other&apos;s raw inputs</span>
        </div>

        {/* Two sides */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
          {[
            {
              label: 'You',
              color: 'var(--cyan)',
              bg: 'rgba(56,189,248,0.04)',
              border: 'rgba(56,189,248,0.1)',
              items: ['Budget ceiling: $24K', 'Timeline: 6 weeks firm', 'Quality over speed'],
            },
            {
              label: 'Sarah Chen',
              color: 'var(--purple)',
              bg: 'rgba(167,139,250,0.04)',
              border: 'rgba(167,139,250,0.1)',
              items: ['Budget ceiling: $30K', 'Timeline: 8 weeks ideal', 'Speed, then quality'],
              guest: true,
            },
          ].map(side => (
            <div key={side.label} className="rounded-xl p-3 md:p-4" style={{ background: side.bg, border: `1px solid ${side.border}` }}>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: side.bg, border: `1px solid ${side.border}`, color: side.color }}>
                  {side.label[0]}
                </div>
                <span className="text-xs font-semibold" style={{ color: side.color }}>{side.label}</span>
                {side.guest && <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>guest link</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                {side.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-xs mt-0.5 shrink-0" style={{ color: side.color }}>✓</span>
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Synthesis */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--purple)', opacity: 0.6 }}>Synthesis</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--green)' }}>✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>Budget overlap — room to meet at <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>$26K</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--gold)' }}>→</span>
              <span style={{ color: 'var(--text-secondary)' }}>Timeline gap: 2 weeks. Suggest <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>7 weeks with 4-week review</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'var(--gold)' }}>→</span>
              <span style={{ color: 'var(--text-secondary)' }}>Priority mismatch — worth 10 minutes at the start of the call</span>
            </div>
          </div>
        </div>

        <div className="w-full text-xs py-2.5 rounded-lg font-semibold text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--purple)' }}>
          Send Fabric link to Sarah →
        </div>
      </div>

      {/* Three truths */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {[
          { title: 'Your answers stay private.', desc: "Each side submits their own context independently. The other party never sees your raw inputs — only the synthesis. What you share is between you and the flow.", color: 'var(--cyan)' },
          { title: 'No account needed.', desc: 'Send anyone a link. They answer their side in the browser. No install, no signup, no friction.', color: 'var(--purple)' },
          { title: 'Works for any transaction.', desc: 'A contract scope call. A kitchen brief to three builders. A co-founder alignment. A sales call where both sides prep first. The flow is what makes it structured.', color: 'var(--green)' },
        ].map(card => (
          <TiltCard key={card.title} color={card.color}>
            <div className="text-xs font-bold mb-2" style={{ color: card.color }}>{card.title}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>
          </TiltCard>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/discover"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold no-underline"
          style={{ borderColor: 'rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.1)', color: 'var(--purple)' }}
        >
          Find your match &rarr;
        </Link>
        <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
          Post free &middot; Claude scores &middot; One tap to Fabric
        </p>
      </div>
    </section>
  );
}

// ── Landing Page ──────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      <HeroSection />
      <CategoryPicker />
      <SkillShowcase />
      <DiscoverySection />
      <FabricSection />
      <FabricWalkthrough />
      <ComposerPreview />
      <TrustEconomy />
      <SkillEvolution />
      <FAQ />
    </>
  );
}
