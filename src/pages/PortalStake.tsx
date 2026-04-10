import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, StakingABI, TrustTokenABI, MarketplaceABI } from '../contracts';

const MOCK_STAKE = {
  available: 4450.0,
  staked: 8000.0,
  pendingRewards: 234.5,
  lockPeriod: '7 days',
  apy: '12.4%',
  minStake: 100,
  validators: 1247,
  totalStaked: '48.2M',
};

const STAKE_HISTORY = [
  { action: 'Staked', amount: '2,000', date: 'Apr 3, 2026', status: 'Active' },
  { action: 'Staked', amount: '3,000', date: 'Mar 28, 2026', status: 'Active' },
  { action: 'Staked', amount: '3,000', date: 'Mar 15, 2026', status: 'Active' },
  { action: 'Reward Claimed', amount: '189.20', date: 'Mar 31, 2026', status: 'Completed' },
  { action: 'Unstaked', amount: '1,000', date: 'Mar 10, 2026', status: 'Completed' },
];

// Subscription tier definitions (index matches Marketplace SubscriptionTier enum)
const SUB_TIERS = [
  { index: 0, name: 'Explorer',   price: 0,    daily: 5,        color: 'var(--text-secondary)', accent: 'rgba(120,120,140,0.15)', border: 'rgba(120,120,140,0.3)' },
  { index: 1, name: 'Builder',    price: 50,   daily: 50,       color: 'var(--cyan)',            accent: 'rgba(0,255,200,0.1)',    border: 'rgba(0,255,200,0.3)' },
  { index: 2, name: 'Pro',        price: 200,  daily: 200,      color: 'var(--purple)',          accent: 'rgba(170,136,255,0.1)', border: 'rgba(170,136,255,0.3)' },
  { index: 3, name: 'Enterprise', price: 1000, daily: Infinity, color: 'var(--gold)',            accent: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.3)' },
] as const;

type SubTierIndex = 0 | 1 | 2 | 3;

