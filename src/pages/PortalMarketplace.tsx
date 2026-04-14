import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, keccak256, toBytes } from 'viem';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, TrustTokenABI, SkillRegistryABI, MarketplaceABI } from '../contracts';

interface MarketSkill {
  name: string;
  domain: string;
  price: number;
  creator: string;
  trustScore: number;
  validations: number;
  downloads: number;
  status: 'graduated' | 'validated' | 'pending';
}

const MOCK_SKILLS: MarketSkill[] = [
  { name: 'data-extractor',    domain: 'developer', price: 0,  creator: '0x1a2b...3c4d', trustScore: 0.95, validations: 48, downloads: 12400, status: 'graduated' },
  { name: 'resume-builder',    domain: 'career',    price: 5,  creator: '0x5e6f...7a8b', trustScore: 0.91, validations: 35, downloads: 8200,  status: 'graduated' },
  { name: 'code-review',       domain: 'developer', price: 10, creator: '0x9c0d...1e2f', trustScore: 0.88, validations: 52, downloads: 15600, status: 'graduated' },
  { name: 'budget-builder',    domain: 'finance',   price: 3,  creator: '0x3a4b...5c6d', trustScore: 0.93, validations: 29, downloads: 6100,  status: 'validated' },
  { name: 'security-hardening',domain: 'developer', price: 15, creator: '0x7e8f...9a0b', trustScore: 0.89, validations: 41, downloads: 9800,  status: 'graduated' },
  { name: 'meal-planner',      domain: 'life',      price: 2,  creator: '0xbc1d...2e3f', trustScore: 0.86, validations: 22, downloads: 4300,  status: 'validated' },
  { name: 'interview-coach',   domain: 'career',    price: 8,  creator: '0x4a5b...6c7d', trustScore: 0.90, validations: 31, downloads: 7500,  status: 'graduated' },
  { name: 'api-design',        domain: 'developer', price: 12, creator: '0x8e9f...0a1b', trustScore: 0.87, validations: 38, downloads: 11200, status: 'graduated' },
];

const DOMAINS = ['all', 'developer', 'career', 'finance', 'life', 'business', 'legal'];

// Tier daily limits by subscription tier index (0=Explorer…3=Enterprise)
const TIER_DAILY_LIMITS: (number | typeof Infinity)[] = [5, 50, 200, Infinity];

/** Derive a deterministic bytes32 skill ID from the skill name */
function skillIdFromName(name: string): `0x${string}` {
  return keccak256(toBytes(name));
}

function SkillAccessBadge({
  skill,
  address,
  onPurchase,
  isPurchasing,
}: {
  skill: MarketSkill;
  address: `0x${string}`;
  onPurchase: (skill: MarketSkill) => void;
  isPurchasing: boolean;
}) {
  const skillId = skillIdFromName(skill.name);
  const isPremium = skill.price > 0;

  // Check if user has already purchased this premium skill
  const { data: purchasedData } = useReadContract({
    address: CONTRACTS.Marketplace,
    abi: MarketplaceABI,
    functionName: 'hasPurchased',
    args: [address, skillId],
    query: { enabled: isPremium },
  });

  // Read subscription to derive daily remaining for free skills
  const { data: subData } = useReadContract({
    address: CONTRACTS.Marketplace,
    abi: MarketplaceABI,
    functionName: 'subscriptions',
    args: [address],
    query: { enabled: !isPremium },
  });

  const isPurchased = purchasedData === true;

  if (!isPremium) {
    const subTuple = subData as readonly [number, bigint, bigint, bigint] | undefined;
    const tierIndex = subTuple ? Number(subTuple[0]) : 0;
    const dailyUsed = subTuple ? Number(subTuple[2]) : 0;
    const expiresAt = subTuple ? Number(subTuple[1]) : 0;
    const isSubActive = tierIndex === 0 || expiresAt * 1000 > Date.now();
    const limit = isSubActive ? (TIER_DAILY_LIMITS[tierIndex] ?? 5) : 5;
    const remaining = limit === Infinity ? 'Unlimited' : String(Math.max(0, (limit as number) - dailyUsed));

    return (
      <div className="flex items-center gap-2">
        <div
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: 'var(--green)' }}
        >
          {remaining}/day left
        </div>
        <button
          className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all"
          style={{
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.3)',
            color: 'var(--green)',
            fontFamily: 'inherit',
          }}
        >
          Install
        </button>
      </div>
    );
  }

  if (isPurchased) {
    return (
      <div
        className="px-3 py-2 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(170,136,255,0.15)', border: '1px solid rgba(170,136,255,0.3)', color: 'var(--purple)' }}
      >
        Unlocked
      </div>
    );
  }

  // Premium, not yet purchased
  return (
    <button
      onClick={() => onPurchase(skill)}
      disabled={isPurchasing}
      className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all"
      style={{
        background: 'rgba(255,215,0,0.1)',
        border: '1px solid rgba(255,215,0,0.3)',
        color: 'var(--gold)',
        opacity: isPurchasing ? 0.5 : 1,
        fontFamily: 'inherit',
      }}
    >
      {isPurchasing ? 'Processing...' : `Purchase — ${skill.price} TRUST`}
    </button>
  );
}

