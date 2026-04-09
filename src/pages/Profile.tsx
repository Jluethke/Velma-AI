import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORY_META,
  CATEGORY_COLORS,
  EVOLUTION_TIERS,
  type AchievementDef,
} from '../data/gamification';
import { useTrainer, useQuests } from '../hooks/useTrainer';
import type { TrainerCard as TrainerData } from '../hooks/useTrainer';

// ── Mock data for profile sections ──────────────────────────────────

const MOCK_ACHIEVEMENT_STATUS: Record<string, { unlocked: boolean; unlockedAt?: string }> = {};

const MOCK_SKILLDEX: { category: string; discovered: number; total: number }[] = [];

const MOCK_EVOLVED_SKILLS: { name: string; tier: string; runs: number }[] = [];

// ── Helpers ──────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

function hoursUntilReset(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 3_600_000));
}

// ── Trainer Card ─────────────────────────────────────────────────────

const DEFAULT_TRAINER: TrainerData = {
  level: 1, title: 'Novice', xp: 0, xp_next: 100, xp_progress: 0,
  streak: 0, streak_best: 0, streak_multiplier: 1.0,
  skills_discovered: 0, skills_total: 95,
  chains_completed: 0, chains_total: 44,
  achievements_unlocked: 0, achievements_total: 30,
  total_skill_runs: 0, total_chain_runs: 0,
};

