import { Link } from 'react-router-dom';
import { useSkilldex } from '../hooks/useTrainer';

const CATEGORY_COLORS: Record<string, string> = {
  life: '#00ff88',
  career: '#00ffc8',
  money: '#ffd700',
  health: '#ff6b6b',
  business: '#aa88ff',
  developer: '#00bcd4',
  onboarding: '#ffab40',
};

function getCategoryColor(category: string): string {
  const key = category.toLowerCase();
  return CATEGORY_COLORS[key] || '#00ffc8';
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className || ''}`}
      style={{ background: 'rgba(255,255,255,0.04)' }}
    />
  );
}

export default function PortalSkilldex() {
  const { data: skilldex, isLoading } = useSkilldex();

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-secondary)' }}>
        <Link
          to="/portal"
          className="no-underline transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffc8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          Portal
        </Link>
        <span>/</span>
        <span style={{ color: '#ffffff' }}>Skilldex</span>
      </div>

      {/* Page Title */}
      <h1
        className="text-3xl md:text-4xl font-bold mb-2"
        style={{ color: '#00ffc8', textShadow: '0 0 40px rgba(0, 255, 200, 0.15)' }}
      >
        Skilldex
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Your flow collection progress. Discover them all.
      </p>

      {isLoading || !skilldex ? (
        /* Loading Skeleton */
        <div>
          <SkeletonBlock className="h-6 w-64 mb-4" />
          <SkeletonBlock className="h-4 w-full max-w-xl mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
              >
                <SkeletonBlock className="h-5 w-32 mb-3" />
                <SkeletonBlock className="h-3 w-full mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <SkeletonBlock key={j} className="h-3 w-48" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div
            className="rounded-xl p-6 mb-10"
            style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <span className="text-lg font-bold" style={{ color: '#ffffff' }}>
                <span style={{ color: '#00ffc8' }}>{skilldex.total_discovered}</span>
                {' / '}
                <span>{skilldex.total_skills}</span>
                {' Flows Discovered'}
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  background: 'rgba(0, 255, 200, 0.1)',
                  color: '#00ffc8',
                  border: '1px solid rgba(0, 255, 200, 0.2)',
                }}
              >
                {skilldex.percent}%
              </span>
            </div>
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(skilldex.percent, 100)}%`,
                  background: 'linear-gradient(90deg, #00ffc8, #aa88ff)',
                  boxShadow: '0 0 12px rgba(0, 255, 200, 0.3)',
                }}
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(skilldex.categories).map(([catName, cat]) => {
              const color = getCategoryColor(catName);
              return (
                <div
                  key={catName}
                  className="rounded-xl p-5 transition-all"
                  style={{
                    background: 'rgba(26,26,46,0.6)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${color}33`;
                    e.currentTarget.style.boxShadow = `0 0 25px ${color}0d`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className="text-sm font-bold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {catName}
                    </h3>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${color}18`,
                        color,
                      }}
                    >
                      {cat.percent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(cat.percent, 100)}%`,
                          background: color,
                          boxShadow: `0 0 8px ${color}44`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {cat.discovered}/{cat.total}
                    </span>
                  </div>

                  {/* Skill List */}
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {cat.skills.map(skill => (
                      <div
                        key={skill.name}
                        className="flex items-center gap-2 text-xs py-1"
                      >
                        {/* Discovery dot */}
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: skill.discovered ? color : 'rgba(255,255,255,0.1)',
                            boxShadow: skill.discovered ? `0 0 4px ${color}66` : 'none',
                          }}
                        />
                        {/* Skill name */}
                        <span
                          className="flex-1 truncate"
                          style={{
                            color: skill.discovered ? '#ffffff' : 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {skill.discovered ? skill.name : '???'}
                        </span>
                        {/* Evolution badge */}
                        {skill.evolution && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                            style={{
                              background: 'rgba(170, 136, 255, 0.15)',
                              color: '#aa88ff',
                              border: '1px solid rgba(170, 136, 255, 0.2)',
                            }}
                          >
                            {skill.evolution}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
