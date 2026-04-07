import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSkills } from '../hooks/useSkills';
import { downloadSkill, copyInstallCommand } from '../utils/downloadSkill';

export default function PortalSkills() {
  const { data: skills, isLoading } = useSkills();
  const [search, setSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState('all');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const domains = ['all', ...Array.from(new Set((skills ?? []).map(s => s.domain))).sort()];

  const filtered = (skills ?? [])
    .filter(s => activeDomain === 'all' || s.domain === activeDomain)
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    });

  const handleInstall = useCallback(async (name: string) => {
    setInstallingId(name);
    try {
      await Promise.all([downloadSkill(name), copyInstallCommand(name)]);
    } catch {
      // download may fail if API is down -- clipboard copy still useful
      try { await copyInstallCommand(name); } catch { /* noop */ }
    }
    setTimeout(() => setInstallingId(null), 2000);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: '#00ffc8' }}>Portal</Link>
        <span>/</span>
        <span>Skills</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>Skills Browser</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Browse and install verified AI skills from the SkillChain registry
      </p>

      {/* Search + Domain Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skills by name, description, or tag..."
          className="flex-1 min-w-[240px] px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: 'rgba(26,26,46,0.6)',
            border: '1px solid var(--border)',
            color: '#ffffff',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#00ffc8'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ background: 'rgba(26,26,46,0.6)' }}>
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setActiveDomain(d)}
              className="px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all capitalize"
              style={{
                background: activeDomain === d ? 'rgba(0,255,200,0.1)' : 'transparent',
                color: activeDomain === d ? '#00ffc8' : 'var(--text-secondary)',
                border: activeDomain === d ? '1px solid rgba(0,255,200,0.25)' : '1px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <div className="mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl animate-pulse"
              style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
            >
              <div className="h-4 w-1/2 rounded mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-3 w-full rounded mb-2" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-3 w-3/4 rounded mb-4" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div
          className="text-center py-20 rounded-xl"
          style={{ background: 'rgba(26,26,46,0.4)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl mb-4" style={{ opacity: 0.3 }}>&#x1F50D;</div>
          <div className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No skills found</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try adjusting your search or domain filter
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(skill => {
            const isInstalling = installingId === skill.name;
            return (
              <div
                key={skill.name}
                className="p-5 rounded-xl transition-all group relative"
                style={{
                  background: 'rgba(26,26,46,0.6)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,200,0.3)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,200,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <Link
                    to={`/skill/${skill.name}`}
                    className="text-sm font-semibold no-underline hover:underline"
                    style={{ color: '#ffffff' }}
                  >
                    {skill.name}
                  </Link>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium shrink-0"
                    style={{
                      background: 'rgba(170,136,255,0.1)',
                      color: '#aa88ff',
                      border: '1px solid rgba(170,136,255,0.2)',
                    }}
                  >
                    {skill.domain}
                  </span>
                </div>

                {/* Description */}
                <p
                  className="text-xs mb-3 line-clamp-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {skill.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {skill.tags.slice(0, 4).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{
                        background: 'rgba(0,255,200,0.06)',
                        color: 'rgba(0,255,200,0.7)',
                        border: '1px solid rgba(0,255,200,0.1)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {skill.tags.length > 4 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      +{skill.tags.length - 4}
                    </span>
                  )}
                </div>

                {/* Footer: Price + License + Install */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        background: skill.free
                          ? 'rgba(0,255,136,0.1)'
                          : 'rgba(255,215,0,0.1)',
                        color: skill.free ? '#00ff88' : '#ffd700',
                        border: `1px solid ${skill.free ? 'rgba(0,255,136,0.25)' : 'rgba(255,215,0,0.25)'}`,
                      }}
                    >
                      {skill.free ? 'FREE' : skill.price}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {skill.license}
                    </span>
                  </div>
                  <button
                    onClick={() => handleInstall(skill.name)}
                    disabled={isInstalling}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                    style={{
                      background: isInstalling
                        ? 'rgba(0,255,136,0.2)'
                        : 'rgba(0,255,200,0.08)',
                      border: isInstalling
                        ? '1px solid rgba(0,255,136,0.4)'
                        : '1px solid rgba(0,255,200,0.2)',
                      color: isInstalling ? '#00ff88' : '#00ffc8',
                      opacity: isInstalling ? 1 : undefined,
                    }}
                  >
                    {isInstalling ? 'Downloaded!' : 'Install'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
