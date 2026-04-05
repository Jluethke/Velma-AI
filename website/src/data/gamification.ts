// ── Gamification static data ──────────────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  icon: string;
  category: 'first_steps' | 'collection' | 'chains' | 'streaks' | 'mastery' | 'evolution' | 'special';
}

export interface LevelDef {
  level: number;
  title: string;
  tier: string;
  xpRequired: number;
}

// ── All 30 achievements ──────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  // First Steps
  { id: 'first_run', name: 'First Steps', description: 'Run your first skill', xpReward: 50, icon: '🚀', category: 'first_steps' },
  { id: 'first_chain', name: 'Chain Reaction', description: 'Complete your first skill chain', xpReward: 100, icon: '🔗', category: 'first_steps' },
  { id: 'first_category', name: 'Explorer', description: 'Discover a skill in every category', xpReward: 75, icon: '🧭', category: 'first_steps' },

  // Collection
  { id: 'collector_10', name: 'Collector', description: 'Discover 10 skills', xpReward: 100, icon: '📦', category: 'collection' },
  { id: 'collector_25', name: 'Hoarder', description: 'Discover 25 skills', xpReward: 200, icon: '🗄️', category: 'collection' },
  { id: 'collector_50', name: 'Curator', description: 'Discover 50 skills', xpReward: 400, icon: '🏛️', category: 'collection' },
  { id: 'collector_95', name: 'Completionist', description: 'Discover all 95 skills', xpReward: 1000, icon: '👑', category: 'collection' },

  // Chains
  { id: 'chain_5', name: 'Chainer', description: 'Complete 5 skill chains', xpReward: 150, icon: '⛓️', category: 'chains' },
  { id: 'chain_15', name: 'Linker', description: 'Complete 15 skill chains', xpReward: 300, icon: '🔗', category: 'chains' },
  { id: 'chain_all', name: 'Grandmaster', description: 'Complete all 44 skill chains', xpReward: 1500, icon: '🏆', category: 'chains' },

  // Streaks
  { id: 'streak_3', name: 'Warming Up', description: 'Maintain a 3-day streak', xpReward: 50, icon: '🔥', category: 'streaks' },
  { id: 'streak_7', name: 'On Fire', description: 'Maintain a 7-day streak', xpReward: 150, icon: '🔥', category: 'streaks' },
  { id: 'streak_14', name: 'Blazing', description: 'Maintain a 14-day streak', xpReward: 300, icon: '🔥', category: 'streaks' },
  { id: 'streak_30', name: 'Inferno', description: 'Maintain a 30-day streak', xpReward: 750, icon: '🔥', category: 'streaks' },
  { id: 'streak_90', name: 'Eternal Flame', description: 'Maintain a 90-day streak', xpReward: 2000, icon: '🔥', category: 'streaks' },

  // Mastery
  { id: 'master_life', name: 'Life Master', description: 'Complete all Life skills', xpReward: 500, icon: '🌿', category: 'mastery' },
  { id: 'master_career', name: 'Career Master', description: 'Complete all Career skills', xpReward: 500, icon: '💼', category: 'mastery' },
  { id: 'master_business', name: 'Business Master', description: 'Complete all Business skills', xpReward: 500, icon: '📊', category: 'mastery' },
  { id: 'master_onboarding', name: 'Onboarding Master', description: 'Complete all Onboarding skills', xpReward: 500, icon: '🎓', category: 'mastery' },
  { id: 'master_health', name: 'Health Master', description: 'Complete all Health skills', xpReward: 500, icon: '❤️', category: 'mastery' },
  { id: 'master_developer', name: 'Developer Master', description: 'Complete all Developer skills', xpReward: 500, icon: '💻', category: 'mastery' },

  // Evolution
  { id: 'evolve_silver', name: 'Silver Evolution', description: 'Evolve a skill to Silver tier', xpReward: 200, icon: '🥈', category: 'evolution' },
  { id: 'evolve_gold', name: 'Gold Evolution', description: 'Evolve a skill to Gold tier', xpReward: 400, icon: '🥇', category: 'evolution' },
  { id: 'evolve_platinum', name: 'Platinum Evolution', description: 'Evolve a skill to Platinum tier', xpReward: 800, icon: '💎', category: 'evolution' },
  { id: 'evolve_diamond', name: 'Diamond Evolution', description: 'Evolve a skill to Diamond tier', xpReward: 1500, icon: '💠', category: 'evolution' },

  // Special
  { id: 'night_owl', name: 'Night Owl', description: 'Run a skill between midnight and 5 AM', xpReward: 100, icon: '🦉', category: 'special' },
  { id: 'early_bird', name: 'Early Bird', description: 'Run a skill between 5 AM and 7 AM', xpReward: 100, icon: '🐦', category: 'special' },
  { id: 'speed_runner', name: 'Speed Runner', description: 'Complete a chain in under 60 seconds', xpReward: 250, icon: '⚡', category: 'special' },
  { id: 'polyglot', name: 'Polyglot', description: 'Run skills from 5 different categories', xpReward: 150, icon: '🌐', category: 'special' },
  { id: 'helping_hand', name: 'Helping Hand', description: 'Share a skill result with another user', xpReward: 100, icon: '🤝', category: 'special' },
];

