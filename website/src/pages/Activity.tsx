import { useState, useMemo } from 'react';
import { activityEvents } from '../data/social';

const eventIcons: Record<string, { icon: string; color: string }> = {
  skill_published: { icon: '+', color: 'var(--green)' },
  skill_validated: { icon: '~', color: 'var(--cyan)' },
  bounty_created: { icon: '$', color: 'var(--gold)' },
  bounty_completed: { icon: '*', color: 'var(--gold)' },
  chain_run: { icon: '>', color: 'var(--purple)' },
  node_joined: { icon: '@', color: 'var(--cyan)' },
};

const eventTypes = [
  { key: '', label: 'All' },
  { key: 'skill_published', label: 'Published' },
  { key: 'skill_validated', label: 'Validated' },
  { key: 'bounty_created', label: 'Bounties' },
  { key: 'bounty_completed', label: 'Completed' },
  { key: 'chain_run', label: 'Chain Runs' },
  { key: 'node_joined', label: 'New Nodes' },
];

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Activity() {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return activityEvents;
    return activityEvents.filter(e => e.eventType === filter);
  }, [filter]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
        Network Activity
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Live feed of what is happening on SkillChain
      </p>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {eventTypes.map(et => (
          <button
            key={et.key}
            onClick={() => setFilter(et.key)}
            className="px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all"
            style={{
              background: filter === et.key ? 'rgba(0, 255, 200, 0.12)' : 'rgba(136, 136, 170, 0.08)',
              border: `1px solid ${filter === et.key ? 'var(--cyan)' : 'var(--border)'}`,
              color: filter === et.key ? 'var(--cyan)' : 'var(--text-secondary)',
            }}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-px"
          style={{ background: 'var(--border)' }}
        />

        <div className="flex flex-col gap-1">
          {filtered.map((event, i) => {
            const ei = eventIcons[event.eventType] || { icon: '?', color: 'var(--text-secondary)' };
            return (
              <div
                key={`${event.timestamp}-${i}`}
                className="flex items-start gap-4 pl-0 py-3 transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Icon node */}
                <div
                  className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: `${ei.color}15`,
                    border: `2px solid ${ei.color}40`,
                    color: ei.color,
                    boxShadow: `0 0 12px ${ei.color}20`,
                  }}
                >
                  {ei.icon}
                </div>

                {/* Content */}
                <div
                  className="flex-1 p-4 rounded-xl"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>
                      {event.nodeName}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No activity matching this filter.
          </p>
        </div>
      )}
    </div>
  );
}
