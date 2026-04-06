import { useState, useMemo } from 'react';
import { bounties, allDomains } from '../data/social';

const statusColors: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(0, 255, 136, 0.12)', color: 'var(--green)' },
  claimed: { bg: 'rgba(0, 255, 200, 0.12)', color: 'var(--cyan)' },
  submitted: { bg: 'rgba(170, 136, 255, 0.12)', color: 'var(--purple)' },
  completed: { bg: 'rgba(255, 215, 0, 0.12)', color: 'var(--gold)' },
  expired: { bg: 'rgba(136, 136, 170, 0.08)', color: 'var(--text-secondary)' },
};

function StatusBadge({ status }: { status: string }) {
  const style = statusColors[status] || statusColors.expired;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
}

function daysUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export default function Bounties() {
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState('');
  const [minReward, setMinReward] = useState(0);

  const filtered = useMemo(() => {
    let result = [...bounties];

    if (domain) {
      result = result.filter(b => b.domain === domain);
    }
    if (status) {
      result = result.filter(b => b.status === status);
    }
    if (minReward > 0) {
      result = result.filter(b => b.rewardTrust >= minReward);
    }

    result.sort((a, b) => b.rewardTrust - a.rewardTrust);
    return result;
  }, [domain, status, minReward]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Skill Bounties
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {bounties.filter(b => b.status === 'open').length} open bounties --{' '}
            {bounties.reduce((sum, b) => sum + (b.status === 'open' ? b.rewardTrust : 0), 0).toLocaleString()} TRUST available
          </p>
        </div>
        <button
          className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 200, 0.15), rgba(170, 136, 255, 0.15))',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            color: 'var(--cyan)',
          }}
        >
          + Post a Bounty
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="submitted">Submitted</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={minReward}
          onChange={(e) => setMinReward(Number(e.target.value))}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value={0}>Any Reward</option>
          <option value={100}>100+ TRUST</option>
          <option value={200}>200+ TRUST</option>
          <option value={300}>300+ TRUST</option>
        </select>
      </div>

      {/* Bounty cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(bounty => (
          <div
            key={bounty.bountyId}
            className="p-5 rounded-xl transition-all duration-300 flex flex-col gap-3"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 215, 0, 0.3)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold flex-1" style={{ color: '#ffffff' }}>
                {bounty.title}
              </h3>
              <span className="text-lg font-bold ml-4 flex-shrink-0" style={{ color: 'var(--gold)' }}>
                {bounty.rewardTrust} TRUST
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0, 255, 200, 0.08)', color: 'var(--text-secondary)' }}>
                {bounty.domain}
              </span>
              <StatusBadge status={bounty.status} />
            </div>

            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {bounty.description}
            </p>

            <div className="flex items-center justify-between text-[11px] mt-auto pt-2"
              style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                by {bounty.creatorName}
              </span>
              <span style={{
                color: bounty.status === 'expired' ? 'var(--red)' :
                  daysUntil(bounty.deadline) === 'expired' ? 'var(--red)' :
                    parseInt(daysUntil(bounty.deadline)) <= 3 ? 'var(--gold)' : 'var(--text-secondary)',
              }}>
                {daysUntil(bounty.deadline) === 'expired' ? 'EXPIRED' : `${daysUntil(bounty.deadline)} left`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No bounties match your filters.
          </p>
        </div>
      )}
    </div>
  );
}