// ── Level definitions ────────────────────────────────────────────────

export const LEVELS: LevelDef[] = [
  { level: 1,  title: 'Novice',       tier: 'Bronze',   xpRequired: 0 },
  { level: 5,  title: 'Apprentice',   tier: 'Bronze',   xpRequired: 500 },
  { level: 10, title: 'Practitioner', tier: 'Silver',   xpRequired: 2000 },
  { level: 20, title: 'Expert',       tier: 'Gold',     xpRequired: 8000 },
  { level: 30, title: 'Master',       tier: 'Platinum', xpRequired: 20000 },
  { level: 40, title: 'Grandmaster',  tier: 'Platinum', xpRequired: 40000 },
  { level: 50, title: 'Legend',       tier: 'Diamond',  xpRequired: 75000 },
];

// ── Evolution tier colors ────────────────────────────────────────────

export const EVOLUTION_TIERS: Record<string, string> = {
  Bronze:   '#cd7f32',
  Silver:   '#c0c0c0',
  Gold:     '#ffd700',
  Platinum: '#e5e4e2',
  Diamond:  '#b9f2ff',
};

// ── Category display colors ──────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  Life:      '#00ff88',
  Career:    '#00ffc8',
  Business:  '#ffd700',
  Onboarding:'#aa88ff',
  Health:    '#ff6b6b',
  Developer: '#00ffc8',
  Creative:  '#ff88cc',
  Money:     '#ffd700',
  Learning:  '#88aaff',
};

// ── Achievement category display names & colors ──────────────────────

export const ACHIEVEMENT_CATEGORY_META: Record<AchievementDef['category'], { label: string; color: string }> = {
  first_steps: { label: 'First Steps', color: '#00ffc8' },
  collection:  { label: 'Collection',  color: '#00ff88' },
  chains:      { label: 'Chains',      color: '#aa88ff' },
  streaks:     { label: 'Streaks',     color: '#ff8844' },
  mastery:     { label: 'Mastery',     color: '#ffd700' },
  evolution:   { label: 'Evolution',   color: '#b9f2ff' },
  special:     { label: 'Special',     color: '#ff88cc' },
};

// ── Mock trainer profile ─────────────────────────────────────────────

export const MOCK_TRAINER = {
  level: 12,
  title: 'Practitioner',
  xp: 3200,
  xp_next: 4000,
  xp_progress: 0.64,
  streak: 5,
  streak_best: 12,
  streak_multiplier: 1.1,
  skills_discovered: 18,
  skills_total: 95,
  chains_completed: 6,
  chains_total: 44,
  achievements_unlocked: 8,
  achievements_total: 30,
  total_skill_runs: 47,
  total_chain_runs: 6,
};

