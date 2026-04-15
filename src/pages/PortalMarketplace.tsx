import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, TrustTokenABI, SkillRegistryABI } from '../contracts';
import { useSkills } from '../hooks/useSkills';
import { formatFlowName } from '../utils/formatFlowName';

// ── Subscription tier config ──────────────────────────────────────────────────

interface Tier {
  name: string;
  price: number;
  priceLabel: string;
  dailyLimit: string;
  benefit: string;
  color: string;
  colorRaw: string;
  minBalance: number;
  maxBalance: number;
}

const TIERS: Tier[] = [
  {
    name: 'Explorer',
    price: 0,
    priceLabel: 'Free',
    dailyLimit: '5 flows / day',
    benefit: 'Try any flow, no token required',
    color: 'var(--text-secondary)',
    colorRaw: 'rgba(161,161,170,0.15)',
    minBalance: 0,
    maxBalance: 50,
  },
  {
    name: 'Builder',
    price: 50,
    priceLabel: '50 TRUST / mo',
    dailyLimit: '50 flows / day',
    benefit: 'Full access to all catalog flows',
    color: 'var(--cyan)',
    colorRaw: 'rgba(56,189,248,0.15)',
    minBalance: 50,
    maxBalance: 200,
  },
  {
    name: 'Pro',
    price: 200,
    priceLabel: '200 TRUST / mo',
    dailyLimit: '200 flows / day',
    benefit: 'Priority execution + early access',
    color: 'var(--purple)',
    colorRaw: 'rgba(167,139,250,0.15)',
    minBalance: 200,
    maxBalance: 1000,
  },
  {
    name: 'Enterprise',
    price: 1000,
    priceLabel: '1000 TRUST / mo',
    dailyLimit: 'Unlimited',
    benefit: 'Unlimited flows, no daily cap',
    color: 'var(--gold)',
    colorRaw: 'rgba(251,191,36,0.15)',
    minBalance: 1000,
    maxBalance: Infinity,
  },
];

function activeTier(balance: number): Tier {
  if (balance >= 1000) return TIERS[3];
  if (balance >= 200) return TIERS[2];
  if (balance >= 50) return TIERS[1];
  return TIERS[0];
}

// ── Domain color map ──────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  money: 'var(--gold)',
  career: 'var(--cyan)',
  health: 'var(--green)',
  life: 'var(--purple)',
  developer: 'var(--cyan)',
  trading: 'var(--gold)',
  content: 'var(--purple)',
  home: 'var(--green)',
};

function domainColor(d: string): string {
  return DOMAIN_COLORS[d] ?? 'var(--text-secondary)';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TierCards({ balance }: { balance: number }) {
  const current = activeTier(balance);

  return (
    <section className="mb-12">
      <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
        Subscription Tiers
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {TIERS.map(tier => {
          const isCurrent = tier.name === current.name;
          return (
            <div
              key={tier.name}
              className="rounded-2xl p-5"
              style={{
                background: isCurrent ? tier.colorRaw : 'var(--bg-card)',
                border: `1px solid ${isCurrent ? tier.color : 'var(--border)'}`,
                opacity: isCurrent ? 1 : 0.55,
                transition: 'all 0.25s ease',
                position: 'relative',
              }}
            >
              {isCurrent && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: tier.colorRaw,
                    border: `1px solid ${tier.color}`,
                    color: tier.color,
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                  }}
                >
                  Current
                </span>
              )}
              <div className="text-base font-bold mb-1" style={{ color: isCurrent ? tier.color : 'var(--text-primary)' }}>
                {tier.name}
              </div>
              <div className="text-lg font-bold mb-3" style={{ color: isCurrent ? tier.color : 'var(--text-secondary)' }}>
                {tier.priceLabel}
              </div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {tier.dailyLimit}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {tier.benefit}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FlowCard({ skill }: { skill: { name: string; domain: string; description: string; price: string; free: boolean } }) {
  const displayName = formatFlowName(skill.name);
  const color = domainColor(skill.domain);
  const isFree = skill.free || skill.price === '0' || skill.price === '';

  return (
    <div
      className="glass-card flex flex-col"
      style={{ padding: '1.25rem', height: '100%' }}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            color,
          }}
        >
          {skill.domain}
        </div>
        {isFree ? (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.25)',
              color: 'var(--green)',
            }}
          >
            FREE
          </span>
        ) : (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.25)',
              color: 'var(--gold)',
            }}
          >
            {skill.price} TRUST
          </span>
        )}
      </div>

      <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.35 }}>
        {displayName}
      </div>

      <div
        className="text-sm mb-4 flex-1"
        style={{
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {skill.description}
      </div>

      <Link
        to={`/flow/${skill.name}`}
        className="btn-primary text-sm font-semibold px-4 py-2 rounded-xl text-center no-underline block"
        style={{ marginTop: 'auto' }}
      >
        Run Flow →
      </Link>
    </div>
  );
}

