import { Link } from 'react-router-dom';
import CommunityPoolCard from '../components/CommunityPoolCard';
import { useVelma } from '../contexts/VelmaContext';
import { formatFlowName } from '../utils/formatFlowName';

type TimelineEntry = {
  icon: string;
  label: string;
  dotColor: string;
  raw: string;
};

function parseEvent(raw: string): TimelineEntry {
  if (raw.startsWith('flow_start:')) {
    const slug = raw.slice('flow_start:'.length);
    return {
      icon: '▶',
      label: `Started ${formatFlowName(slug)}`,
      dotColor: 'var(--cyan)',
      raw,
    };
  }
  if (raw.startsWith('flow_complete:')) {
    const slug = raw.slice('flow_complete:'.length);
    return {
      icon: '✓',
      label: `Completed ${formatFlowName(slug)}`,
      dotColor: 'var(--green)',
      raw,
    };
  }
  if (raw.startsWith('chain_complete:')) {
    const slug = raw.slice('chain_complete:'.length);
    return {
      icon: '⛓',
      label: `Completed chain ${formatFlowName(slug)}`,
      dotColor: 'var(--gold)',
      raw,
    };
  }
  if (raw.startsWith('petted')) {
    return {
      icon: '♡',
      label: 'Gave Velma a pat',
      dotColor: '#ff80b5',
      raw,
    };
  }
  // Generic events — humanise the key
  const pretty = raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  return {
    icon: '·',
    label: pretty,
    dotColor: 'var(--text-secondary)',
    raw,
  };
}

export default function Activity() {
  const { state } = useVelma();
  const entries: TimelineEntry[] = [...state.witnessed].reverse().map(parseEvent);
  const uniqueFlows = state.flows_completed.length;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
        My Activity
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Your personal FlowFabric history
      </p>

      {/* Community pool */}
      <div className="mb-8">
        <CommunityPoolCard />
      </div>

      {/* Stat bar */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 px-4 py-3 rounded-xl text-sm"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{state.flows_run}</span> flows run
        </span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>{uniqueFlows}</span> unique
        </span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{state.xp.toLocaleString()}</span> XP
        </span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Level <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{state.level}</span>
        </span>
      </div>

      {/* Feed or empty state */}
      {entries.length === 0 ? (
        <div
          className="glass-card flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-5"
            style={{ background: 'rgba(0, 255, 200, 0.08)', border: '1px solid rgba(0, 255, 200, 0.2)' }}
          >
            <span style={{ color: 'var(--cyan)' }}>~</span>
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No activity yet. Run a flow to start your history.
          </p>
          <Link
            to="/flows"
            className="mt-3 text-sm font-medium no-underline px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'rgba(0,255,200,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.2)' }}
          >
            Browse flows
          </Link>
        </div>
      ) : (
        <div
          className="glass-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div
            className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
          >
            Recent events (last {entries.length})
          </div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div
              style={{
                position: 'absolute',
                left: '28px',
                top: '12px',
                bottom: '12px',
                width: '1px',
                background: 'var(--border)',
              }}
            />

            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-3.5 transition-colors"
                style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,255,200,0.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Dot */}
                <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, paddingTop: '2px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: entry.dotColor,
                      boxShadow: `0 0 6px ${entry.dotColor}55`,
                      marginTop: '3px',
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span style={{ marginRight: '6px', fontSize: '11px', opacity: 0.7 }}>{entry.icon}</span>
                    {entry.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
