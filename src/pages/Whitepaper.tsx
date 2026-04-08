import { Link } from 'react-router-dom';

const tocSections = [
  'Abstract',
  '1. Introduction',
  '2. Architecture Overview',
  '3. Trust as Consensus',
  '4. Skill Lifecycle',
  '5. Token Economics',
  '6. The Autonomy Thesis',
  '7. Smart Contract Architecture',
  '8. Competitive Landscape',
  '9. Roadmap',
  '10. Team & IP',
  'Appendix A: ALG Mathematical Specification',
  'Appendix B: Token Distribution',
  'Appendix C: Contract Addresses (Base Sepolia)',
];

export default function Whitepaper() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#ffffff' }}>
          SkillChain Whitepaper
        </h1>
        <p className="text-lg mb-2" style={{ color: 'var(--cyan)' }}>
          A Decentralized Protocol for AI Skill Discovery, Validation, and Trade
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Trust as Consensus -- A New Paradigm for AI Agent Interoperability
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Version 1.0 | March 2026 | The Wayfinder Trust
        </p>
      </div>

      {/* Abstract */}
      <div
        className="p-8 rounded-xl mb-12"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--cyan)' }}>Abstract</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          AI agents are increasingly capable of learning reusable procedures -- skills -- from their own execution. But those skills remain trapped inside the systems that created them. An agent that learns to parse SEC filings cannot share that capability with another agent without manual extraction, reformatting, and blind-faith installation. There is no verification. No provenance. No market.
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          SkillChain is a decentralized protocol for publishing, validating, and trading AI skills as first-class network assets. Skills are packaged as .skillpack bundles containing executable procedures, test cases, and cryptographic provenance. Validation uses shadow testing -- running candidate skills against known-good outputs -- rather than subjective reviews.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The core innovation is the integration of the Assured Learning Governor (ALG), a patented governance framework where trust is computed as exp(-decay * divergence) with EMA smoothing. Trust decays fast on failure, recovers slowly through consistent performance, and cannot be self-asserted or purchased. This creates a network where the cost of bad behavior always exceeds the benefit, and where quality is enforced by mathematics rather than moderation.
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { value: '1B', label: 'Token Supply', color: 'var(--cyan)' },
          { value: '8', label: 'Smart Contracts', color: 'var(--purple)' },
          { value: '16', label: 'Genesis Skills', color: 'var(--green)' },
          { value: '2', label: 'Patent Families', color: 'var(--gold)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table of Contents */}
      <div
        className="p-8 rounded-xl mb-12"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-6" style={{ color: '#ffffff' }}>Table of Contents</h2>
        <div className="space-y-2">
          {tocSections.map((section, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 text-sm"
              style={{ borderBottom: i < tocSections.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="text-xs w-6 text-right" style={{ color: 'var(--cyan)' }}>
                {section.startsWith('Appendix') ? '' : (i < 11 ? String(i) : '')}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{section}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="/docs"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{
            background: 'var(--cyan)',
            color: '#0a0a0f',
          }}
        >
          Read Full Documentation
        </a>
        <Link
          to="/docs"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{
            background: 'transparent',
            color: 'var(--cyan)',
            border: '1px solid rgba(0, 255, 200, 0.3)',
          }}
        >
          Read Getting Started Guide
        </Link>
      </div>
    </div>
  );
}