function SubscriptionSection({ address }: { address: `0x${string}` }) {
  const [subscribingTier, setSubscribingTier] = useState<SubTierIndex | null>(null);

  // Read current subscription
  const { data: subData, refetch: refetchSub } = useReadContract({
    address: CONTRACTS.Marketplace,
    abi: MarketplaceABI,
    functionName: 'subscriptions',
    args: [address],
  });

  // Step 1: approve TRUST spend
  const { writeContract: writeApprove, data: approveTxHash, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // Step 2: subscribe
  const { writeContract: writeSubscribe, data: subscribeTxHash, isPending: isSubscribePending } = useWriteContract();
  const { isLoading: isSubscribeConfirming, isSuccess: isSubscribeConfirmed } = useWaitForTransactionReceipt({ hash: subscribeTxHash });

  // After approve confirms, fire the subscribe transaction
  useEffect(() => {
    if (isApproveConfirmed && subscribingTier !== null) {
      writeSubscribe({
        address: CONTRACTS.Marketplace,
        abi: MarketplaceABI,
        functionName: 'subscribe',
        args: [subscribingTier],
      });
    }
  }, [isApproveConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  // After subscribe confirms, refresh subscription data
  useEffect(() => {
    if (isSubscribeConfirmed) {
      refetchSub();
      setSubscribingTier(null);
    }
  }, [isSubscribeConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  const subTuple = subData as readonly [number, bigint, bigint, bigint] | undefined;
  const currentTierIndex = subTuple ? Number(subTuple[0]) : 0;
  const expiresAt = subTuple ? Number(subTuple[1]) : 0;
  const dailyUsed = subTuple ? Number(subTuple[2]) : 0;

  const currentTier = SUB_TIERS[currentTierIndex as SubTierIndex] ?? SUB_TIERS[0];
  const dailyLimit = currentTier.daily;
  const dailyRemaining = dailyLimit === Infinity ? 'Unlimited' : String(Math.max(0, dailyLimit - dailyUsed));

  const isActive = expiresAt * 1000 > Date.now();
  const expiresLabel = expiresAt > 0
    ? new Date(expiresAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const isBusy = isApprovePending || isApproveConfirming || isSubscribePending || isSubscribeConfirming;

  function handleSubscribe(tierIdx: SubTierIndex) {
    const tier = SUB_TIERS[tierIdx];
    setSubscribingTier(tierIdx);

    if (tier.price === 0) {
      // Explorer is free — call subscribe directly, no approve needed
      writeSubscribe({
        address: CONTRACTS.Marketplace,
        abi: MarketplaceABI,
        functionName: 'subscribe',
        args: [tierIdx],
      });
    } else {
      // Approve first; subscribe fires via useEffect when approve confirms
      writeApprove({
        address: CONTRACTS.TrustToken,
        abi: TrustTokenABI,
        functionName: 'approve',
        args: [CONTRACTS.Marketplace, parseUnits(String(tier.price), 18)],
      });
    }
  }

  return (
    <div className="mt-8 rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Subscription</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
        Subscribe to a tier to increase your daily flow quota. Premium flows don&apos;t consume your quota.
      </p>

      {/* Current status bar */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Current Tier</div>
          <div className="text-sm font-semibold" style={{ color: currentTier.color }}>{currentTier.name}</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Status</div>
          <div className="text-sm font-semibold" style={{ color: (currentTierIndex === 0 || isActive) ? 'var(--green)' : 'var(--text-secondary)' }}>
            {currentTierIndex === 0 ? 'Free' : isActive ? 'Active' : 'Expired'}
          </div>
        </div>
        {currentTierIndex > 0 && (
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Expires</div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{expiresLabel}</div>
          </div>
        )}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Daily Remaining</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>{dailyRemaining}</div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SUB_TIERS.map(tier => {
          const isCurrent = tier.index === currentTierIndex && (tier.index === 0 || isActive);
          const isThisBusy = isBusy && subscribingTier === tier.index;

          return (
            <div
              key={tier.index}
              className="p-4 rounded-xl flex flex-col gap-3 transition-all"
              style={{
                background: isCurrent ? tier.accent : 'var(--bg-primary)',
                border: `1px solid ${isCurrent ? tier.border : 'var(--border)'}`,
              }}
            >
              <div>
                <div className="text-sm font-semibold mb-1" style={{ color: tier.color }}>{tier.name}</div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {tier.price === 0 ? 'Free' : `${tier.price} TRUST`}
                  {tier.price > 0 && <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>/mo</span>}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {tier.daily === Infinity ? 'Unlimited' : tier.daily} flows/day
                </div>
              </div>

              {isCurrent ? (
                <div
                  className="w-full py-1.5 rounded-lg text-xs font-medium text-center"
                  style={{ background: tier.accent, border: `1px solid ${tier.border}`, color: tier.color }}
                >
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(tier.index as SubTierIndex)}
                  disabled={isBusy}
                  className="w-full py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: tier.accent,
                    border: `1px solid ${tier.border}`,
                    color: tier.color,
                    opacity: isBusy ? 0.5 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {isThisBusy
                    ? (isApprovePending || isApproveConfirming ? 'Approving...' : 'Subscribing...')
                    : tier.index < currentTierIndex
                      ? 'Downgrade'
                      : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {subscribeTxHash && (
        <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
          Subscription tx:{' '}
          <a
            href={`https://basescan.org/tx/${subscribeTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--cyan)' }}
          >
            {subscribeTxHash.slice(0, 10)}...{subscribeTxHash.slice(-8)}
          </a>
        </div>
      )}
    </div>
  );
}

function StakeContent({ address }: { address: `0x${string}` }) {
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'stake' | 'unstake'>('stake');

  // Read on-chain balance
  const { data: rawBalance } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: TrustTokenABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // Read staking tier
  const { data: stakingTier } = useReadContract({
    address: CONTRACTS.Staking,
    abi: StakingABI,
    functionName: 'getTier',
    args: [address],
  });

  // Write: stake tokens
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const balance = rawBalance ? parseFloat(formatUnits(rawBalance as bigint, 18)) : MOCK_STAKE.available;

  const handleStake = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    writeContract({
      address: CONTRACTS.Staking,
      abi: StakingABI,
      functionName: 'completeUnstake', // Placeholder — real stake function TBD
      args: ['0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`],
    });
  };

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Staking Panel */}
        <div className="md:col-span-2">
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              {(['stake', 'unstake'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{
                    background: tab === t ? 'var(--bg-card)' : 'transparent',
                    color: tab === t ? 'var(--cyan)' : 'var(--text-secondary)',
                    border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Amount</label>
                <button
                  onClick={() => setAmount(tab === 'stake' ? balance.toString() : MOCK_STAKE.staked.toString())}
                  className="text-xs cursor-pointer"
                  style={{ background: 'none', border: 'none', color: 'var(--cyan)' }}
                >
                  MAX: {(tab === 'stake' ? balance : MOCK_STAKE.staked).toLocaleString()} TRUST
                </button>
              </div>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 text-lg"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <div className="px-4 py-3 flex items-center text-sm font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  TRUST
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2 mb-6 p-4 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Estimated APY</span>
                <span style={{ color: 'var(--green)' }}>{MOCK_STAKE.apy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Lock Period</span>
                <span style={{ color: 'var(--text-primary)' }}>{MOCK_STAKE.lockPeriod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Minimum Stake</span>
                <span style={{ color: 'var(--text-primary)' }}>{MOCK_STAKE.minStake} TRUST</span>
              </div>
              {stakingTier !== undefined && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Current Tier</span>
                  <span style={{ color: 'var(--purple)' }}>Tier {Number(stakingTier)}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Est. Monthly Reward</span>
                  <span style={{ color: 'var(--gold)' }}>{(parseFloat(amount) * 0.124 / 12).toFixed(2)} TRUST</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleStake}
              disabled={isPending || isConfirming}
              className="w-full py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(170,136,255,0.15))',
                border: '1px solid rgba(0,255,200,0.3)',
                color: 'var(--cyan)',
                opacity: (isPending || isConfirming) ? 0.6 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,200,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : tab === 'stake' ? 'Stake TRUST' : 'Unstake TRUST'}
            </button>

            {txHash && (
              <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                Tx: <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--cyan)' }}
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>
            )}
          </div>

          {/* History */}
          <div className="mt-6 rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Staking History</h2>
            <div className="space-y-0">
              {STAKE_HISTORY.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.action}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: item.action.includes('Reward') ? 'var(--gold)' : 'var(--text-primary)' }}>
                      {item.action === 'Unstaked' ? '-' : '+'}{item.amount} TRUST
                    </div>
                    <div className="text-xs" style={{ color: item.status === 'Active' ? 'var(--green)' : 'var(--text-secondary)' }}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription */}
          <SubscriptionSection address={address} />
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Network Validators</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--cyan)' }}>{MOCK_STAKE.validators.toLocaleString()}</div>
          </div>
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Total Staked</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--purple)' }}>{MOCK_STAKE.totalStaked}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>TRUST tokens</div>
          </div>
          <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Your Pending Rewards</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>{MOCK_STAKE.pendingRewards}</div>
            <button
              className="mt-3 w-full py-2 rounded-lg text-xs cursor-pointer"
              style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: 'var(--gold)' }}
            >
              Claim Rewards
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PortalStake() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: 'var(--cyan)' }}>Portal</Link>
        <span>/</span>
        <span>Stake</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Stake TRUST</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Stake tokens to become a validator and earn rewards for flow verification
      </p>

      {isConnected && address ? (
        <StakeContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to Stake" />
      )}
    </div>
  );
}
