import { Link } from 'react-router-dom';
import { useTrainer } from '../hooks/useTrainer';
import { useQuests } from '../hooks/useTrainer';
import { useVelma } from '../hooks/useVelma';

/* ─── Skeleton placeholder ─── */
function Skeleton({ width = '100%', height = '1rem', rounded = '0.5rem' }: {
  width?: string; height?: string; rounded?: string;
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width, height, borderRadius: rounded,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

/* ─── Stat card (4-grid) ─── */
function StatCard({ label, value, total, accent = '#00ffc8' }: {
  label: string; value: number; total?: number; accent?: string;
}) {
  return (
    <div
      className="p-5 rounded-xl transition-all"
      style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: accent }}>
        {value.toLocaleString()}
        {total != null && (
          <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
            {' / '}{total}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Quick link card ─── */
function QuickLink({ to, title, description, icon }: {
  to: string; title: string; description: string; icon: string;
}) {
  return (
    <Link
      to={to}
      className="block p-5 rounded-xl no-underline transition-all"
      style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.3)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 200, 0.05)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-sm font-semibold mb-1" style={{ color: '#ffffff' }}>{title}</div>
      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</div>
    </Link>
  );
}

/* ─── Category badge ─── */
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    career: '#aa88ff', life: '#00ff88', health: '#00ffc8', money: '#ffd700',
    business: '#ff8844', learning: '#44aaff', developer: '#ff66aa',
  };
  const color = colors[category.toLowerCase()] || 'var(--text-secondary)';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium"
      style={{ background: `${color}15`, color }}
    >
      {category}
    </span>
  );
}

/* ─── Main Portal ─── */
export default function Portal() {
  const { data: trainer, isLoading: trainerLoading } = useTrainer();
  const { data: quests, isLoading: questsLoading } = useQuests();
  const { data: recommendations } = useVelma();

  const topRecs = (recommendations ?? []).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
          Skill Portal
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your AI skill training dashboard. No wallet required.
        </p>
      </div>

      {/* ── Trainer Card ── */}
      <div
        className="p-6 rounded-xl mb-8"
        style={{
          background: 'rgba(26,26,46,0.6)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 30px rgba(0, 255, 200, 0.04)',
        }}
      >
        {trainerLoading ? (
          <div className="space-y-4">
            <Skeleton width="40%" height="1.5rem" />
            <Skeleton width="100%" height="0.75rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        ) : trainer ? (
          <div>
            {/* Top row: level badge + title + streak */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* Level badge */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold font-mono"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,255,136,0.08))',
                  border: '1px solid rgba(0,255,200,0.25)',
                  color: '#00ffc8',
                }}
              >
                {trainer.level}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold" style={{ color: '#ffffff' }}>
                  {trainer.title}
                </div>
                <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Level {trainer.level}
                </div>
              </div>
              {/* Streak */}
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="streak">
                  {trainer.streak > 0 ? '\uD83D\uDD25' : '\u2744\uFE0F'}
                </span>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold" style={{ color: trainer.streak > 0 ? '#ffd700' : 'var(--text-secondary)' }}>
                    {trainer.streak}-day streak
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {trainer.streak_multiplier}x multiplier
                  </div>
                </div>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="mb-1 flex justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span>{trainer.xp.toLocaleString()} XP</span>
              <span>{trainer.xp_next.toLocaleString()} XP</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(trainer.xp_progress * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #00ffc8, #00ff88)',
                  boxShadow: '0 0 12px rgba(0, 255, 200, 0.4)',
                }}
              />
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
              {Math.round(trainer.xp_progress * 100)}% to level {trainer.level + 1}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── 4-Stat Grid ── */}
      {trainerLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}>
              <Skeleton width="60%" height="0.75rem" />
              <div className="mt-3"><Skeleton width="80%" height="1.75rem" /></div>
            </div>
          ))}
        </div>
      ) : trainer ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Skills Discovered" value={trainer.skills_discovered} total={trainer.skills_total} accent="#00ffc8" />
          <StatCard label="Chains Completed" value={trainer.chains_completed} total={trainer.chains_total} accent="#aa88ff" />
          <StatCard label="Achievements" value={trainer.achievements_unlocked} total={trainer.achievements_total} accent="#ffd700" />
          <StatCard label="Total Runs" value={trainer.total_skill_runs + trainer.total_chain_runs} accent="#00ff88" />
        </div>
      ) : null}

      {/* ── Daily Quests ── */}
      <div
        className="p-6 rounded-xl mb-8"
        style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>
          Daily Quests
        </h2>
        {questsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} height="2.5rem" />)}
          </div>
        ) : quests && quests.length > 0 ? (
          <div className="space-y-2">
            {quests.map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: q.completed ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)',
                  border: q.completed
                    ? '1px solid rgba(0,255,136,0.15)'
                    : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Check / circle icon */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={q.completed ? {
                      background: 'rgba(0,255,136,0.15)',
                      color: '#00ff88',
                      border: '1px solid rgba(0,255,136,0.3)',
                    } : {
                      background: 'transparent',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {q.completed && '\u2713'}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: q.completed ? 'var(--text-secondary)' : '#ffffff',
                      textDecoration: q.completed ? 'line-through' : 'none',
                    }}
                  >
                    {q.text}
                  </span>
                </div>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: 'rgba(255,215,0,0.1)',
                    color: '#ffd700',
                  }}
                >
                  +{q.xp} XP
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No quests available right now.</p>
        )}
      </div>

      {/* ── Velma Recommends ── */}
      {topRecs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>
            Velma Recommends
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {topRecs.map((rec, i) => (
              <div
                key={i}
                className="p-5 rounded-xl transition-all"
                style={{
                  background: 'rgba(26,26,46,0.6)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.25)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 200, 0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <CategoryBadge category={rec.category} />
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    #{i + 1}
                  </span>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: '#00ffc8' }}>
                  {rec.nudge}
                </p>
                <Link
                  to={`/chains`}
                  className="text-xs font-mono no-underline transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00ffc8')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {rec.chain} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Links (2x2) ── */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>
          Explore
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickLink
            to="/portal/trainer"
            title="Trainer Profile"
            description="Full stats, evolutions, and run history"
            icon={'\uD83C\uDFC6'}
          />
          <QuickLink
            to="/skills"
            title="Skill Library"
            description="Browse and discover 95+ AI skills"
            icon={'\uD83D\uDCDA'}
          />
          <QuickLink
            to="/achievements"
            title="Achievements"
            description="30 achievements to unlock"
            icon={'\uD83C\uDF96\uFE0F'}
          />
          <QuickLink
            to="/chains"
            title="Chains"
            description="Multi-skill pipelines for real problems"
            icon={'\uD83D\uDD17'}
          />
        </div>
      </div>
    </div>
  );
}