// ── Mock achievement statuses (8 unlocked) ───────────────────────────

export const MOCK_ACHIEVEMENT_STATUS: Record<string, { unlocked: boolean; unlockedAt?: string }> = {
  first_run:       { unlocked: true,  unlockedAt: '2026-03-10T09:14:00Z' },
  first_chain:     { unlocked: true,  unlockedAt: '2026-03-11T14:22:00Z' },
  first_category:  { unlocked: true,  unlockedAt: '2026-03-13T11:05:00Z' },
  collector_10:    { unlocked: true,  unlockedAt: '2026-03-18T16:30:00Z' },
  collector_25:    { unlocked: false },
  collector_50:    { unlocked: false },
  collector_95:    { unlocked: false },
  chain_5:         { unlocked: true,  unlockedAt: '2026-03-20T10:45:00Z' },
  chain_15:        { unlocked: false },
  chain_all:       { unlocked: false },
  streak_3:        { unlocked: true,  unlockedAt: '2026-03-12T08:00:00Z' },
  streak_7:        { unlocked: true,  unlockedAt: '2026-03-16T08:00:00Z' },
  streak_14:       { unlocked: false },
  streak_30:       { unlocked: false },
  streak_90:       { unlocked: false },
  master_life:     { unlocked: false },
  master_career:   { unlocked: false },
  master_business: { unlocked: false },
  master_onboarding: { unlocked: false },
  master_health:   { unlocked: false },
  master_developer: { unlocked: false },
  evolve_silver:   { unlocked: true,  unlockedAt: '2026-03-22T19:10:00Z' },
  evolve_gold:     { unlocked: false },
  evolve_platinum: { unlocked: false },
  evolve_diamond:  { unlocked: false },
  night_owl:       { unlocked: false },
  early_bird:      { unlocked: false },
  speed_runner:    { unlocked: false },
  polyglot:        { unlocked: false },
  helping_hand:    { unlocked: false },
};

// ── Mock Skilldex category progress ──────────────────────────────────

export const MOCK_SKILLDEX: { category: string; discovered: number; total: number }[] = [
  { category: 'Life',       discovered: 4,  total: 12 },
  { category: 'Career',     discovered: 3,  total: 14 },
  { category: 'Business',   discovered: 2,  total: 10 },
  { category: 'Onboarding', discovered: 3,  total: 8 },
  { category: 'Health',     discovered: 2,  total: 11 },
  { category: 'Developer',  discovered: 2,  total: 15 },
  { category: 'Creative',   discovered: 1,  total: 9 },
  { category: 'Money',      discovered: 0,  total: 8 },
  { category: 'Learning',   discovered: 1,  total: 8 },
];

// ── Mock evolution showcase ──────────────────────────────────────────

export const MOCK_EVOLVED_SKILLS: { name: string; tier: string; runs: number }[] = [
  { name: 'priority-matrix',    tier: 'Silver',  runs: 14 },
  { name: 'resume-optimizer',   tier: 'Silver',  runs: 11 },
  { name: 'budget-tracker',     tier: 'Bronze',  runs: 9 },
  { name: 'habit-builder',      tier: 'Bronze',  runs: 7 },
  { name: 'meeting-prep',       tier: 'Bronze',  runs: 6 },
];

// ── Mock daily quests ────────────────────────────────────────────────

export const MOCK_QUESTS: { id: string; label: string; xp: number; done: boolean }[] = [
  { id: 'q1', label: 'Run any skill',            xp: 25,  done: true },
  { id: 'q2', label: 'Complete a chain',          xp: 50,  done: false },
  { id: 'q3', label: 'Discover a new skill',      xp: 35,  done: false },
];
