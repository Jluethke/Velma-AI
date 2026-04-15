import { useState } from 'react';

type Tab = 'xp' | 'trust' | 'skills' | 'chains';

const TABS: { key: Tab; label: string }[] = [
  { key: 'xp', label: 'XP' },
  { key: 'trust', label: 'Trust' },
  { key: 'skills', label: 'Skills' },
  { key: 'chains', label: 'Chains' },
];

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('xp');

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
          Leaderboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Top flow runners and validators on the network
        </p>
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

      {/* Empty state */}
      <div
        className="glass-card flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-5"
          style={{
            background: 'rgba(255, 215, 0, 0.08)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          <span style={{ color: 'var(--gold)' }}>#</span>
        </div>
        <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Leaderboard launches with the validator network.
        </p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Top flow runners and validators will appear here.
        </p>
      </div>
    </div>
  );
}
