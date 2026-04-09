import { useState } from 'react';
import { Link } from 'react-router-dom';

type BillingCycle = 'monthly' | 'annual';

interface Tier {
  name: string;
  tagline: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  accent: string;
  accentBg: string;
  accentBorder: string;
  popular: boolean;
  features: string[];
  cta: string;
  ctaLink: string;
  perSeat?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    tagline: 'Everything a person needs',
    monthlyPrice: 0,
    annualPrice: 0,
    accent: 'var(--cyan)',
    accentBg: 'rgba(0, 255, 200, 0.08)',
    accentBorder: 'rgba(0, 255, 200, 0.2)',
    popular: false,
    features: [
      '120+ AI flows',
      '66+ flow chains',
      'Plain-English flow discovery',
      'Gamification (XP, levels, achievements, streaks)',
      'Flow mining -- earn 50 TRUST/day',
      '10 flow runs/day',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaLink: '/skill/budget-builder',
  },
  {
    name: 'Pro',
    tagline: 'For power users and solopreneurs',
    monthlyPrice: 29,
    annualPrice: 290,
    accent: 'var(--green)',
    accentBg: 'rgba(0, 255, 136, 0.08)',
    accentBorder: 'rgba(0, 255, 136, 0.2)',
    popular: true,
    features: [
      'Everything in Free',
      '100 flow runs/day',
      'Custom private flows',
      'REST API access',
      'Priority LLM execution',
      'Usage analytics',
      '200 TRUST/day mining cap',
      'Email support',
    ],
    cta: 'Start Pro Trial',
    ctaLink: '/compose',
  },
  {
    name: 'Team',
    tagline: 'For teams building with AI',
    monthlyPrice: 99,
    annualPrice: 990,
    accent: 'var(--purple)',
    accentBg: 'rgba(170, 136, 255, 0.08)',
    accentBorder: 'rgba(170, 136, 255, 0.2)',
    popular: false,
    perSeat: true,
    features: [
      'Everything in Pro',
      '500 flow runs/day per seat',
      'Team dashboard',
      'Shared flows library',
      'Team analytics',
      '500 TRUST/day mining cap',
      'Priority support',
    ],
    cta: 'Contact Sales',
    ctaLink: '/compose',
  },
  {
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    monthlyPrice: null,
    annualPrice: null,
    accent: 'var(--gold)',
    accentBg: 'rgba(255, 215, 0, 0.08)',
    accentBorder: 'rgba(255, 215, 0, 0.2)',
    popular: false,
    features: [
      'Everything in Team',
      'Unlimited flow runs',
      'White-label embedding',
      'SLA guarantee',
      'Custom flow development',
      'On-prem deployment',
      'Dedicated support',
      'SSO / SAML',
    ],
    cta: 'Talk to Us',
    ctaLink: '/docs',
  },
];

