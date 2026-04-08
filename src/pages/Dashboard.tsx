import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { useTrainer, useQuests } from '../hooks/useTrainer';
import { useSkills } from '../hooks/useSkills';
import { useChains } from '../hooks/useChains';
import { activityEvents } from '../data/social';
import { MOCK_TRAINER } from '../data/gamification';
import type { TrainerCard as TrainerData } from '../hooks/useTrainer';

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const eventIcons: Record<string, { icon: string; color: string }> = {
  skill_published: { icon: '+', color: 'var(--green)' },
  skill_validated: { icon: '~', color: 'var(--cyan)' },
  bounty_created: { icon: '$', color: 'var(--gold)' },
  bounty_completed: { icon: '*', color: 'var(--gold)' },
  chain_run: { icon: '>', color: 'var(--purple)' },
  node_joined: { icon: '@', color: 'var(--cyan)' },
};

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-5 transition-all duration-200"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}44`;
        e.currentTarget.style.boxShadow = `0 0 20px ${color}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function TrainerWidget({ trainer }: { trainer: TrainerData }) {
  return (
    <div
      className="rounded-xl p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
           style={{ background: 'var(--cyan)' }} />

      <div className="flex items-center gap-5 relative z-10">
        {/* Level ring */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - trainer.xp_progress)}`}
              transform="rotate(-90 40 40)"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,200,0.5))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: 'var(--cyan)' }}>{trainer.level}</span>
            <span className="text-[8px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>lvl</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{trainer.title}</h3>

          {/* XP bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span>{trainer.xp.toLocaleString()} XP</span>
              <span>{trainer.xp_next.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${trainer.xp_progress * 100}%`, background: 'linear-gradient(90deg, var(--cyan), var(--green))' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: trainer.streak > 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>
              {trainer.streak > 0 ? `${trainer.streak}-day streak x${trainer.streak_multiplier}` : 'No active streak'}
            </span>
          </div>
        </div>
      </div>

      <Link
        to="/profile"
        className="block text-center text-xs mt-4 py-2 rounded-lg no-underline transition-all"
        style={{ background: 'rgba(0,255,200,0.06)', border: '1px solid rgba(0,255,200,0.15)', color: 'var(--cyan)' }}
      >
        View Full Profile
      </Link>
    </div>
  );
}

function QuestWidget() {
  const { data: quests } = useQuests();
  const questList = quests ?? [];

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Daily Quests
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold)' }}>
          {questList.filter(q => q.completed).length}/{questList.length} done
        </span>
      </div>
      <div className="space-y-2">
        {questList.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading quests...</p>
        )}
        {questList.map((q, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: q.completed ? 'var(--green)' : 'var(--border)',
                background: q.completed ? 'rgba(0,255,136,0.15)' : 'transparent',
              }}
            >
              {q.completed && <span className="text-[8px]" style={{ color: 'var(--green)' }}>&#10003;</span>}
            </div>
            <span
              className="text-xs flex-1"
              style={{
                color: q.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: q.completed ? 'line-through' : 'none',
              }}
            >
              {q.text}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--gold)' }}>+{q.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityWidget() {
  const recent = activityEvents.slice(0, 8);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h3>
        <Link to="/activity" className="text-[10px] no-underline" style={{ color: 'var(--cyan)' }}>
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {recent.map((event, i) => {
          const ei = eventIcons[event.eventType] || { icon: '?', color: 'var(--text-secondary)' };
          return (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: `${ei.color}15`, color: ei.color }}
              >
                {ei.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs truncate block" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--cyan)' }}>{event.nodeName}</span>{' '}
                  {event.description.replace(event.nodeName, '').replace(/^: /, '')}
                </span>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {timeAgo(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Explore Skills', to: '/explore', color: 'var(--cyan)', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { label: 'Run a Chain', to: '/chains', color: 'var(--purple)', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Achievements', to: '/profile', color: 'var(--gold)', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { label: 'View Docs', to: '/docs', color: 'var(--green)', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="flex flex-col items-center gap-2 p-4 rounded-xl no-underline transition-all duration-200"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${action.color}44`;
            e.currentTarget.style.boxShadow = `0 0 15px ${action.color}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={action.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={action.icon} />
          </svg>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { data: trainer } = useTrainer();
  const { data: skills } = useSkills();
  const { data: chains } = useChains();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <ConnectWalletPrompt title="Connect to access Dashboard" />
      </div>
    );
  }

  const t = trainer ?? MOCK_TRAINER as TrainerData;

  return (
    <div
      className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto transition-opacity duration-500"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#ffffff' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Welcome back. Here is your FlowFabric overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Skills Available"
          value={skills?.length ?? '126+'}
          color="var(--cyan)"
          sub="across all domains"
        />
        <StatCard
          label="Skill Chains"
          value={chains?.length ?? '68+'}
          color="var(--purple)"
          sub="multi-step pipelines"
        />
        <StatCard
          label="Your Level"
          value={`Lv.${t.level}`}
          color="var(--green)"
          sub={t.title}
        />
        <StatCard
          label="Achievements"
          value={`${t.achievements_unlocked}/${t.achievements_total}`}
          color="var(--gold)"
          sub={`${Math.round((t.achievements_unlocked / t.achievements_total) * 100)}% complete`}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Main grid: Trainer + Quests | Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <TrainerWidget trainer={t} />
          <QuestWidget />
        </div>
        <div className="lg:col-span-2">
          <ActivityWidget />
        </div>
      </div>
    </div>
  );
}
