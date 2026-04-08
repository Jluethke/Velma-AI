import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="px-6 py-16" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Ready to compose?
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <Link
            to="/compose"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl no-underline transition-all text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(170,136,255,0.15))',
              border: '1px solid rgba(0,255,200,0.3)',
              color: 'var(--cyan)',
            }}
          >
            Open Composer
          </Link>
          <Link
            to="/skill/budget-builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl no-underline transition-all text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            Try a skill free
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          <Link to="/docs" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Docs
          </Link>
          <a href="https://github.com/Jluethke/FlowFabric" target="_blank" rel="noopener noreferrer" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            GitHub
          </a>
          <Link to="/whitepaper" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Whitepaper
          </Link>
        </div>

        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          &copy; 2024-present The Wayfinder Trust
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          FlowFabric — Create flows built on TRUST.
        </p>
      </div>
    </footer>
  );
}
