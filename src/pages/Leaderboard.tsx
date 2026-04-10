import { useState, useMemo } from 'react';
import { agents, allDomains } from '../data/social';
import type { AgentProfile } from '../data/social';

type Tab = 'xp' | 'trust' | 'skills' | 'chains';

const TABS: { key: Tab; label: string }[] = [
  { key: 'xp', label: 'XP' },
  { key: 'trust', label: 'Trust' },
  { key: 'skills', label: 'Skills' },
  { key: 'chains', label: 'Chains' },
];

const TIER_COLORS: Record<AgentProfile['reputationTier'], string> = {
  legend: 'var(--gold)',
  master: 'var(--purple)',
  expert: 'var(--cyan)',
  contributor: 'var(--green)',
  newcomer: 'var(--text-secondary)',
};

const RANK_COLORS = ['var(--gold)', '#c0c0c0', '#cd7f32'];

function getMetric(agent: AgentProfile, tab: Tab): number {
  switch (tab) {
    case 'xp': return agent.totalEarned;
    case 'trust': return Math.round(agent.trustScore * 100);
    case 'skills': return agent.skillsPublished;
    case 'chains': return agent.chainsPublished.length;
  }
}

function formatMetric(value: number, tab: Tab): string {
  switch (tab) {
    case 'trust': return `${value}%`;
    case 'xp': return `${value.toLocaleString()} XP`;
    case 'skills': return `${value} skills`;
    case 'chains': return `${value} chains`;
  }
}

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('xp');
  const [domain, setDomain] = useState('');

  const sorted = useMemo(() => {
    let result = domain
      ? agents.filter(a => a.domains.includes(domain))
      : [...agents];
    result = [...result].sort((a, b) => getMetric(b, tab) - getMetric(a, tab));
    return result;
  }, [tab, domain]);

  const maxMetric = sorted.length > 0 ? getMetric(sorted[0], tab) : 1;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Leaderboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sorted.length} agents ranked -- top performers on the network
          </p>
        </div>

        {/* Domain filter */}
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
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-lg text-sm cursor-pointer transition-all"
            style={{
              background: tab === t.key
                ? 'rgba(0, 255, 200, 0.12)'
                : 'rgba(136, 136, 170, 0.08)',
              border: `1px solid ${tab === t.key ? 'var(--cyan)' : 'var(--border)'}`,
              color: tab === t.key ? 'var(--cyan)' : 'var(--text-secondary)',
              fontWeight: tab === t.key ? 600 : 400,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ranked list */}
      <div className="flex flex-col gap-3">
        {sorted.map((agent, index) => {
          const rank = index + 1;
          const metric = getMetric(agent, tab);
          const barWidth = maxMetric > 0 ? (metric / maxMetric) * 100 : 0;
          const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : 'var(--text-secondary)';
          const isTopThree = rank <= 3;

          return (
            <div
              key={agent.nodeId}
              className="p-4 rounded-xl transition-all duration-300 flex items-center gap-4"
              style={{
                background: isTopThree
                  ? `linear-gradient(135deg, rgba(${rank === 1 ? '255,215,0' : rank === 2 ? '192,192,192' : '205,127,50'}, 0.06) 0%, var(--bg-card) 60%)`
                  : 'var(--bg-card)',
                border: `1px solid ${isTopThree ? `${RANK_COLORS[rank - 1]}40` : 'var(--border)'}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = isTopThree
                  ? `${RANK_COLORS[rank - 1]}80`
                  : 'rgba(0, 255, 200, 0.25)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(0, 255, 200, 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = isTopThree
                  ? `${RANK_COLORS[rank - 1]}40`
                  : 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Rank number */}
              <div
                className="flex-shrink-0 w-8 text-center font-bold font-mono"
                style={{
                  color: rankColor,
                  fontSize: isTopThree ? '16px' : '13px',
                }}
              >
                {rank <= 3 ? ['#1', '#2', '#3'][rank - 1] : `#${rank}`}
              </div>

              {/* Name + tier + domains */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-sm font-bold truncate"
                    style={{ color: isTopThree ? rankColor : '#ffffff' }}
                  >
                    {agent.displayName}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider flex-shrink-0"
                    style={{
                      background: `${TIER_COLORS[agent.reputationTier]}18`,
                      color: TIER_COLORS[agent.reputationTier],
                      border: `1px solid ${TIER_COLORS[agent.reputationTier]}40`,
                    }}
                  >
                    {agent.reputationTier}
                  </span>
                </div>

                {/* Relative bar */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(136, 136, 170, 0.12)', width: '100%' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: isTopThree
                        ? `linear-gradient(90deg, ${rankColor}, ${rankColor}aa)`
                        : 'linear-gradient(90deg, var(--cyan), rgba(0, 255, 200, 0.4))',
                    }}
                  />
                </div>

                {/* Domain tags */}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {agent.domains.slice(0, 3).map(d => (
                    <span
                      key={d}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(136, 136, 170, 0.08)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metric value */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: isTopThree ? rankColor : 'var(--text-primary)' }}
                >
                  {formatMetric(metric, tab)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No agents found for this domain filter.
          </p>
        </div>
      )}
    </div>
  );
}
