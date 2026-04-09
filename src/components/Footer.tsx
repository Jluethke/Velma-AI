import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="px-6 py-16 gradient-border-top" style={{ position: 'relative' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Ready to compose?
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <Link
            to="/compose"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm font-semibold"
          >
            Open Composer
            <span>&rarr;</span>
          </Link>
          <Link
            to="/skill/budget-builder"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 no-underline text-sm"
          >
            Try a skill free
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          {[
            { to: '/docs', label: 'Docs', external: false },
            { to: 'https://github.com/Jluethke/FlowFabric', label: 'GitHub', external: true },
            { to: '/whitepaper', label: 'Whitepaper', external: false },
          ].map(link =>
            link.external ? (
              <a
                key={link.label}
                href={link.to}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm no-underline"
                style={{
                  color: 'var(--text-secondary)',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm no-underline"
                style={{
                  color: 'var(--text-secondary)',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          &copy; 2024-present The Wayfinder Trust
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="gradient-text" style={{ fontWeight: 600 }}>FlowFabric</span>
          {' '}&mdash; Create AI Flows. Built on TRUST.
        </p>
      </div>
    </footer>
  );
}
