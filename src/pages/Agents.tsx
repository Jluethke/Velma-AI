import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { agents, allDomains } from '../data/social';
import type { AgentProfile } from '../data/social';

const tierColors: Record<string, string> = {
  legend: '#ff44ff',
  master: '#ffd700',
  expert: '#00ffc8',
  contributor: '#00ff88',
  newcomer: '#8888aa',
};

const tierGlow: Record<string, string> = {
  legend: '0 0 12px rgba(255, 68, 255, 0.5)',
  master: '0 0 12px rgba(255, 215, 0, 0.4)',
  expert: '0 0 10px rgba(0, 255, 200, 0.3)',
  contributor: 'none',
  newcomer: 'none',
};

function TrustBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? 'var(--green)' : score >= 0.7 ? 'var(--cyan)' : score >= 0.5 ? 'var(--gold)' : 'var(--red)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{pct}%</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: tierColors[tier] || '#8888aa',
        background: `${tierColors[tier] || '#8888aa'}15`,
        border: `1px solid ${tierColors[tier] || '#8888aa'}40`,
        boxShadow: tierGlow[tier] || 'none',
      }}
    >
      {tier}
    </span>
  );
}

function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <div
      className="p-5 rounded-xl transition-all duration-300 flex flex-col gap-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 255, 200, 0.3)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0, 255, 200, 0.06)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>{agent.displayName}</h3>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{agent.nodeId.slice(0, 14)}...</span>
        </div>
        <TierBadge tier={agent.reputationTier} />
      </div>

      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
        {agent.bio}
      </p>

      <TrustBar score={agent.trustScore} />

      <div className="flex flex-wrap gap-1.5">
        {agent.domains.map(d => (
          <span key={d} className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0, 255, 200, 0.08)', color: 'var(--text-secondary)' }}>
            {d}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] mt-auto pt-2"
        style={{ borderTop: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          {agent.skillsPublished} flows
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {agent.skillsValidated} validated
        </span>
        <span style={{ color: 'var(--gold)' }}>
          {agent.totalEarned.toLocaleString()} TRUST
        </span>
      </div>
    </div>
  );
}

function MatchCard({ agent }: { agent: AgentProfile }) {
  return (
    <div
      className="p-4 rounded-xl flex items-center gap-4 min-w-[280px]"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 200, 0.05), rgba(170, 136, 255, 0.05))',
        border: '1px solid rgba(0, 255, 200, 0.15)',
      }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: 'rgba(0, 255, 200, 0.1)', color: 'var(--cyan)' }}>
        {Math.round((agent.matchScore || 0) * 100)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>{agent.displayName}</span>
          <TierBadge tier={agent.reputationTier} />
        </div>
        {agent.matchReasons && agent.matchReasons.length > 0 && (
          <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            {agent.matchReasons[0]}
          </p>
        )}
      </div>
    </div>
  );
}

type SortKey = 'trust' | 'skills' | 'earned' | 'accuracy';

export default function Agents() {
  const { isConnected } = useAccount();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [minTrust, setMinTrust] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('trust');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <ConnectWalletPrompt title="Connect to access Agents" />
      </div>
    );
  }

  const recommended = useMemo(() =>
    [...agents]
      .filter(a => (a.matchScore || 0) > 0.5)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 5),
    []
  );

  const filtered = useMemo(() => {
    let result = [...agents];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(a =>
        a.displayName.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q) ||
        a.domains.some(d => d.toLowerCase().includes(q))
      );
    }

    if (domain) {
      result = result.filter(a => a.domains.includes(domain));
    }

    if (minTrust > 0) {
      result = result.filter(a => a.trustScore >= minTrust / 100);
    }

    switch (sortBy) {
      case 'trust': result.sort((a, b) => b.trustScore - a.trustScore); break;
      case 'skills': result.sort((a, b) => b.skillsPublished - a.skillsPublished); break;
      case 'earned': result.sort((a, b) => b.totalEarned - a.totalEarned); break;
      case 'accuracy': result.sort((a, b) => b.validationAccuracy - a.validationAccuracy); break;
    }

    return result;
  }, [query, domain, minTrust, sortBy]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
        Agent Directory
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        {agents.length} agents on the network
      </p>

      {/* Recommended Matches */}
      {recommended.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--purple)' }}>
            Recommended for You
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recommended.map(a => (
              <MatchCard key={a.nodeId} agent={a} />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search agents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm flex-1 min-w-[200px]"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />

        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Domains</option>
          {allDomains.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={minTrust}
          onChange={(e) => setMinTrust(Number(e.target.value))}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value={0}>Any Trust</option>
          <option value={50}>50%+</option>
          <option value={70}>70%+</option>
          <option value={85}>85%+</option>
        </select>

        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-all"
          style={{
            background: showLeaderboard ? 'rgba(0, 255, 200, 0.15)' : 'rgba(0, 255, 200, 0.05)',
            border: `1px solid ${showLeaderboard ? 'var(--cyan)' : 'var(--border)'}`,
            color: showLeaderboard ? 'var(--cyan)' : 'var(--text-secondary)',
          }}
        >
          Leaderboard
        </button>
      </div>

      {/* Sort bar */}
      <div className="flex gap-4 mb-6 text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>Sort by:</span>
        {(['trust', 'skills', 'earned', 'accuracy'] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className="cursor-pointer"
            style={{
              background: 'transparent',
              border: 'none',
              color: sortBy === key ? 'var(--cyan)' : 'var(--text-secondary)',
              textDecoration: sortBy === key ? 'underline' : 'none',
              textUnderlineOffset: '4px',
            }}
          >
            {key === 'trust' ? 'Trust Score' : key === 'skills' ? 'Flows Published' : key === 'earned' ? 'TRUST Earned' : 'Accuracy'}
          </button>
        ))}
      </div>

      {/* Leaderboard view */}
      {showLeaderboard ? (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>#</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Agent</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Tier</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Trust</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Flows</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Earned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.nodeId} style={{
                  background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <td className="px-4 py-3 font-bold" style={{ color: i < 3 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-bold" style={{ color: 'var(--cyan)' }}>{a.displayName}</td>
                  <td className="px-4 py-3"><TierBadge tier={a.reputationTier} /></td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--green)' }}>{(a.trustScore * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text-primary)' }}>{a.skillsPublished}</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--gold)' }}>{a.totalEarned.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <AgentCard key={agent.nodeId} agent={agent} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No agents match your filters.
          </p>
        </div>
      )}
    </div>
  );
}
