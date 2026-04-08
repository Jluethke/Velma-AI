export default function InstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 max-w-md w-full relative"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 60px rgba(0,255,200,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg cursor-pointer"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
        >
          &#10005;
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Install in 30 seconds
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--cyan)' }}>
          Run skills directly in your terminal with Claude Code, Cursor, or Windsurf
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Download, double-click, done.
        </p>

        {/* Download buttons */}
        <div className="space-y-3 mb-6">
          <a
            href="/install.bat"
            download="FlowFabric-Install.bat"
            className="flex items-center gap-4 rounded-xl px-5 py-4 no-underline transition-all"
            style={{
              background: 'rgba(170,136,255,0.08)',
              border: '1px solid rgba(170,136,255,0.25)',
            }}
          >
            <span className="text-2xl">&#x1F5A5;</span>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Windows</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Download .bat installer</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{
              background: 'rgba(170,136,255,0.15)',
              color: 'var(--purple)',
            }}>
              Download
            </span>
          </a>

          <a
            href="/install.sh"
            download="FlowFabric-Install.sh"
            className="flex items-center gap-4 rounded-xl px-5 py-4 no-underline transition-all"
            style={{
              background: 'rgba(0,255,200,0.08)',
              border: '1px solid rgba(0,255,200,0.25)',
            }}
          >
            <span className="text-2xl">&#x1F34E;</span>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mac / Linux</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Download .sh installer</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{
              background: 'rgba(0,255,200,0.15)',
              color: 'var(--cyan)',
            }}>
              Download
            </span>
          </a>
        </div>

        {/* What happens */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>After you run it:</p>
          <ol className="text-xs space-y-1.5 pl-4" style={{ color: 'var(--text-secondary)' }}>
            <li>Installs FlowFabric via pip (Python)</li>
            <li>Auto-configures Claude Code, Cursor, Windsurf</li>
            <li>Restart your AI tool — just talk normally</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