function FlowCatalog() {
  const { data: skills } = useSkills();
  const [activeDomain, setActiveDomain] = useState<string>('All');

  const allDomains = skills && skills.length > 0
    ? ['All', ...Array.from(new Set(skills.map(s => s.domain))).sort()]
    : ['All'];

  const filtered = activeDomain === 'All'
    ? (skills ?? [])
    : (skills ?? []).filter(s => s.domain === activeDomain);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          Flow Catalog
          {skills && skills.length > 0 && (
            <span className="ml-2 text-xs font-normal normal-case tracking-normal" style={{ color: 'var(--text-secondary)' }}>
              — {filtered.length} flow{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
      </div>

      {/* Domain filter tabs */}
      {skills && skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {allDomains.map(domain => {
            const isActive = domain === activeDomain;
            const color = domain === 'All' ? 'var(--cyan)' : domainColor(domain);
            return (
              <button
                key={domain}
                onClick={() => setActiveDomain(domain)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: isActive
                    ? `color-mix(in srgb, ${color} 15%, transparent)`
                    : 'var(--bg-card)',
                  border: `1px solid ${isActive ? color : 'var(--border)'}`,
                  color: isActive ? color : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {domain.charAt(0).toUpperCase() + domain.slice(1)}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid or empty state */}
      {!skills || skills.length === 0 ? (
        <div
          className="glass-card flex flex-col items-center justify-center text-center py-20 px-8"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            No flows registered yet.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Be the first to publish.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-center py-12" style={{ color: 'var(--text-secondary)' }}>
          No flows in the <strong style={{ color: 'var(--text-primary)' }}>{activeDomain}</strong> domain yet.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          {filtered.map(skill => (
            <FlowCard key={skill.name} skill={skill} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── MarketplaceContent ────────────────────────────────────────────────────────

function MarketplaceContent({ address }: { address: `0x${string}` }) {
  const { data: rawBalance } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: TrustTokenABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: skillCount } = useReadContract({
    address: CONTRACTS.SkillRegistry,
    abi: SkillRegistryABI,
    functionName: 'skillCount',
  });

  const balance = rawBalance ? parseFloat(formatUnits(rawBalance as bigint, 18)) : 0;
  const onChainSkills = skillCount ? Number(skillCount) : null;

  return (
    <>
      {/* Balance bar */}
      <div
        className="flex items-center justify-between mb-8 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your Balance</div>
            <div className="text-lg font-bold" style={{ color: 'var(--gold)' }}>{balance.toLocaleString()} TRUST</div>
          </div>
          {onChainSkills !== null && (
            <div className="pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>On-chain Flows</div>
              <div className="text-lg font-bold" style={{ color: 'var(--cyan)' }}>{onChainSkills}</div>
            </div>
          )}
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>

      <TierCards balance={balance} />
      <FlowCatalog />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortalMarketplace() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: 'var(--cyan)' }}>Portal</Link>
        <span>/</span>
        <span>Marketplace</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Flow Marketplace</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Browse and deploy verified AI flows. All flows are free while the network bootstraps.
      </p>

      {isConnected && address ? (
        <MarketplaceContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to Marketplace" />
      )}
    </div>
  );
}
