import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSkills } from '../hooks/useSkills';
import { formatFlowName } from '../utils/formatFlowName';

// ── Tab definitions ────────────────────────────────────────────────────
type Tab = 'top' | 'validated' | 'domain' | 'recent';

const TABS: { key: Tab; label: string }[] = [
  { key: 'top', label: 'Top Flows' },
  { key: 'validated', label: 'Most Validated' },
  { key: 'domain', label: 'By Domain' },
  { key: 'recent', label: 'Recent' },
];

// ── Rank medal colours ─────────────────────────────────────────────────
function rankStyle(rank: number): { color: string; bg: string; border: string } {
  if (rank === 1) return { color: 'var(--gold)', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)' };
  if (rank === 2) return { color: '#c0c8d0', bg: 'rgba(192,200,208,0.10)', border: 'rgba(192,200,208,0.25)' };
  if (rank === 3) return { color: '#cd7f32', bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.25)' };
  return { color: 'var(--text-secondary)', bg: 'rgba(136,136,170,0.06)', border: 'var(--border)' };
}

// ── Domain badge ───────────────────────────────────────────────────────
function DomainBadge({ domain }: { domain: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(0,255,200,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
    >
      {domain}
    </span>
  );
}

// ── Domain filter dropdown ─────────────────────────────────────────────
function DomainFilter({ domains, value, onChange }: { domains: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg px-3 py-1.5 text-xs font-medium"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        paddingRight: '1.75rem',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.6rem center',
      }}
    >
      <option value="">All domains</option>
      {domains.map(d => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  );
}

// ── Ranked list row ────────────────────────────────────────────────────
function RankedRow({
  rank,
  name,
  domain,
  metric,
  metricLabel,
  metricColor,
  slug,
}: {
  rank: number;
  name: string;
  domain: string;
  metric: string;
  metricLabel: string;
  metricColor: string;
  slug: string;
}) {
  const rs = rankStyle(rank);
  return (
    <Link
      to={`/flow/${slug}`}
      className="no-underline flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Rank badge */}
      <span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
      >
        {rank}
      </span>

      {/* Name + domain */}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span
          className="text-sm font-semibold truncate group-hover:underline"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </span>
        <DomainBadge domain={domain} />
      </div>

      {/* Metric */}
      <div className="flex-shrink-0 text-right">
        <span className="text-sm font-bold" style={{ color: metricColor }}>{metric}</span>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{metricLabel}</div>
      </div>
    </Link>
  );
}

// ── Empty state ────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      className="glass-card flex flex-col items-center justify-center text-center py-16 px-8 rounded-2xl"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-4"
        style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}
      >
        <span style={{ color: 'var(--gold)' }}>#</span>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No flows registered yet.</p>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Be the first to publish a flow to the network.
      </p>
    </div>
  );
}

