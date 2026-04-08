import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, NodeRegistryABI, TrustOracleABI } from '../contracts';

interface Validator {
  address: string;
  trustScore: number;
  staked: number;
  skillsValidated: number;
  uptime: number;
  phase: 'validator' | 'participant' | 'probation';
  consensusVotes: number;
  lastActive: string;
}

const MOCK_VALIDATORS: Validator[] = [
  { address: '0x1a2b...3c4d', trustScore: 0.97, staked: 52000, skillsValidated: 312, uptime: 99.8, phase: 'validator', consensusVotes: 1847, lastActive: '2m ago' },
  { address: '0x5e6f...7a8b', trustScore: 0.95, staked: 45000, skillsValidated: 287, uptime: 99.5, phase: 'validator', consensusVotes: 1632, lastActive: '5m ago' },
  { address: '0x9c0d...1e2f', trustScore: 0.93, staked: 38000, skillsValidated: 245, uptime: 99.2, phase: 'validator', consensusVotes: 1421, lastActive: '1m ago' },
  { address: '0x3a4b...5c6d', trustScore: 0.91, staked: 32000, skillsValidated: 198, uptime: 98.9, phase: 'validator', consensusVotes: 1205, lastActive: '8m ago' },
  { address: '0x7e8f...9a0b', trustScore: 0.87, staked: 25000, skillsValidated: 156, uptime: 98.1, phase: 'validator', consensusVotes: 987, lastActive: '3m ago' },
  { address: '0xbc1d...2e3f', trustScore: 0.82, staked: 18000, skillsValidated: 98, uptime: 97.5, phase: 'participant', consensusVotes: 654, lastActive: '15m ago' },
  { address: '0x4a5b...6c7d', trustScore: 0.78, staked: 12000, skillsValidated: 67, uptime: 96.8, phase: 'participant', consensusVotes: 432, lastActive: '22m ago' },
  { address: '0x8e9f...0a1b', trustScore: 0.45, staked: 5000, skillsValidated: 12, uptime: 89.2, phase: 'probation', consensusVotes: 45, lastActive: '2h ago' },
];

function ValidatorContent({ address }: { address: `0x${string}` }) {
  const [sortBy, setSortBy] = useState<'trust' | 'staked' | 'validated'>('trust');

  // Read node count from contract
  const { data: nodeCount } = useReadContract({
    address: CONTRACTS.NodeRegistry,
    abi: NodeRegistryABI,
    functionName: 'nodeCount',
  });

  // Read current user's trust score
  const { data: myTrust } = useReadContract({
    address: CONTRACTS.TrustOracle,
    abi: TrustOracleABI,
    functionName: 'getTrustScore',
    args: [address],
  });

  const totalNodes = nodeCount ? Number(nodeCount) : 1247;
  const myTrustScore = myTrust ? (Number(myTrust) / 1e18).toFixed(2) : null;

  const sorted = [...MOCK_VALIDATORS].sort((a, b) => {
    if (sortBy === 'trust') return b.trustScore - a.trustScore;
    if (sortBy === 'staked') return b.staked - a.staked;
    return b.skillsValidated - a.skillsValidated;
  });

  const phaseColors: Record<string, string> = {
    validator: 'var(--green)',
    participant: 'var(--cyan)',
    probation: 'var(--gold)',
  };

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Validators</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--cyan)' }}>{totalNodes.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Trust Score</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--green)' }}>0.84</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Staked</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--purple)' }}>48.2M</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your Trust</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--gold)' }}>{myTrustScore ?? 'N/A'}</div>
        </div>
      </div>

      {/* Sort */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)' }}>
          {(['trust', 'staked', 'validated'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="px-3 py-1.5 rounded-md text-xs cursor-pointer"
              style={{
                background: sortBy === s ? 'var(--bg-primary)' : 'transparent',
                color: sortBy === s ? 'var(--cyan)' : 'var(--text-secondary)',
                border: 'none', fontFamily: 'inherit',
              }}
            >
              {s === 'trust' ? 'Trust Score' : s === 'staked' ? 'Staked' : 'Validated'}
            </button>
          ))}
        </div>
      </div>

      {/* Validator Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-7 gap-4 p-4 text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <div>Rank</div>
          <div>Address</div>
          <div>Trust Score</div>
          <div>Phase</div>
          <div>Staked</div>
          <div>Validated</div>
          <div>Last Active</div>
        </div>

        {sorted.map((v, i) => (
          <div
            key={v.address}
            className="grid grid-cols-7 gap-4 p-4 items-center transition-colors"
            style={{ borderTop: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,200,0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div className="text-sm font-bold" style={{ color: i < 3 ? 'var(--gold)' : 'var(--text-secondary)' }}>#{i + 1}</div>
            <div className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{v.address}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-primary)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${v.trustScore * 100}%`,
                    background: v.trustScore > 0.8 ? 'var(--green)' : v.trustScore > 0.5 ? 'var(--gold)' : 'var(--red)',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{(v.trustScore * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  background: `${phaseColors[v.phase]}15`,
                  color: phaseColors[v.phase],
                  border: `1px solid ${phaseColors[v.phase]}30`,
                }}
              >
                {v.phase}
              </span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.staked.toLocaleString()}</div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.skillsValidated}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{v.lastActive}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function PortalValidators() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: 'var(--cyan)' }}>Portal</Link>
        <span>/</span>
        <span>Validators</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Network Validators</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Trust-weighted validators securing the FlowFabric network
      </p>

      {isConnected && address ? (
        <ValidatorContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to View Validators" />
      )}
    </div>
  );
}
