import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ValueCards from '../components/ValueCards';
import HowItWorks from '../components/HowItWorks';
import TokenEconomics from '../components/TokenEconomics';
import FAQ from '../components/FAQ';

function CreatorsSection() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ffffff' }}>
            Your skills have value.{' '}
            <span style={{ color: 'var(--cyan)' }}>Capture it.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            You have built AI workflows that save hours of work. Right now, they are locked inside one agent, one repo, one setup. Nobody benefits except you -- and only on that one platform.
          </p>
          <div className="space-y-4">
            {[
              { title: 'Publish once, works everywhere.', desc: 'Wrap your skill as a .skillpack with manifest, tests, and provenance. It works across Claude, GPT, Gemini, Cursor, and any open-source agent. Every purchase sends 70% of the price directly to your wallet.' },
              { title: 'Provenance is permanent.', desc: 'Every skill is hash-chained to its creation history. Forks and improvements link back to the original. Your contribution is recorded on-chain.' },
              { title: 'Reputation compounds.', desc: 'Your trust score grows with every successful validation. Higher trust means your skills rank higher in discovery, and you become eligible for validator rewards.' },
              { title: 'No gatekeepers.', desc: 'There is no review board. There is no approval process. If your skill passes shadow validation, it ships. Quality is enforced by math, not by committees.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-1 rounded-full shrink-0 mt-1" style={{ background: 'var(--cyan)', height: '16px' }} />
                <div>
                  <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>creator_dashboard.log</div>
          <div className="space-y-3 text-xs font-mono">
            <div><span style={{ color: 'var(--text-secondary)' }}>[publish]</span> <span style={{ color: 'var(--cyan)' }}>my-skill.skillpack</span> uploaded</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[validate]</span> <span style={{ color: 'var(--green)' }}>5/5 shadow runs passed</span></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[trust]</span> score: <span style={{ color: 'var(--cyan)' }}>0.847</span> (+0.023)</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[sale]</span> buyer node_x7f2... <span style={{ color: 'var(--gold)' }}>+70 TRUST</span></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[sale]</span> buyer node_k9m1... <span style={{ color: 'var(--gold)' }}>+70 TRUST</span></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[sale]</span> buyer node_p3a8... <span style={{ color: 'var(--gold)' }}>+70 TRUST</span></div>
            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>total earned:</span> <span style={{ color: 'var(--gold)' }}>210 TRUST</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValidatorsSection() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Visual */}
        <div
          className="p-6 rounded-xl order-2 lg:order-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>validator_run.log</div>
          <div className="space-y-3 text-xs font-mono">
            <div><span style={{ color: 'var(--text-secondary)' }}>[queue]</span> skill #42 entered validation</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[run 1]</span> similarity: <span style={{ color: 'var(--green)' }}>0.872</span> (1.24s)</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[run 2]</span> similarity: <span style={{ color: 'var(--green)' }}>0.891</span> (1.18s)</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[run 3]</span> similarity: <span style={{ color: 'var(--green)' }}>0.856</span> (1.31s)</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[run 4]</span> similarity: <span style={{ color: 'var(--green)' }}>0.903</span> (1.15s)</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[run 5]</span> similarity: <span style={{ color: 'var(--green)' }}>0.845</span> (1.27s)</div>
            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--green)' }}>PASSED</span> <span style={{ color: 'var(--text-secondary)' }}>| match: 100% | avg: 0.873</span>
            </div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[attest]</span> recorded on-chain <span style={{ color: 'var(--purple)' }}>tx:0x7f2a...</span></div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ffffff' }}>
            Earn by{' '}
            <span style={{ color: 'var(--green)' }}>proving quality.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Validators are the backbone of SkillChain. You run shadow tests on published skills, submit attestations, and earn rewards for every validation.
          </p>
          <div className="space-y-4">
            {[
              'A new skill enters the validation queue',
              'You run skillchain validate <skill_id>',
              'The SDK executes 5 shadow runs, comparing outputs to expected results',
              'Results are scored (60% Jaccard + 40% bigram similarity)',
              'Your attestation is recorded on-chain',
              'You earn 15% of every future purchase of skills you validated',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--green)', border: '1px solid rgba(0, 255, 136, 0.3)' }}
                >
                  {i + 1}
                </span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.15)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--green)' }}>Earning potential scales with trust.</span>{' '}
              Validators with higher trust scores receive more weight in consensus and are selected more frequently. Your competence directly determines your earning power -- not your wallet size.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportedPlatforms() {
  const platforms = [
    { name: 'Claude', status: 'Fully Supported', color: 'var(--green)', statusBg: 'rgba(0, 255, 136, 0.1)' },
    { name: 'GPT', status: 'Coming Q4 2026', color: 'var(--text-secondary)', statusBg: 'rgba(255, 255, 255, 0.05)' },
    { name: 'Gemini', status: 'Coming Q4 2026', color: 'var(--text-secondary)', statusBg: 'rgba(255, 255, 255, 0.05)' },
    { name: 'Cursor', status: 'Coming Q4 2026', color: 'var(--text-secondary)', statusBg: 'rgba(255, 255, 255, 0.05)' },
    { name: 'Any LLM', status: 'Generic Adapter', color: 'var(--text-secondary)', statusBg: 'rgba(255, 255, 255, 0.05)' },
  ];

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#ffffff' }}>
        One skill format.{' '}
        <span style={{ color: 'var(--cyan)' }}>Every agent.</span>
      </h2>
      <p className="text-center mb-12 text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
        SkillChain is agent-agnostic. Publish a skill from Claude and it works in GPT, Gemini, Cursor, or any LLM. The .skillpack format encodes the procedure, not the platform.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="p-5 rounded-xl text-center"
            style={{
              background: 'var(--bg-card)',
              border: p.name === 'Claude' ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid var(--border)',
            }}
          >
            <div className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
            <div
              className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full inline-block"
              style={{ background: p.statusBg, color: p.color }}
            >
              {p.status}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LifeProtocol() {
  const categories = [
    {
      name: 'Move',
      icon: '\u2764',
      desc: 'Exercise, walk, stay active. Verified by phone sensors and health APIs.',
      reward: '0.001-0.01 TRUST',
      color: 'var(--green)',
      colorBg: 'rgba(0, 255, 136, 0.1)',
      colorBorder: 'rgba(0, 255, 136, 0.2)',
    },
    {
      name: 'Learn',
      icon: '\u{1F4D6}',
      desc: 'Complete courses, earn certifications, acquire new skills.',
      reward: '0.1-1.0 TRUST',
      color: 'var(--cyan)',
      colorBg: 'rgba(0, 255, 200, 0.1)',
      colorBorder: 'rgba(0, 255, 200, 0.2)',
    },
    {
      name: 'Build',
      icon: '\u2692',
      desc: 'Ship code, create content, build things that matter.',
      reward: '0.5-5.0 TRUST',
      color: 'var(--purple)',
      colorBg: 'rgba(170, 136, 255, 0.1)',
      colorBorder: 'rgba(170, 136, 255, 0.2)',
    },
    {
      name: 'Teach',
      icon: '\u{1F393}',
      desc: 'Mentor, tutor, create educational content. Multiply capability.',
      reward: '1.0-10.0 TRUST',
      color: 'var(--gold)',
      colorBg: 'rgba(255, 215, 0, 0.1)',
      colorBorder: 'rgba(255, 215, 0, 0.2)',
    },
    {
      name: 'Serve',
      icon: '\u{1F91D}',
      desc: 'Volunteer, organize, contribute to open source and governance.',
      reward: '1.0-10.0 TRUST',
      color: '#ff6b6b',
      colorBg: 'rgba(255, 107, 107, 0.1)',
      colorBorder: 'rgba(255, 107, 107, 0.2)',
    },
    {
      name: 'Produce',
      icon: '\u{1F331}',
      desc: 'Grow food, generate energy, build infrastructure. Earns TRUST + GC.',
      reward: 'TRUST + GC',
      color: '#4ecdc4',
      colorBg: 'rgba(78, 205, 196, 0.1)',
      colorBorder: 'rgba(78, 205, 196, 0.2)',
    },
  ];

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-4">
        <span
          className="text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-4"
          style={{ background: 'rgba(0, 255, 200, 0.1)', color: 'var(--cyan)', border: '1px solid rgba(0, 255, 200, 0.3)' }}
        >
          Coming Q3 2026
        </span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#ffffff' }}>
        Earn TRUST by{' '}
        <span style={{ color: 'var(--cyan)' }}>Living.</span>
      </h2>
      <p className="text-center mb-12 text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
        Not mining. Not staking. Living. The Life Protocol rewards real human contribution -- physical activity, learning, building, teaching, and community service -- verified by the same trust-weighted attestation that validates AI skills.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="p-5 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${cat.colorBorder}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{cat.icon}</span>
              <h3 className="text-lg font-bold" style={{ color: cat.color }}>{cat.name}</h3>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{cat.desc}</p>
            <div
              className="text-[10px] font-semibold px-2 py-1 rounded-full inline-block"
              style={{ background: cat.colorBg, color: cat.color }}
            >
              {cat.reward}
            </div>
          </div>
        ))}
      </div>

      {/* How it works + bonuses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How it works</h3>
          <div className="space-y-3 text-xs font-mono">
            <div><span style={{ color: 'var(--text-secondary)' }}>[1]</span> <span style={{ color: 'var(--text-primary)' }}>Do something real</span> <span style={{ color: 'var(--text-secondary)' }}>// walk, learn, build, teach</span></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[2]</span> <span style={{ color: 'var(--text-primary)' }}>Proof captured</span> <span style={{ color: 'var(--text-secondary)' }}>// sensors, git, attestation</span></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[3]</span> <span style={{ color: 'var(--text-primary)' }}>Peers attest</span> <span style={{ color: 'var(--text-secondary)' }}>// trust-weighted verification</span></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>[4]</span> <span style={{ color: 'var(--gold)' }}>TRUST minted</span> <span style={{ color: 'var(--text-secondary)' }}>// directly to your wallet</span></div>
          </div>
        </div>

        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Bonuses</h3>
          <div className="space-y-3">
            {[
              { label: '7-day streak', value: '1.1x', color: 'var(--green)' },
              { label: '30-day streak', value: '1.3x', color: 'var(--cyan)' },
              { label: '90-day streak', value: '1.5x', color: 'var(--gold)' },
              { label: '3+ categories/day', value: '1.2x diversity', color: 'var(--purple)' },
            ].map((bonus) => (
              <div key={bonus.label} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>{bonus.label}</span>
                <span className="font-bold font-mono" style={{ color: bonus.color }}>{bonus.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-lg text-center" style={{ background: 'rgba(0, 255, 200, 0.05)', border: '1px solid rgba(0, 255, 200, 0.15)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--cyan)' }}>The more you live, the more you earn, the more you can do.</span>{' '}
          Traditional crypto rewards mining or staking. The Life Protocol rewards being productive, healthy, educated, and helpful.
        </p>
      </div>
    </section>
  );
}

function OnboardingRewardsSection() {
  const bonuses = [
    { icon: '\u{1F381}', label: 'Sign up', reward: '10 TRUST free', color: 'var(--cyan)' },
    { icon: '\u{1F4E6}', label: 'Publish first skill', reward: '50 TRUST bonus', color: 'var(--green)' },
    { icon: '\u2713', label: 'First validation', reward: '25 TRUST bonus', color: 'var(--green)' },
    { icon: '\u{1F6D2}', label: 'First purchase', reward: '10 TRUST bonus', color: 'var(--gold)' },
    { icon: '\u{1F44B}', label: 'Refer a friend', reward: '15 TRUST each', color: 'var(--purple)' },
  ];

  return (
    <section className="px-6 py-20 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#ffffff' }}>
        Get Started{' '}
        <span style={{ color: 'var(--gold)' }}>-- Earn Your First TRUST</span>
      </h2>
      <p className="text-center mb-10 text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
        New to SkillChain? Earn up to 110 TRUST just by getting started. No purchase required.
      </p>
      <div className="space-y-3 max-w-lg mx-auto">
        {bonuses.map((b) => (
          <div
            key={b.label}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{b.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{b.label}</span>
            </div>
            <span className="text-sm font-bold font-mono" style={{ color: b.color }}>{b.reward}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <a
          href="#get-started"
          className="inline-block px-8 py-3 rounded-lg text-sm font-bold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--cyan), var(--green))',
            color: '#000',
          }}
        >
          Start Earning Now
        </a>
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          Funded from the onboarding pool -- 10M TRUST allocated for early adopters.
        </p>
      </div>
    </section>
  );
}

function PricingPreview() {
  const previewTiers = [
    {
      name: 'Free',
      price: '$0',
      detail: 'forever',
      accent: 'var(--cyan)',
      accentBg: 'rgba(0, 255, 200, 0.08)',
      accentBorder: 'rgba(0, 255, 200, 0.2)',
      highlights: ['120+ skills & 66+ chains', '10 runs/day', 'Gamification & mining'],
    },
    {
      name: 'Pro',
      price: '$29',
      detail: '/mo',
      accent: 'var(--green)',
      accentBg: 'rgba(0, 255, 136, 0.08)',
      accentBorder: 'rgba(0, 255, 136, 0.2)',
      highlights: ['100 runs/day', 'REST API access', 'Custom private skills'],
      popular: true,
    },
    {
      name: 'Team',
      price: '$99',
      detail: '/seat/mo',
      accent: 'var(--purple)',
      accentBg: 'rgba(170, 136, 255, 0.08)',
      accentBorder: 'rgba(170, 136, 255, 0.2)',
      highlights: ['500 runs/day per seat', 'Team dashboard', 'Shared skills library'],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      detail: '',
      accent: 'var(--gold)',
      accentBg: 'rgba(255, 215, 0, 0.08)',
      accentBorder: 'rgba(255, 215, 0, 0.2)',
      highlights: ['Unlimited runs', 'White-label & on-prem', 'SLA & SSO / SAML'],
    },
  ];

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#ffffff' }}>
        Consumers play free.{' '}
        <span style={{ color: 'var(--cyan)' }}>Businesses pay.</span>
      </h2>
      <p className="text-center mb-12 text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
        Full access for individuals at no cost. Paid plans for teams and enterprises that need scale.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {previewTiers.map((tier) => (
          <div
            key={tier.name}
            className="relative p-5 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: tier.popular
                ? `1px solid ${tier.accentBorder.replace('0.2', '0.5')}`
                : '1px solid var(--border)',
              boxShadow: tier.popular ? `0 0 20px ${tier.accentBg}` : 'none',
            }}
          >
            {tier.popular && (
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full"
                style={{ background: tier.accent, color: '#000' }}
              >
                Most Popular
              </div>
            )}
            <h3 className="text-sm font-bold mb-1" style={{ color: tier.accent }}>{tier.name}</h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tier.price}</span>
              {tier.detail && (
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{tier.detail}</span>
              )}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-1.5">
              {tier.highlights.map((h) => (
                <li key={h} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M3 8.5L6.5 12L13 4" stroke={tier.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/pricing"
          className="inline-block px-8 py-3 rounded-lg text-sm font-bold transition-all no-underline"
          style={{
            background: 'rgba(0, 255, 200, 0.08)',
            border: '1px solid rgba(0, 255, 200, 0.25)',
            color: 'var(--cyan)',
          }}
        >
          View Full Pricing Details
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <HeroSection />
      <ValueCards />
      <OnboardingRewardsSection />
      <SupportedPlatforms />
      <HowItWorks />
      <CreatorsSection />
      <ValidatorsSection />
      <TokenEconomics />
      <LifeProtocol />
      <PricingPreview />
      <FAQ />
    </>
  );
}