function MarketplaceContent({ address }: { address: `0x${string}` }) {
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('all');
  const [sort, setSort] = useState<'downloads' | 'price' | 'trust'>('downloads');
  const [purchasingSkill, setPurchasingSkill] = useState<MarketSkill | null>(null);

  // Read balance for purchase power display
  const { data: rawBalance } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: TrustTokenABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // Read total registered skills from contract
  const { data: skillCount } = useReadContract({
    address: CONTRACTS.SkillRegistry,
    abi: SkillRegistryABI,
    functionName: 'skillCount',
  });

  // Step 1: approve TRUST spend
  const { writeContract: writeApprove, data: approveTxHash, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // Step 2: purchaseSkill
  const { writeContract: writePurchase, data: purchaseTxHash, isPending: isPurchasePending } = useWriteContract();
  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed } = useWaitForTransactionReceipt({ hash: purchaseTxHash });

  // After approve confirms, fire purchaseSkill
  useEffect(() => {
    if (isApproveConfirmed && purchasingSkill !== null) {
      writePurchase({
        address: CONTRACTS.Marketplace,
        abi: MarketplaceABI,
        functionName: 'purchaseSkill',
        args: [skillIdFromName(purchasingSkill.name)],
      });
    }
  }, [isApproveConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  // After purchase confirms, clear state
  useEffect(() => {
    if (isPurchaseConfirmed) {
      setPurchasingSkill(null);
    }
  }, [isPurchaseConfirmed]);

  const balance = rawBalance ? parseFloat(formatUnits(rawBalance as bigint, 18)) : 12450;
  const onChainSkills = skillCount ? Number(skillCount) : null;
  const isBusy = isApprovePending || isApproveConfirming || isPurchasePending || isPurchaseConfirming;

  function handlePurchase(skill: MarketSkill) {
    setPurchasingSkill(skill);
    writeApprove({
      address: CONTRACTS.TrustToken,
      abi: TrustTokenABI,
      functionName: 'approve',
      args: [CONTRACTS.Marketplace, parseUnits(String(skill.price), 18)],
    });
  }

  const filtered = MOCK_SKILLS
    .filter(s => domain === 'all' || s.domain === domain)
    .filter(s => s.name.includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'downloads') return b.downloads - a.downloads;
      if (sort === 'price') return a.price - b.price;
      return b.trustScore - a.trustScore;
    });

  return (
    <>
      {/* Balance bar */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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

      {/* Demo notice */}
      <div className="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: 'var(--gold)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Preview</span>
        <span style={{ opacity: 0.7 }}>Flow listings are sample data. Your balance and subscription above are live from chain.</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search flows..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
        />
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)' }}>
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all"
              style={{
                background: domain === d ? 'var(--bg-primary)' : 'transparent',
                color: domain === d ? 'var(--cyan)' : 'var(--text-secondary)',
                border: 'none', fontFamily: 'inherit',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'downloads' | 'price' | 'trust')}
          className="px-3 py-2 rounded-lg text-xs cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
        >
          <option value="downloads">Most Popular</option>
          <option value="trust">Highest Trust</option>
          <option value="price">Lowest Price</option>
        </select>
      </div>

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(skill => (
          <div
            key={skill.name}
            className="p-5 rounded-xl transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{skill.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{skill.domain} &middot; by {skill.creator}</div>
              </div>
              <div
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: skill.status === 'graduated' ? 'rgba(0,255,136,0.1)' : 'rgba(0,255,200,0.1)',
                  color: skill.status === 'graduated' ? 'var(--green)' : 'var(--cyan)',
                  border: `1px solid ${skill.status === 'graduated' ? 'rgba(0,255,136,0.2)' : 'rgba(0,255,200,0.2)'}`,
                }}
              >
                {skill.status}
              </div>
            </div>

            <div className="flex gap-4 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Trust: <span style={{ color: 'var(--cyan)' }}>{(skill.trustScore * 100).toFixed(0)}%</span></span>
              <span>Validations: <span style={{ color: 'var(--text-primary)' }}>{skill.validations}</span></span>
              <span>Downloads: <span style={{ color: 'var(--text-primary)' }}>{skill.downloads.toLocaleString()}</span></span>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-lg font-bold" style={{ color: skill.price === 0 ? 'var(--green)' : 'var(--gold)' }}>
                {skill.price === 0 ? 'FREE' : `${skill.price} TRUST`}
              </div>
              <SkillAccessBadge
                skill={skill}
                address={address}
                onPurchase={handlePurchase}
                isPurchasing={isBusy && purchasingSkill?.name === skill.name}
              />
            </div>
          </div>
        ))}
      </div>

      {purchaseTxHash && (
        <div className="mt-4 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
          Purchase tx:{' '}
          <a
            href={`https://basescan.org/tx/${purchaseTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--cyan)' }}
          >
            {purchaseTxHash.slice(0, 10)}...{purchaseTxHash.slice(-8)}
          </a>
        </div>
      )}
    </>
  );
}

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
        Browse, purchase, and deploy verified AI flows with TRUST tokens
      </p>

      {isConnected && address ? (
        <MarketplaceContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to Marketplace" />
      )}
    </div>
  );
}