const faqs = [
  {
    q: 'What\'s the difference between TRUST tokens and USD subscription?',
    a: 'TRUST tokens are the on-chain currency of the FlowFabric network. You earn them by running flows, validating quality, and contributing to the ecosystem. USD subscriptions unlock higher usage limits, API access, and team features. You can use FlowFabric entirely for free with TRUST tokens -- the paid tiers are for businesses that need higher throughput and enterprise tooling.',
  },
  {
    q: 'Can I use FlowFabric without paying anything?',
    a: 'Yes. The Free tier gives you access to all 120+ flows and 66+ chains with 10 runs per day. You earn TRUST tokens through flow mining and can use those tokens within the ecosystem. Most individual users never need a paid plan.',
  },
  {
    q: 'What happens if I hit my daily limit?',
    a: 'You will see a notification that your daily runs are exhausted. Your limit resets at midnight UTC. You can upgrade your plan at any time to increase your daily limit, or wait for the reset.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. All paid plans are billed monthly or annually with no lock-in. You can cancel from your dashboard at any time. If you cancel an annual plan, you retain access until the end of your billing period.',
  },
  {
    q: 'Do I need a crypto wallet?',
    a: 'No. A wallet is optional. If you connect one, you can receive TRUST tokens on-chain and participate in governance. Without a wallet, your TRUST balance is tracked in your account and you can still use all platform features.',
  },
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M3 8.5L6.5 12L13 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease',
        flexShrink: 0,
      }}
    >
      <path d="M4 6L8 10L12 6" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TierCard({ tier, billing }: { tier: Tier; billing: BillingCycle }) {
  const isCustom = tier.monthlyPrice === null;
  const price = billing === 'annual' && tier.annualPrice !== null
    ? tier.annualPrice
    : tier.monthlyPrice;
  const monthlySavings = tier.monthlyPrice && tier.annualPrice
    ? Math.round(((tier.monthlyPrice * 12 - tier.annualPrice) / (tier.monthlyPrice * 12)) * 100)
    : 0;

  return (
    <div
      className="relative flex flex-col p-6 rounded-xl transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: tier.popular
          ? `1px solid ${tier.accentBorder.replace('0.2', '0.5')}`
          : `1px solid var(--border)`,
        boxShadow: tier.popular
          ? `0 0 30px ${tier.accentBg}, 0 0 60px ${tier.accentBg}`
          : 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 25px ${tier.accentBg}`;
        (e.currentTarget as HTMLDivElement).style.borderColor = tier.accentBorder.replace('0.2', '0.4');
      }}
      onMouseLeave={(e) => {
        if (tier.popular) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${tier.accentBg}, 0 0 60px ${tier.accentBg}`;
          (e.currentTarget as HTMLDivElement).style.borderColor = tier.accentBorder.replace('0.2', '0.5');
        } else {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        }
      }}
    >
      {tier.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full"
          style={{
            background: tier.accent,
            color: '#000',
          }}
        >
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3
          className="text-lg font-bold mb-1"
          style={{ color: tier.accent }}
        >
          {tier.name}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {tier.tagline}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {isCustom ? (
          <div>
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Custom</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${price}
            </span>
            {price! > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                /{billing === 'annual' ? 'year' : 'mo'}
                {tier.perSeat ? ' per seat' : ''}
              </span>
            )}
            {price === 0 && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                forever
              </span>
            )}
          </div>
        )}
        {billing === 'annual' && monthlySavings > 0 && (
          <div
            className="text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full inline-block"
            style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--green)' }}
          >
            Save {monthlySavings}% vs monthly
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <CheckIcon color={tier.accent} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={tier.ctaLink}
        className="block text-center px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 no-underline"
        style={{
          background: tier.popular
            ? `linear-gradient(135deg, ${tier.accent}, ${tier.accent}dd)`
            : tier.accentBg,
          color: tier.popular ? '#000' : tier.accent,
          border: tier.popular ? 'none' : `1px solid ${tier.accentBorder}`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px ${tier.accentBg}`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
        }}
      >
        {tier.cta}
      </a>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: open ? '1px solid rgba(0, 255, 200, 0.2)' : '1px solid var(--border)',
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{q}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  return (
    <main className="pt-24 pb-20">
      {/* Header */}
      <section className="px-6 text-center max-w-4xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#ffffff' }}>
          Consumers play free.{' '}
          <span style={{ color: 'var(--cyan)' }}>Businesses pay.</span>
        </h1>
        <p className="text-sm leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
          Every individual gets full access to the FlowFabric flow marketplace at no cost.
          Paid plans unlock higher throughput, API access, and team collaboration for organizations.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <button
            className="px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200"
            style={{
              background: billing === 'monthly' ? 'rgba(0, 255, 200, 0.12)' : 'transparent',
              color: billing === 'monthly' ? 'var(--cyan)' : 'var(--text-secondary)',
              border: billing === 'monthly' ? '1px solid rgba(0, 255, 200, 0.25)' : '1px solid transparent',
            }}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className="px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2"
            style={{
              background: billing === 'annual' ? 'rgba(0, 255, 200, 0.12)' : 'transparent',
              color: billing === 'annual' ? 'var(--cyan)' : 'var(--text-secondary)',
              border: billing === 'annual' ? '1px solid rgba(0, 255, 200, 0.25)' : '1px solid transparent',
            }}
            onClick={() => setBilling('annual')}
          >
            Annual
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0, 255, 136, 0.15)', color: 'var(--green)' }}
            >
              Save 17%
            </span>
          </button>
        </div>
      </section>

      {/* Tier cards */}
      <section className="px-6 max-w-6xl mx-auto mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} billing={billing} />
          ))}
        </div>
      </section>

      {/* Comparison callout */}
      <section className="px-6 max-w-4xl mx-auto mb-24">
        <div
          className="p-6 rounded-xl text-center"
          style={{
            background: 'rgba(0, 255, 200, 0.04)',
            border: '1px solid rgba(0, 255, 200, 0.12)',
          }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Not sure which plan is right?
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Start free. Upgrade only when your usage demands it. Every plan includes full access
            to the flow marketplace, gamification, and TRUST token mining.
          </p>
          <Link
            to="/compose"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 no-underline"
            style={{
              background: 'linear-gradient(135deg, var(--cyan), var(--green))',
              color: '#000',
            }}
          >
            Explore Flows for Free
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: '#ffffff' }}>
          Frequently Asked Questions
        </h2>
        <p className="text-center text-xs mb-8" style={{ color: 'var(--text-secondary)' }}>
          Everything you need to know about FlowFabric pricing.
        </p>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </main>
  );
}
