import CommunityPoolCard from '../components/CommunityPoolCard';

export default function Activity() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
        Network Activity
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Live feed of what is happening on FlowFabric
      </p>

      {/* Community pool — earner yield from purchase activity */}
      <div className="mb-8">
        <CommunityPoolCard />
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
            background: 'rgba(0, 255, 200, 0.08)',
            border: '1px solid rgba(0, 255, 200, 0.2)',
          }}
        >
          <span style={{ color: 'var(--cyan)' }}>~</span>
        </div>
        <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Activity feed coming soon.
        </p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Run flows to start generating your history.
        </p>
      </div>
    </div>
  );
}
