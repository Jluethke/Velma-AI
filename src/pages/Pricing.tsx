import { useState } from 'react';
import { useMeta } from '../hooks/useMeta';

type BillingCycle = 'monthly' | 'annual';

interface Tier {
  name: string;
  tagline: string;
  usdMonthly: number | null;
  accent: string;
  accentBg: string;
  accentBorder: string;
  popular: boolean;
  features: string[];
  earning: string | null;
  cta: string;
  ctaLink: string;
}

const tiers: Tier[] = [
  {
    name: 'Explorer',
    tagline: 'Everything you need to start',
    usdMonthly: 0,
    accent: 'var(--cyan)',
    accentBg: 'rgba(0, 255, 200, 0.08)',
    accentBorder: 'rgba(0, 255, 200, 0.2)',
    popular: false,
    features: [
      'Start Fabric alignment sessions',
      'Post to Discovery — AI finds your counterpart',
      '165+ flows, 130+ pipelines',
      '5 flow runs/day',
      'Gamification (XP, levels, achievements)',
      'Community support',
    ],
    earning: 'Earn 10 TRUST/day just by using the platform',
    cta: 'Start Free',
    ctaLink: '/start',
  },
  {
    name: 'Builder',
    tagline: 'For individuals who run flows daily',
    usdMonthly: 5,
    accent: 'var(--cyan)',
    accentBg: 'rgba(0, 255, 200, 0.08)',
    accentBorder: 'rgba(0, 255, 200, 0.2)',
    popular: false,
    features: [
      'Everything in Explorer',
      '50 flow runs/day',
      'Build and save custom pipelines',
      'Export pipeline configs',
      'Community support',
    ],
    earning: 'Earn 50 TRUST/day — your subscription pays for itself',
    cta: 'Subscribe',
    ctaLink: '/portal/stake',
  },
  {
    name: 'Professional',
    tagline: 'For power users and solopreneurs',
    usdMonthly: 20,
    accent: 'var(--green)',
    accentBg: 'rgba(0, 255, 136, 0.08)',
    accentBorder: 'rgba(0, 255, 136, 0.2)',
    popular: true,
    features: [
      'Everything in Builder',
      '200 flow runs/day',
      'Fabric synthesis — Claude mediates your sessions',
      'Publish flows on-chain and earn royalties',
      'REST API access',
      'Usage analytics',
      'Email support',
    ],
    earning: 'Earn 200 TRUST/day — platform grows your balance',
    cta: 'Subscribe',
    ctaLink: '/portal/stake',
  },
  {
    name: 'Enterprise',
    tagline: 'For organisations at scale',
    usdMonthly: 100,
    accent: 'var(--gold)',
    accentBg: 'rgba(255, 215, 0, 0.08)',
    accentBorder: 'rgba(255, 215, 0, 0.2)',
    popular: false,
    features: [
      'Everything in Professional',
      'Unlimited flow runs',
      'White-label embedding',
      'Custom flow development',
      'SLA guarantee',
      'On-prem deployment',
      'SSO / SAML',
      'Dedicated support',
    ],
    earning: 'Unlimited earning — no daily cap',
    cta: 'Talk to Us',
    ctaLink: '/docs',
  },
];

