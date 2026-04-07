import { Link } from 'react-router-dom';
import { useAchievements } from '../hooks/useTrainer';

export default function PortalAchievements() {
  const { data: achievements, isLoading } = useAchievements();

  const unlocked = (achievements ?? []).filter(a => a.unlocked);
  const locked = (achievements ?? []).filter(a => !a.unlocked);
  const totalXpEarned = unlocked.reduce((sum, a) => sum + a.xp_reward, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: '#00ffc8' }}>Portal</Link>
        <span>/</span>
        <span>Achievements</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>Achievement Showcase</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Track your progression through the SkillChain ecosystem
      </p>

      {/* Summary Bar */}
      {!isLoading && achievements && (
        <div
          className="flex flex-wrap items-center gap-6 p-5 rounded-xl mb-8"
          style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Unlocked</div>
            <div className="text-2xl font-bold">
              <span style={{ color: '#00ffc8' }}>{unlocked.length}</span>
              <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}> / {achievements.length}</span>
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>XP Earned</div>
            <div className="text-2xl font-bold" style={{ color: '#ffd700' }}>
              {totalXpEarned.toLocaleString()}
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
              <span style={{ color: '#00ffc8' }}>
                {achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,255,200,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: achievements.length > 0 ? `${(unlocked.length / achievements.length) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, #00ffc8, #00ff88)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <>
          <div
            className="h-20 rounded-xl mb-8 animate-pulse"
            style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl animate-pulse"
                style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="flex-1">
                    <div className="h-4 w-2/3 rounded mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-3 w-full rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state (API failed, no data) */}
      {!isLoading && (!achievements || achievements.length === 0) && (
        <div
          className="text-center py-20 rounded-xl"
          style={{ background: 'rgba(26,26,46,0.4)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl mb-4" style={{ opacity: 0.3 }}>&#x1F3C6;</div>
          <div className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>No achievements loaded</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect the MCP server to see your achievements
          </div>
        </div>
      )}

      {/* Unlocked Section */}
      {!isLoading && unlocked.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#00ffc8' }}>
            <span style={{ fontSize: 20 }}>&#x2728;</span>
            Unlocked ({unlocked.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {unlocked.map(ach => (
              <div
                key={ach.id}
                className="p-5 rounded-xl transition-all relative overflow-hidden"
                style={{
                  background: 'rgba(26,26,46,0.6)',
                  border: '1px solid rgba(0,255,200,0.25)',
                  boxShadow: '0 0 15px rgba(0,255,200,0.06)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,200,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(0,255,200,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,200,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(0,255,200,0.25)';
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: 'rgba(0,255,200,0.08)',
                      border: '1px solid rgba(0,255,200,0.15)',
                    }}
                  >
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-semibold truncate" style={{ color: '#ffffff' }}>
                        {ach.name}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                        style={{
                          background: 'rgba(255,215,0,0.1)',
                          color: '#ffd700',
                          border: '1px solid rgba(255,215,0,0.25)',
                        }}
                      >
                        +{ach.xp_reward} XP
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {ach.description}
                    </p>
                    {ach.unlocked_at && (
                      <div className="text-[10px]" style={{ color: 'rgba(0,255,200,0.5)' }}>
                        Unlocked {formatDate(ach.unlocked_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Locked Section */}
      {!isLoading && locked.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: 20 }}>&#x1F512;</span>
            Locked ({locked.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map(ach => (
              <div
                key={ach.id}
                className="p-5 rounded-xl transition-all relative overflow-hidden"
                style={{
                  background: 'rgba(26,26,46,0.4)',
                  border: '1px solid var(--border)',
                  opacity: 0.55,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.55'; }}
              >
                {/* Lock overlay icon */}
                <div
                  className="absolute top-3 right-3 text-xs"
                  style={{ color: 'var(--text-secondary)', opacity: 0.4 }}
                >
                  &#x1F512;
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      filter: 'grayscale(0.8)',
                    }}
                  >
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
                        {ach.name}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        +{ach.xp_reward} XP
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {ach.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