function TrainerCard() {
  const { data: trainer } = useTrainer();
  const t = trainer ?? DEFAULT_TRAINER;
  return (
    <div
      className="rounded-xl p-6 md:p-8 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 0 40px rgba(0,255,200,0.06)',
      }}
    >
      {/* Ambient glow behind level ring */}
      <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl pointer-events-none"
           style={{ background: 'var(--cyan)' }} />

      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        {/* Level ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            {/* Progress ring */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - t.xp_progress)}`}
              transform="rotate(-90 60 60)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,200,0.5))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: 'var(--cyan)' }}>{t.level}</span>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>level</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t.title}</h2>

          {/* XP bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span>{t.xp.toLocaleString()} XP</span>
              <span>{t.xp_next.toLocaleString()} XP</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${t.xp_progress * 100}%`, background: 'linear-gradient(90deg, var(--cyan), var(--green))' }}
              />
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
            <span className="text-lg">{t.streak > 0 ? '🔥' : '💤'}</span>
            <span className="text-sm font-semibold" style={{ color: t.streak > 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>
              {t.streak}-day streak
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: 'var(--gold)' }}>
              x{t.streak_multiplier}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>best: {t.streak_best}</span>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 justify-center md:justify-start">
            {[
              { label: 'Flows', val: `${t.skills_discovered}/${t.skills_total}` },
              { label: 'Chains', val: `${t.chains_completed}/${t.chains_total}` },
              { label: 'Achievements', val: `${t.achievements_unlocked}/${t.achievements_total}` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.val}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quest Tracker ────────────────────────────────────────────────────

function QuestTracker() {
  const { data: quests } = useQuests();
  const questList = quests ?? [];
  const [reset] = useState(hoursUntilReset);
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Daily Quests
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
          resets in {reset}h
        </span>
      </div>
      <div className="space-y-3">
        {questList.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading quests...</p>
        )}
        {questList.map((q, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer group">
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                borderColor: q.completed ? 'var(--green)' : 'var(--border)',
                background: q.completed ? 'rgba(0,255,136,0.15)' : 'transparent',
              }}
            >
              {q.completed && <span className="text-xs" style={{ color: 'var(--green)' }}>&#10003;</span>}
            </div>
            <span
              className="text-sm flex-1"
              style={{
                color: q.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: q.completed ? 'line-through' : 'none',
              }}
            >
              {q.text}
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>+{q.xp} XP</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Achievement Card ─────────────────────────────────────────────────

function AchievementCard({ def, unlocked, unlockedAt }: {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt?: string;
}) {
  const catMeta = ACHIEVEMENT_CATEGORY_META[def.category];
  return (
    <div
      className="rounded-lg p-4 transition-all duration-200 group"
      style={{
        background: unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${unlocked ? catMeta.color + '44' : 'var(--border)'}`,
        boxShadow: unlocked ? `0 0 16px ${catMeta.color}18` : 'none',
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" style={{ filter: unlocked ? 'none' : 'grayscale(1) brightness(0.5)' }}>
          {def.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {unlocked ? def.name : '???'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {unlocked ? def.description : 'Locked'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold" style={{ color: 'var(--gold)' }}>+{def.xpReward} XP</span>
            {unlocked && unlockedAt && (
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {new Date(unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Achievement Grid ─────────────────────────────────────────────────

function AchievementGrid() {
  const grouped = groupBy(ACHIEVEMENTS, a => a.category);
  const categories: AchievementDef['category'][] = ['first_steps', 'collection', 'chains', 'streaks', 'mastery', 'evolution', 'special'];

  return (
    <div className="space-y-8">
      {categories.map(cat => {
        const meta = ACHIEVEMENT_CATEGORY_META[cat];
        const items = grouped[cat] ?? [];
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                {meta.label}
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {items.filter(i => MOCK_ACHIEVEMENT_STATUS[i.id]?.unlocked).length}/{items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(def => {
                const status = MOCK_ACHIEVEMENT_STATUS[def.id];
                return (
                  <AchievementCard
                    key={def.id}
                    def={def}
                    unlocked={status?.unlocked ?? false}
                    unlockedAt={status?.unlockedAt}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Skilldex ─────────────────────────────────────────────────────────

function Skilldex() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {MOCK_SKILLDEX.map(cat => {
        const pct = cat.total > 0 ? (cat.discovered / cat.total) * 100 : 0;
        const color = CATEGORY_COLORS[cat.category] ?? 'var(--text-secondary)';
        return (
          <div
            key={cat.category}
            className="rounded-lg p-4 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${color}22`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color }}>{cat.category}</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {cat.discovered}/{cat.total}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <div className="text-right text-[10px] mt-1 font-mono" style={{ color: 'var(--text-secondary)' }}>
              {pct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Evolution Showcase ───────────────────────────────────────────────

function EvolutionShowcase() {
  return (
    <div className="space-y-2">
      {MOCK_EVOLVED_SKILLS.map((skill, i) => {
        const tierColor = EVOLUTION_TIERS[skill.tier] ?? '#888';
        return (
          <div
            key={skill.name}
            className="flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${tierColor}22`,
            }}
          >
            <span className="text-sm font-mono w-5 text-center" style={{ color: 'var(--text-secondary)' }}>
              {i + 1}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
              style={{
                color: tierColor,
                background: `${tierColor}18`,
                border: `1px solid ${tierColor}33`,
                textShadow: `0 0 8px ${tierColor}44`,
              }}
            >
              {skill.tier}
            </span>
            <span className="text-sm font-mono flex-1" style={{ color: 'var(--text-primary)' }}>
              {skill.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {skill.runs} runs
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Profile page ─────────────────────────────────────────────────────

export default function Profile() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <ConnectWalletPrompt title="Connect to view your Profile" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 md:px-6 py-10 max-w-6xl mx-auto transition-opacity duration-500"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      {/* Header */}
      <div className="mb-2">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--cyan)' }}>
          trainer profile
        </span>
      </div>

      {/* Top row: Trainer Card + Quest Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
        <div className="lg:col-span-2">
          <TrainerCard />
        </div>
        <div>
          <QuestTracker />
        </div>
      </div>

      {/* Skilldex */}
      <Section title="Skilldex">
        <Skilldex />
      </Section>

      {/* Achievements */}
      <Section title="Achievements">
        <AchievementGrid />
      </Section>

      {/* Evolution Showcase */}
      <Section title="Evolution Showcase">
        <EvolutionShowcase />
      </Section>
    </div>
  );
}
