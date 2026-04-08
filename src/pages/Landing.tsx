import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SkillShowcase from '../components/SkillShowcase';
import FAQ from '../components/FAQ';

// ── Composer Preview Section ──────────────────────────────────────

function ComposerPreview() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
          Chain skills together.{' '}
          <span style={{ color: 'var(--cyan)' }}>Visually.</span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Drag skills onto a canvas, connect them, customize inputs and outputs, then run the whole chain in Claude Code. Create skills that don't exist yet with natural language.
        </p>
      </div>

      {/* Mock composer visual */}
      <div
        className="rounded-xl overflow-hidden max-w-4xl mx-auto"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        {/* Toolbar mock */}
        <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>startup-validation</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,200,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.2)' }}>Validate</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,200,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.25)' }}>Export</span>
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: 'rgba(0,200,255,0.12)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.25)' }}>Run</span>
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', border: '1px solid rgba(255,215,0,0.2)' }}>Publish On-Chain</span>
        </div>

        {/* Canvas mock */}
        <div className="p-8 flex items-center justify-center gap-6 flex-wrap" style={{ background: 'rgba(5,5,10,0.8)', minHeight: '260px' }}>
          {[
            { name: 'idea-validator', domain: 'business', color: '#a855f7' },
            { name: 'market-research', domain: 'business', color: '#a855f7' },
            { name: 'pricing-strategy', domain: 'business', color: '#a855f7' },
            { name: 'pitch-practice', domain: 'marketing', color: '#ff69b4' },
          ].map((skill, i, arr) => (
            <div key={skill.name} className="flex items-center gap-4">
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(15,15,25,0.95)',
                  border: `1px solid ${skill.color}40`,
                  minWidth: '140px',
                }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: '#fff' }}>{skill.name}</div>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${skill.color}20`, color: skill.color }}>{skill.domain}</span>
              </div>
              {i < arr.length - 1 && (
                <span className="text-lg" style={{ color: 'var(--cyan)' }}>&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          to="/compose"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold no-underline transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,200,0.12), rgba(170,136,255,0.12))',
            border: '1px solid rgba(0,255,200,0.25)',
            color: 'var(--cyan)',
          }}
        >
          Open the Composer
          <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

// ── TRUST Economy Section ─────────────────────────────────────────

function TrustEconomy() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
          How{' '}
          <span style={{ color: 'var(--gold)' }}>TRUST</span>
          {' '}works
        </h2>
        <p className="text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          TRUST isn't bought. It's earned. Create skills, validate quality, publish chains, earn royalties.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            step: '1',
            title: 'Try Skills Free',
            desc: 'Run any skill for free in Claude Code. No wallet needed. See what AI can do with structured procedures.',
            color: 'var(--cyan)',
            bg: 'rgba(0,255,200,0.06)',
            border: 'rgba(0,255,200,0.15)',
          },
          {
            step: '2',
            title: 'Connect Wallet',
            desc: 'Create a MetaMask wallet right in your browser. Connect it on the site. This is your identity in the TRUST ecosystem.',
            color: 'var(--purple)',
            bg: 'rgba(170,136,255,0.06)',
            border: 'rgba(170,136,255,0.15)',
          },
          {
            step: '3',
            title: 'Compose & Publish',
            desc: 'Unlock the visual composer. Build chains from existing skills or create new ones. Publish on-chain — your wallet is credited as the author.',
            color: 'var(--gold)',
            bg: 'rgba(255,215,0,0.06)',
            border: 'rgba(255,215,0,0.15)',
          },
          {
            step: '4',
            title: 'Earn TRUST',
            desc: 'When others use your skills or derivatives of them, TRUST flows to your wallet. 70% to creators, 15% to validators, 15% to the treasury.',
            color: 'var(--green)',
            bg: 'rgba(0,255,136,0.06)',
            border: 'rgba(0,255,136,0.15)',
          },
        ].map(item => (
          <div
            key={item.step}
            className="p-5 rounded-xl"
            style={{ background: item.bg, border: `1px solid ${item.border}` }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-3"
              style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}
            >
              {item.step}
            </div>
            <h3 className="text-sm font-bold mb-2" style={{ color: item.color }}>{item.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg text-center" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--gold)' }}>Derivatives earn royalties for everyone in the chain.</span>{' '}
          If you modify someone's skill and publish it, 15% of TRUST earned goes to the original creator automatically via smart contract. Innovation compounds.
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
      <SkillShowcase />
      <ComposerPreview />
      <TrustEconomy />
      <FAQ />
    </>
  );
}