// ── Tab: Top Flows ─────────────────────────────────────────────────────
function TopFlowsTab({ domainFilter, setDomainFilter }: { domainFilter: string; setDomainFilter: (v: string) => void }) {
  const { data: skills = [] } = useSkills();
  const domains = useMemo(() => [...new Set(skills.map(s => s.domain))].sort(), [skills]);
  const sorted = useMemo(
    () =>
      [...skills]
        .filter(s => !domainFilter || s.domain === domainFilter)
        .sort((a, b) => (b.successRate ?? 0) - (a.successRate ?? 0)),
    [skills, domainFilter]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Ranked by success rate — highest quality flows
        </div>
        <DomainFilter domains={domains} value={domainFilter} onChange={setDomainFilter} />
      </div>
      <div className="glass-card rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          sorted.map((skill, i) => {
            const sr = skill.successRate ?? 0;
            return (
              <RankedRow
                key={skill.name}
                rank={i + 1}
                name={formatFlowName(skill.name)}
                domain={skill.domain}
                slug={skill.name}
                metric={`${sr}%`}
                metricLabel="success rate"
                metricColor={sr >= 90 ? 'var(--green)' : sr >= 80 ? 'var(--gold)' : 'var(--text-secondary)'}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Tab: Most Validated ────────────────────────────────────────────────
function MostValidatedTab({ domainFilter, setDomainFilter }: { domainFilter: string; setDomainFilter: (v: string) => void }) {
  const { data: skills = [] } = useSkills();
  const domains = useMemo(() => [...new Set(skills.map(s => s.domain))].sort(), [skills]);
  const sorted = useMemo(
    () =>
      [...skills]
        .filter(s => !domainFilter || s.domain === domainFilter)
        .sort((a, b) => (b.validatorCount ?? 0) - (a.validatorCount ?? 0)),
    [skills, domainFilter]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Ranked by validator coverage — most reviewed flows
        </div>
        <DomainFilter domains={domains} value={domainFilter} onChange={setDomainFilter} />
      </div>
      <div className="glass-card rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          sorted.map((skill, i) => {
            const vc = skill.validatorCount ?? 0;
            return (
              <RankedRow
                key={skill.name}
                rank={i + 1}
                name={formatFlowName(skill.name)}
                domain={skill.domain}
                slug={skill.name}
                metric={`${vc}`}
                metricLabel={vc === 1 ? 'validator' : 'validators'}
                metricColor={vc >= 10 ? 'var(--green)' : vc >= 5 ? 'var(--gold)' : 'var(--text-secondary)'}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Tab: By Domain ─────────────────────────────────────────────────────
function ByDomainTab() {
  const { data: skills = [] } = useSkills();

  const domainStats = useMemo(() => {
    const map: Record<string, { count: number; totalSuccess: number }> = {};
    for (const skill of skills) {
      if (!map[skill.domain]) map[skill.domain] = { count: 0, totalSuccess: 0 };
      map[skill.domain].count += 1;
      map[skill.domain].totalSuccess += skill.successRate ?? 0;
    }
    return Object.entries(map)
      .map(([domain, { count, totalSuccess }]) => ({
        domain,
        count,
        avgSuccess: count > 0 ? Math.round(totalSuccess / count) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [skills]);

  if (domainStats.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {domainStats.map(({ domain, count, avgSuccess }) => (
        <div
          key={domain}
          className="glass-card rounded-xl p-5"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
              {domain}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(0,255,200,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.2)' }}
            >
              {count} {count === 1 ? 'flow' : 'flows'}
            </span>
          </div>
          <div className="text-2xl font-bold mb-0.5" style={{ color: avgSuccess >= 90 ? 'var(--green)' : avgSuccess >= 80 ? 'var(--gold)' : 'var(--text-primary)' }}>
            {avgSuccess}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>avg success rate</div>
          {/* Mini bar */}
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(136,136,170,0.15)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${avgSuccess}%`,
                background: avgSuccess >= 90 ? 'var(--green)' : avgSuccess >= 80 ? 'var(--gold)' : 'var(--cyan)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Recent ────────────────────────────────────────────────────────
function RecentTab() {
  const { data: skills = [] } = useSkills();

  if (skills.length === 0) return <EmptyState />;

  return (
    <div className="glass-card rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {skills.map(skill => (
        <Link
          key={skill.name}
          to={`/flow/${skill.name}`}
          className="no-underline flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {/* Dot indicator */}
          <span
            className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
            style={{ background: 'var(--cyan)' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                {formatFlowName(skill.name)}
              </span>
              <DomainBadge domain={skill.domain} />
            </div>
            {skill.description && (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {skill.description}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-xs" style={{ color: 'var(--text-secondary)' }}>→</span>
        </Link>
      ))}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────
export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('top');
  const [domainFilter, setDomainFilter] = useState('');

  // Reset domain filter when switching between tabs
  function handleTabChange(key: Tab) {
    setTab(key);
    setDomainFilter('');
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Leaderboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Flow performance rankings across the FlowFabric network
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
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

      {/* Tab content */}
      {tab === 'top' && (
        <TopFlowsTab domainFilter={domainFilter} setDomainFilter={setDomainFilter} />
      )}
      {tab === 'validated' && (
        <MostValidatedTab domainFilter={domainFilter} setDomainFilter={setDomainFilter} />
      )}
      {tab === 'domain' && <ByDomainTab />}
      {tab === 'recent' && <RecentTab />}
    </div>
  );
}
