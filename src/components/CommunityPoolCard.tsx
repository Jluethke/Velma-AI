/**
 * CommunityPoolCard — shows the user's community pool position and claim button.
 *
 * The community pool accumulates a purchase premium (5% of every flow purchase,
 * 25% of subscriptions) and distributes it to addresses that earned TRUST
 * through real activity (LifeRewards, OnboardingRewards, etc.).
 *
 * Earned TRUST > purchased TRUST: the more people buy, the more earners yield.
 */
import { useCommunityPool } from '../hooks/useCommunityPool';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CommunityPoolCard() {
  const { isConnected } = useAccount();
  const { stats, claimState, claim, resetClaim } = useCommunityPool();

  if (!stats.deployed) {
    return (
      <div className="glass-card p-5" style={{ borderColor: 'rgba(251,191,36,0.15)', opacity: 0.6 }}>
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: '18px' }}>🏦</span>
          <h3 className="text-sm font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
            Community Pool
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            background: 'rgba(251,191,36,0.1)', color: 'var(--gold)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}>
            Deploying soon
          </span>
        </div>
        <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
          A portion of every flow purchase and subscription will flow here — distributed to addresses that earned their TRUST.
        </p>
      </div>
    );
  }

  const hasPending = stats.pendingClaimRaw > 0n;
  const hasWeight  = Number(stats.earnedWeight.replace(/,/g, '')) > 0;

  return (
    <div className="glass-card p-5" style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '18px' }}>🏦</span>
          <h3 className="text-sm font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
            Community Pool
          </h3>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          {stats.totalDeposited} TRUST deposited all-time
        </div>
      </div>

      {/* Pool stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Pool Balance', value: `${stats.poolBalance} TRUST`, color: 'var(--gold)' },
          { label: 'Your Earned Weight', value: `${stats.earnedWeight} TRUST`, color: 'var(--cyan)' },
          { label: 'Your Pool Share', value: `${stats.sharePercent}%`, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
              {s.label}
            </div>
            <div className="text-sm font-semibold" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Claimable */}
      <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4" style={{
        background: hasPending ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hasPending ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}>
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
            Available to claim
          </div>
          <div className="text-base font-bold" style={{ color: hasPending ? 'var(--green)' : 'var(--text-secondary)' }}>
            {stats.pendingClaim} TRUST
          </div>
        </div>
        {!isConnected ? (
          <ConnectButton chainStatus="none" accountStatus="address" showBalance={false} />
        ) : hasPending ? (
          <button
            onClick={claimState.status === 'idle' || claimState.status === 'error' ? claim : resetClaim}
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            style={{
              background: claimState.status === 'confirmed'
                ? 'rgba(74,222,128,0.12)' : 'rgba(74,222,128,0.1)',
              border: `1px solid ${claimState.status === 'confirmed'
                ? 'rgba(74,222,128,0.4)' : 'rgba(74,222,128,0.25)'}`,
              color: 'var(--green)',
              opacity: claimState.status === 'claiming' ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {claimState.status === 'claiming' ? 'Claiming…'
              : claimState.status === 'confirmed' ? 'Claimed!'
              : 'Claim'}
          </button>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            {hasWeight ? 'No new distributions yet' : 'Earn TRUST to participate'}
          </span>
        )}
      </div>

      {claimState.status === 'error' && claimState.error && (
        <p className="text-xs mt-2" style={{ color: 'var(--red)' }}>{claimState.error}</p>
      )}

      {/* How it works */}
      <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--text-secondary)', opacity: 0.55 }}>
        5% of every flow purchase + 25% of subscription fees fund this pool.
        Distributed pro-rata to addresses that earned TRUST through real activity —
        not to wallets that simply bought it.
      </p>
    </div>
  );
}