const faqs = [
  {
    q: 'What does "paid in TRUST" mean?',
    a: 'Subscriptions are on-chain contracts paid in TRUST tokens. The price is fixed in USD ($5, $20, or $100/mo) — the TRUST amount adjusts automatically with the market price. As TRUST appreciates, you need fewer tokens each month. Your subscription is always the same dollar value.',
  },
  {
    q: 'How do I get TRUST tokens?',
    a: 'You earn TRUST by using the platform — running flows, validating quality, and publishing flows others use. You can also buy TRUST on-chain via the liquidity pool on Base. The free Explorer tier earns 10 TRUST/day just from normal use.',
  },
  {
    q: 'Can my earnings cover my subscription?',
    a: 'Yes. Builder earns 50 TRUST/day. At $0.10/TRUST that covers $150/month — well above the subscription cost. The more active you are and the more TRUST appreciates, the more your earnings offset your costs.',
  },
  {
    q: 'Do I need a crypto wallet?',
    a: 'Only for paid tiers. Explorer is completely wallet-free. Paid subscriptions are on-chain — you\'ll need a Base-compatible wallet (MetaMask, Rabby, Coinbase Wallet) with TRUST tokens to subscribe.',
  },
  {
    q: 'What network are the contracts on?',
    a: 'Base mainnet (chain ID 8453). TRUST token address: 0x61d6a2Ce3D89B509eD1Cf2323B609512584De247. Add it to any wallet under "Import token."',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Subscriptions are 30-day on-chain agreements — no lock-in. When your period expires, you revert to Explorer. No automatic renewal charges your wallet without a new on-chain transaction.',
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
  const isCustom = tier.usdMonthly === null;
  const price = billing === 'annual' && tier.usdMonthly
    ? Math.round(tier.usdMonthly * 12 * 0.83)
    : tier.usdMonthly;

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
          style={{ background: tier.accent, color: '#000' }}
        >
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-1" style={{ color: tier.accent }}>
          {tier.name}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {tier.tagline}
        </p>
      </div>

      {/* Price */}
      <div className="mb-2">
        {isCustom ? (
          <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Custom</span>
        ) : price === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Free</span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>forever</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${billing === 'annual' ? price : tier.usdMonthly}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              /{billing === 'annual' ? 'year' : 'mo'} in TRUST
            </span>
          </div>
        )}
      </div>

      {/* USD-denominated note */}
      {tier.usdMonthly !== null && tier.usdMonthly > 0 && (
        <p className="text-[10px] mb-5" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          Price fixed in USD — TRUST amount adjusts with market price
        </p>
      )}

      {billing === 'annual' && tier.usdMonthly && tier.usdMonthly > 0 && (
        <div
          className="text-[10px] font-semibold mb-5 px-2 py-0.5 rounded-full inline-block"
          style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--green)' }}
        >
          Save 17% vs monthly
        </div>
      )}

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-5" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <CheckIcon color={tier.accent} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Earning callout */}
      {tier.earning && (
        <div
          className="rounded-lg px-3 py-2 mb-5 text-[10px] font-semibold"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.15)',
            color: 'var(--gold)',
          }}
        >
          ↑ {tier.earning}
        </div>
      )}

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
  useMeta({
    title: 'Pricing — FlowFabric',
    description: 'Start free with 5 AI flow runs per day. Upgrade to Builder ($5/mo), Professional ($20/mo), or Enterprise ($100/mo) for more runs and features.',
    canonical: 'https://velma-ai.vercel.app/pricing',
  });

  const [billing, setBilling] = useState<BillingCycle>('monthly');

  return (
    <main className="pt-24 pb-20">
      {/* Header */}
      <section className="px-6 text-center max-w-4xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#ffffff' }}>
          Use it free.{' '}
          <span style={{ color: 'var(--cyan)' }}>Earn while you do.</span>
        </h1>
        <p className="text-sm leading-relaxed max-w-2xl mx-auto mb-3" style={{ color: 'var(--text-secondary)' }}>
          Every tier is paid in TRUST — the token you earn by using the platform.
          Prices are fixed in USD. The TRUST amount adjusts as the token appreciates.
          The more the network grows, the less your subscription costs in tokens.
        </p>
        <p className="text-xs mb-8" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
          On-chain contracts · Base mainnet · No credit card
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
      <section className="px-6 max-w-6xl mx-auto mb-16">
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          You don't need crypto to use FlowFabric. All paid plans accept card.{' '}
          <span style={{ color: 'var(--cyan)' }}>TRUST tokens</span> are optional.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} billing={billing} />
          ))}
        </div>
      </section>

      {/* Token callout */}
      <section className="px-6 max-w-4xl mx-auto mb-24">
        <div
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(251,191,36,0.03)',
            border: '1px solid rgba(251,191,36,0.12)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { label: '1B hard cap', desc: 'Total TRUST supply. Never more than one billion tokens — ever.', color: 'var(--gold)' },
              { label: '2% burned on every purchase', desc: 'Every premium flow purchase permanently removes 2% of the TRUST paid. Deflationary by design.', color: 'var(--green)' },
              { label: 'USD-fixed pricing', desc: 'Subscription prices never change in dollars. As TRUST appreciates, fewer tokens are needed each month.', color: 'var(--cyan)' },
            ].map(item => (
              <div key={item.label}>
                <div className="text-sm font-bold mb-1" style={{ color: item.color }}>{item.label}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: '#ffffff' }}>
          Frequently Asked Questions
        </h2>
        <p className="text-center text-xs mb-8" style={{ color: 'var(--text-secondary)' }}>
          How TRUST token pricing works.
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
