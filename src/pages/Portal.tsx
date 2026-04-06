import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, SkillTokenABI, TrustOracleABI, StakingABI } from '../contracts';

const MOCK_DATA = {
  trustBalance: '12,450.00',
  stakedAmount: '8,000.00',
  pendingRewards: '234.50',
  validatorStatus: 'Active',
  trustScore: 0.87,
  skillsValidated: 42,
  consensusParticipation: '94.2%',
  networkRank: 128,
};

function StatCard({ label, value, sub, accent = 'var(--cyan)' }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function PortalLink({ to, title, description, icon }: {
  to: string; title: string; description: string; icon: string;
}) {
  return (
    <Link
      to={to}
      className="block p-5 rounded-xl no-underline transition-all"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.3)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 200, 0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{description}</div>
    </Link>
  );
}

function ActivityItem({ action, detail, time, type }: {
  action: string; detail: string; time: string; type: 'stake' | 'validate' | 'reward' | 'vote';
}) {
  const colors: Record<string, string> = {
    stake: 'var(--cyan)', validate: 'var(--green)', reward: 'var(--gold)', vote: 'var(--purple)',
  };
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: colors[type] }} />
        <div>
          <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{action}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{detail}</div>
        </div>
      </div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{time}</div>
    </div>
  );
}

function PortalContent({ address }: { address: `0x${string}` }) {
  // Read TRUST token balance
  const { data: rawBalance } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: SkillTokenABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // Read trust score from oracle
  const { data: rawTrustScore } = useReadContract({
    address: CONTRACTS.TrustOracle,
    abi: TrustOracleABI,
    functionName: 'getTrustScore',
    args: [address],
  });

  // Read staking tier
  const { data: stakingTier } = useReadContract({
    address: CONTRACTS.Staking,
    abi: StakingABI,
    functionName: 'getTier',
    args: [address],
  });

  // Use on-chain data when available, fall back to mock
  const balance = rawBalance ? parseFloat(formatUnits(rawBalance as bigint, 18)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : MOCK_DATA.trustBalance;
  const trustScore = rawTrustScore ? (Number(rawTrustScore) / 1e18) : MOCK_DATA.trustScore;
  const tier = stakingTier ? Number(stakingTier) : null;

  return (
    <>
      {/* Connected address */}
      <div className="mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,200,0.1)', color: 'var(--cyan)' }}>
          Base Sepolia
        </span>
        {tier !== null && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(170,136,255,0.1)', color: 'var(--purple)' }}>
            Tier {tier}
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="TRUST Balance" value={balance} sub="TRUST" />
        <StatCard label="Staked" value={MOCK_DATA.stakedAmount} sub="64.3% of balance" accent="var(--purple)" />
        <StatCard label="Pending Rewards" value={MOCK_DATA.pendingRewards} sub="TRUST" accent="var(--gold)" />
        <StatCard label="Trust Score" value={`${(trustScore * 100).toFixed(1)}%`} sub={`Rank #${MOCK_DATA.networkRank}`} accent="var(--green)" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <PortalLink to="/portal/stake" title="Stake" description="Stake TRUST to become a validator" icon="&#x26A1;" />
        <PortalLink to="/portal/marketplace" title="Marketplace" description="Buy and sell verified skills" icon="&#x1F6D2;" />
        <PortalLink to="/portal/validators" title="Validators" description="Network validator directory" icon="&#x1F6E1;" />
        <PortalLink to="/portal/network" title="Network" description="Chain stats and block explorer" icon="&#x1F4CA;" />
      </div>

      {/* Two column: Validator Status + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Validator Status</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--green)' }}>{MOCK_DATA.validatorStatus}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Skills Validated</span>
              <span style={{ color: 'var(--text-primary)' }}>{MOCK_DATA.skillsValidated}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Consensus Participation</span>
              <span style={{ color: 'var(--text-primary)' }}>{MOCK_DATA.consensusParticipation}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Trust Score</span>
              <span style={{ color: 'var(--cyan)' }}>{trustScore.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-primary)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${trustScore * 100}%`,
                    background: 'linear-gradient(90deg, var(--cyan), var(--green))',
                    boxShadow: '0 0 8px rgba(0, 255, 200, 0.3)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
          <ActivityItem action="Staked 2,000 TRUST" detail="Validator pool" time="2h ago" type="stake" />
          <ActivityItem action="Validated skill" detail="data-extractor v1.2" time="5h ago" type="validate" />
          <ActivityItem action="Earned 45.2 TRUST" detail="Validation reward" time="8h ago" type="reward" />
          <ActivityItem action="Consensus vote" detail="Block #1,247" time="12h ago" type="vote" />
          <ActivityItem action="Validated skill" detail="resume-builder v2.0" time="1d ago" type="validate" />
        </div>
      </div>
    </>
  );
}

export default function Portal() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Token Portal</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your TRUST tokens, staking, and validator status on Base Sepolia
        </p>
      </div>

      {isConnected && address ? (
        <PortalContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to Token Portal" />
      )}
    </div>
  );
}
