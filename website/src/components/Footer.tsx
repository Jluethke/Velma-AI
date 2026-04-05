import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('pip install skillchain');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="px-6 py-20" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ffffff' }}>
          Ready to build?
        </h2>

        {/* Terminal CTA */}
        <div
          className="inline-flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all mb-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
          onClick={handleCopy}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
          <span className="text-sm font-medium" style={{ color: 'var(--cyan)' }}>
            pip install skillchain
          </span>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              background: copied ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 255, 200, 0.1)',
              color: copied ? 'var(--green)' : 'var(--text-secondary)',
            }}
          >
            {copied ? 'copied!' : 'copy'}
          </span>
        </div>

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
