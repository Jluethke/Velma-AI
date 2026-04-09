import { Link } from 'react-router-dom';
import { useTrainer, useQuests, useEvolutions } from '../hooks/useTrainer';

/* ─── Skeleton ─── */
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
      }}
    />
  );
}

/* ─── Evolution tier colors ─── */
const TIER_COLORS: Record<string, string> = {
  base: '#8888aa',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00ffc8',
  diamond: '#aa88ff',
};

function getTierColor(tier: string): string {
  return TIER_COLORS[tier.toLowerCase()] || 'var(--text-secondary)';
}

/* ─── Full stat row ─── */
function StatRow({ label, value, accent = '#00ffc8' }: {
  label: string; value: string | number; accent?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-mono font-semibold" style={{ color: accent }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

/* ─── Main component ─── */
export default function PortalTrainer() {
  const { data: trainer, isLoading: trainerLoading, isError: trainerError } = useTrainer();
  const { data: quests, isLoading: questsLoading } = useQuests();
  const { data: evolutions, isLoading: evosLoading } = useEvolutions();

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono mb-6" style={{ color: 'var(--text-secondary)' }}>
        <Link
          to="/portal"
          className="no-underline transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffc8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          Portal
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ color: '#00ffc8' }}>Trainer</span>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
          Trainer Profile
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your complete training stats, evolutions, and quest progress.
        </p>
      </div>

      {/* Error state */}
      {trainerError && (
        <div
          className="p-4 rounded-xl mb-6 text-sm"
          style={{
            background: 'rgba(255,68,102,0.08)',
            border: '1px solid rgba(255,68,102,0.2)',
            color: '#ff4466',
          }}
        >
          Could not load trainer data. The SDK server may be offline. Showing cached data if available.
        </div>
      )}

      {/* ── Large Trainer Card ── */}
      <div
        className="p-8 rounded-xl mb-8"
        style={{
          background: 'rgba(26,26,46,0.6)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 40px rgba(0, 255, 200, 0.04)',
        }}
      >
        {trainerLoading ? (
          <div className="space-y-4">
            <Skeleton width="30%" height="2rem" />
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="50%" height="1rem" />
          </div>
        ) : trainer ? (
          <>
            {/* Identity row */}
            <div className="flex flex-wrap items-start gap-6 mb-6">
              {/* Level emblem */}
              <div
                className="flex flex-col items-center justify-center w-20 h-20 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,200,0.12), rgba(0,255,136,0.06))',
                  border: '2px solid rgba(0,255,200,0.2)',
                }}
              >
                <span className="text-2xl font-bold font-mono" style={{ color: '#00ffc8' }}>
                  {trainer.level}
                </span>
                <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  Level
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#ffffff' }}>
                  {trainer.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  <span>Level {trainer.level}</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                  <span>{trainer.total_skill_runs + trainer.total_chain_runs} total runs</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                  <span>{trainer.skills_discovered} flows discovered</span>
                </div>
              </div>

              {/* Streak block */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  background: trainer.streak > 0 ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
                  border: trainer.streak > 0 ? '1px solid rgba(255,215,0,0.15)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span className="text-2xl">
                  {trainer.streak > 0 ? '\uD83D\uDD25' : '\u2744\uFE0F'}
                </span>
                <div>
                  <div className="text-lg font-mono font-bold" style={{ color: trainer.streak > 0 ? '#ffd700' : 'var(--text-secondary)' }}>
                    {trainer.streak} days
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Best: {trainer.streak_best} &middot; {trainer.streak_multiplier}x mult
                  </div>
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div className="mb-2 flex justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span>{trainer.xp.toLocaleString()} XP</span>
              <span>{trainer.xp_next.toLocaleString()} XP needed for Level {trainer.level + 1}</span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(trainer.xp_progress * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #00ffc8, #00ff88, #44aaff)',
                  boxShadow: '0 0 16px rgba(0, 255, 200, 0.4)',
                }}
              />
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
              {Math.round(trainer.xp_progress * 100)}% complete &middot;{' '}
              {(trainer.xp_next - trainer.xp).toLocaleString()} XP remaining
            </div>
          </>
        ) : null}
      </div>

      {/* ── Two-column: Stats + Quests ── */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Full Stats */}
        <div
          className="p-6 rounded-xl"
          style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            Statistics
          </h3>
          {trainerLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} height="2rem" />)}
            </div>
          ) : trainer ? (
            <div>
              <StatRow label="Flows Discovered" value={`${trainer.skills_discovered} / ${trainer.skills_total}`} accent="#00ffc8" />
              <StatRow label="Chains Completed" value={`${trainer.chains_completed} / ${trainer.chains_total}`} accent="#aa88ff" />
              <StatRow label="Achievements Unlocked" value={`${trainer.achievements_unlocked} / ${trainer.achievements_total}`} accent="#ffd700" />
              <StatRow label="Total Flow Runs" value={trainer.total_skill_runs} accent="#00ff88" />
              <StatRow label="Total Chain Runs" value={trainer.total_chain_runs} accent="#44aaff" />
              <StatRow label="Current Streak" value={`${trainer.streak} days`} accent={trainer.streak > 0 ? '#ffd700' : '#8888aa'} />
              <StatRow label="Best Streak" value={`${trainer.streak_best} days`} accent="#ffd700" />
              <StatRow label="Streak Multiplier" value={`${trainer.streak_multiplier}x`} accent="#ff8844" />

              {/* Completion bars */}
              <div className="mt-5 space-y-3">
                <CompletionBar
                  label="Flow Discovery"
                  current={trainer.skills_discovered}
                  total={trainer.skills_total}
                  color="#00ffc8"
                />
                <CompletionBar
                  label="Chain Mastery"
                  current={trainer.chains_completed}
                  total={trainer.chains_total}
                  color="#aa88ff"
                />
                <CompletionBar
                  label="Achievements"
                  current={trainer.achievements_unlocked}
                  total={trainer.achievements_total}
                  color="#ffd700"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Daily Quests */}
        <div
          className="p-6 rounded-xl"
          style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            Daily Quests
          </h3>
          {questsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} height="3rem" />)}
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
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={q.completed ? {
                        background: 'rgba(0,255,136,0.15)',
                        color: '#00ff88',
                        border: '1px solid rgba(0,255,136,0.3)',
                      } : {
                        background: 'transparent',
                        border: '2px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      {q.completed && '\u2713'}
                    </div>
                    <div>
                      <div
                        className="text-sm"
                        style={{
                          color: q.completed ? 'var(--text-secondary)' : '#ffffff',
                          textDecoration: q.completed ? 'line-through' : 'none',
                        }}
                      >
                        {q.text}
                      </div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {q.type}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: q.completed ? 'rgba(0,255,136,0.1)' : 'rgba(255,215,0,0.1)',
                      color: q.completed ? '#00ff88' : '#ffd700',
                    }}
                  >
                    {q.completed ? '\u2713 ' : '+'}{q.xp} XP
                  </span>
                </div>
              ))}
              {/* Quest summary */}
              <div className="pt-3 mt-2 flex justify-between text-xs font-mono" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                <span>{quests.filter(q => q.completed).length}/{quests.length} completed</span>
                <span style={{ color: '#ffd700' }}>
                  {quests.filter(q => !q.completed).reduce((s, q) => s + q.xp, 0)} XP available
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No quests available.</p>
          )}
        </div>
      </div>

      {/* ── Evolutions ── */}
      <div
        className="p-6 rounded-xl mb-8"
        style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
          Flow Evolutions
        </h3>
        {evosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height="4rem" />
            ))}
          </div>
        ) : evolutions && evolutions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {evolutions.map((evo, i) => {
              const tierColor = getTierColor(evo.tier);
              return (
                <div
                  key={i}
                  className="p-4 rounded-lg transition-all"
                  style={{
                    background: `${tierColor}08`,
                    border: `1px solid ${tierColor}20`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${tierColor}40`;
                    e.currentTarget.style.boxShadow = `0 0 15px ${tierColor}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${tierColor}20`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
                    {evo.skill}
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold"
                    style={{
                      background: `${tierColor}18`,
                      color: tierColor,
                      border: `1px solid ${tierColor}30`,
                    }}
                  >
                    {evo.tier}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">{'\uD83C\uDF31'}</div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No evolutions yet. Keep running flows to evolve them.
            </p>
          </div>
        )}
      </div>

      {/* ── Run Statistics ── */}
      {trainer && (
        <div
          className="p-6 rounded-xl"
          style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
            Run Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RunStatBlock label="Flow Runs" value={trainer.total_skill_runs} color="#00ffc8" />
            <RunStatBlock label="Chain Runs" value={trainer.total_chain_runs} color="#aa88ff" />
            <RunStatBlock
              label="Avg. Runs/Day"
              value={trainer.streak > 0
                ? Math.round((trainer.total_skill_runs + trainer.total_chain_runs) / Math.max(trainer.streak, 1))
                : 0
              }
              color="#00ff88"
            />
            <RunStatBlock
              label="Run Ratio"
              value={trainer.total_chain_runs > 0
                ? `${(trainer.total_skill_runs / trainer.total_chain_runs).toFixed(1)}:1`
                : '--'
              }
              color="#ffd700"
              isString
            />
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link
          to="/portal"
          className="text-sm font-mono no-underline transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffc8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          &larr; Back to Portal
        </Link>
      </div>
    </div>
  );
}

/* ─── Completion bar sub-component ─── */
function CompletionBar({ label, current, total, color }: {
  label: string; current: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Run stat block sub-component ─── */
function RunStatBlock({ label, value, color, isString = false }: {
  label: string; value: number | string; color: string; isString?: boolean;
}) {
  return (
    <div className="text-center p-4 rounded-lg" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
      <div className="text-2xl font-bold font-mono mb-1" style={{ color }}>
        {isString ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
      </div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}
