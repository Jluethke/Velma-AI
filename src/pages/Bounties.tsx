export default function Bounties() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Flow Bounties
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Fund new flows or earn TRUST by building them
          </p>
        </div>
        <button
          disabled
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: 'rgba(255, 215, 0, 0.08)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            color: 'var(--gold)',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          + Post a Bounty
        </button>
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
          <span style={{ color: 'var(--gold)' }}>$</span>
        </div>
        <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Bounties let the community fund new flows.
        </p>
        <p className="text-sm max-w-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Post a bounty for a flow you want built, or claim one to earn TRUST.
        </p>
        <button
          disabled
          className="px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(255, 215, 0, 0.10)',
            border: '1px solid rgba(255, 215, 0, 0.25)',
            color: 'var(--gold)',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          + Post a Bounty
        </button>
      </div>
    </div>
  );
}
