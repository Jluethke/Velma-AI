import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSkills } from '../hooks/useSkills';
import FlowCard from '../components/FlowCard';
import SearchBar from '../components/SearchBar';
import { formatFlowName } from '../utils/formatFlowName';

const FEATURED = [
  { slug: 'resume-builder',      emoji: '📄', why: 'ATS-optimized in one run' },
  { slug: 'salary-negotiator',   emoji: '💰', why: 'Counter-offers that land' },
  { slug: 'budget-builder',      emoji: '📊', why: 'Zero-based, actually works' },
  { slug: 'business-in-a-box',   emoji: '🚀', why: 'Idea → launch plan, 5 phases' },
  { slug: 'decision-analyzer',   emoji: '🧭', why: 'Big choices, clear framework' },
  { slug: 'interview-coach',     emoji: '🎯', why: 'STAR answers for any question' },
];

export default function Explore() {
  const { data: skills = [], isLoading } = useSkills();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [sort, setSort] = useState('name');

  const domains = useMemo(() => [...new Set(skills.map(s => s.domain))].sort(), [skills]);

  const filtered = useMemo(() => {
    let result = [...skills];

    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Filter by domain
    if (domain) {
      result = result.filter(s => s.domain === domain);
    }

    // Sort
    switch (sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'domain':
        result.sort((a, b) => a.domain.localeCompare(b.domain));
        break;
    }

    return result;
  }, [skills, query, domain, sort]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
        Explore Flows
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        {isLoading ? 'Loading...' : `${filtered.length} flow${filtered.length !== 1 ? 's' : ''} available`}
      </p>

      {/* Featured flows */}
      {!query && !domain && (
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
            Start here
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURED.map(f => (
              <Link
                key={f.slug}
                to={`/flow/${f.slug}`}
                className="no-underline group"
              >
                <div
                  className="rounded-xl p-4 flex flex-col gap-2 transition-all duration-200"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,200,0.25)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{f.emoji}</span>
                  <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {formatFlowName(f.slug)}
                  </span>
                  <span className="text-[10px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {f.why}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Claude Desktop nudge */}
      <div
        className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg text-xs"
        style={{
          background: 'rgba(0,255,200,0.04)',
          border: '1px solid rgba(0,255,200,0.1)',
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ color: 'var(--cyan)', fontSize: '14px' }}>✦</span>
        <span>
          Best experience:{' '}
          <a
            href="https://claude.ai/download"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--cyan)', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,200,0.3)' }}
          >
            Claude Desktop
          </a>{' '}
          + SkillChain MCP gives you persistent memory, wallet integration, and offline-capable flows.
        </span>
      </div>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        domain={domain}
        onDomainChange={setDomain}
        sort={sort}
        onSortChange={setSort}
        domains={domains}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 animate-pulse"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', height: 180 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {filtered.map(skill => (
            <FlowCard key={skill.name} skill={skill} locked={false} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No flows match your search.
          </p>
        </div>
      )}
    </div>
  );
}
