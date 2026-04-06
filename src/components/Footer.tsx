import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="px-6 py-20" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ffffff' }}>
          Ready to build?
        </h2>

        {/* Download CTA */}
        <a
          href="/download"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl no-underline cursor-pointer transition-all mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(170,136,255,0.15))',
            border: '1px solid rgba(0,255,200,0.3)',
            color: 'var(--cyan)',
          }}
        >
          <span className="text-sm font-semibold">
            Download SkillChain
          </span>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              background: 'rgba(0, 255, 136, 0.15)',
              color: 'var(--green)',
            }}
          >
            Free
          </span>
        </a>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          <Link to="/whitepaper" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Whitepaper
          </Link>
          <a href="https://github.com" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            GitHub
          </a>
          <Link to="/docs" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Docs
          </Link>
          <a href="#" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Community
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
          &copy; 2024-present The Wayfinder Trust. All rights reserved.
        </p>
        <p className="text-xs" style={{ color: 'rgba(136, 136, 170, 0.5)' }}>
          Powered by trust, not promises.
        </p>
      </div>
    </footer>
  );
}
