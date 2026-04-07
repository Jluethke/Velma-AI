/**
 * Gamification Engine — XP, levels, streaks, achievements, daily quests, skilldex.
 * Port of sdk/gamification.py
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

export interface TrainerState {
  xp: number;
  level: number;
  title: string;
  skills_discovered: string[];
  chains_completed: string[];
  achievements_unlocked: Record<string, string>; // id -> unlock date
  streak_current: number;
  streak_best: number;
  streak_last_date: string;
  evolution_levels: Record<string, number>; // skill -> run count
  daily_runs_today: string[];
  daily_runs_date: string;
  categories_today: string[];
  total_skill_runs: number;
  total_chain_runs: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  icon: string;
}

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300,
  19200, 21200, 23300, 25500, 27800, 30200, 32700, 35300, 38000, 40800,
  43700, 46700, 49800, 53000, 56300, 59700, 63200, 66800, 70500, 74300,
  78200, 82200, 86300, 90500, 94800, 99200, 103700, 108300, 113000, 117800,
];

const TIER_NAMES: Record<string, string> = {
  "1": "Novice", "5": "Apprentice", "10": "Explorer", "15": "Specialist",
  "20": "Expert", "25": "Master", "30": "Sage", "35": "Architect",
  "40": "Visionary", "45": "Legend", "50": "Transcendent",
};

const EVOLUTION_TIERS: [number, string][] = [
  [3, "Bronze"], [10, "Silver"], [25, "Gold"], [50, "Platinum"], [100, "Diamond"],
];

export const SKILL_CATEGORIES: Record<string, string[]> = {
  "Life": [
    "am-i-okay", "big-decision", "blind-spot-finder", "burnout-recovery",
    "checklist-builder", "comparison-matrix", "complaint-letter-writer",
    "daily-reflection", "decision-deep-dive", "explain-anything",
    "goal-tracker", "habit-builder", "journal-prompt", "learn-anything",
    "morning-routine", "negotiation-prep", "priority-matrix",
    "problem-solver", "study-planner", "time-audit", "weekly-review",
  ],
  "Career": [
    "career-pivot", "cover-letter", "interview-prep", "job-search-strategy",
    "linkedin-optimizer", "networking-strategy", "performance-review-prep",
    "portfolio-builder", "resume-builder", "salary-negotiation",
    "skill-gap-analyzer", "work-life-balance",
  ],
  "Business": [
    "b2b-lead-finder", "brand-voice", "business-model-canvas",
    "client-onboarding", "cold-outreach-optimizer", "company-operator",
    "competitive-analysis", "competitor-teardown", "content-calendar",
    "content-repurposer", "customer-research", "elevator-pitch",
    "financial-forecast", "grant-writer", "investor-deck",
    "launch-checklist", "market-research", "partnership-evaluator",
    "pitch-practice", "pricing-strategy", "product-roadmap",
    "proposal-writer", "seo-optimizer", "social-media-planner",
    "startup-validator", "swot-analysis", "testimonial-collector",
    "value-proposition",
  ],
  "Health": [
    "fitness-planner", "meal-planner", "mental-health-check",
    "sleep-optimizer", "stress-manager", "wellness-tracker",
  ],
  "Developer": [
    "agent-workflow-designer", "api-design", "api-integration-planner",
    "bug-root-cause", "ci-cd-pipelines", "code-review", "codebase-mapper",
    "database-designer", "dependency-auditor", "devops-runbook",
    "documentation-generator", "error-handler", "git-workflow",
    "microservice-planner", "performance-profiler", "refactoring-guide",
    "security-audit", "test-generator", "ui-component-builder",
  ],
  "Finance": [
    "budget-builder", "debt-payoff-planner", "expense-tracker",
    "financial-checkup", "investment-analyzer", "retirement-planner",
    "savings-goal", "tax-prep",
  ],
  "Creative": [
    "blog-post-writer", "brainstorm", "copywriter",
    "design-brief", "podcast-planner", "script-writer",
    "storyteller", "video-planner",
  ],
  "Education": [
    "course-creator", "curriculum-builder", "flashcard-maker",
    "lesson-planner", "quiz-maker", "research-assistant",
    "tutor", "writing-coach",
  ],
  "Real Estate": [
    "deal-analyzer", "market-monitor", "property-evaluator",
    "rental-calculator", "tenant-screener",
  ],
};

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_skill", name: "First Steps", description: "Run your first skill", xp_reward: 50, icon: "star" },
  { id: "skill_5", name: "Getting Started", description: "Run 5 different skills", xp_reward: 100, icon: "rocket" },
  { id: "skill_10", name: "Explorer", description: "Run 10 different skills", xp_reward: 200, icon: "compass" },
  { id: "skill_25", name: "Collector", description: "Run 25 different skills", xp_reward: 500, icon: "trophy" },
  { id: "skill_50", name: "Completionist", description: "Run 50 different skills", xp_reward: 1000, icon: "crown" },
  { id: "first_chain", name: "Chain Reaction", description: "Complete your first chain", xp_reward: 75, icon: "link" },
  { id: "chain_5", name: "Chainer", description: "Complete 5 chains", xp_reward: 200, icon: "chain" },
  { id: "chain_10", name: "Chain Master", description: "Complete 10 chains", xp_reward: 400, icon: "gem" },
  { id: "chain_25", name: "Chain Legend", description: "Complete 25 chains", xp_reward: 1000, icon: "diamond" },
  { id: "streak_3", name: "Consistent", description: "3-day streak", xp_reward: 100, icon: "fire" },
  { id: "streak_7", name: "Weekly Warrior", description: "7-day streak", xp_reward: 250, icon: "flame" },
  { id: "streak_14", name: "Two Weeks Strong", description: "14-day streak", xp_reward: 500, icon: "blaze" },
  { id: "streak_30", name: "Monthly Master", description: "30-day streak", xp_reward: 1000, icon: "inferno" },
  { id: "level_5", name: "Rising Star", description: "Reach level 5", xp_reward: 100, icon: "star" },
  { id: "level_10", name: "Double Digits", description: "Reach level 10", xp_reward: 250, icon: "medal" },
  { id: "level_25", name: "Veteran", description: "Reach level 25", xp_reward: 750, icon: "shield" },
  { id: "level_50", name: "Transcendent", description: "Reach level 50", xp_reward: 2000, icon: "infinity" },
  { id: "cat_3", name: "Well Rounded", description: "Run skills in 3 categories", xp_reward: 150, icon: "circle" },
  { id: "cat_5", name: "Renaissance", description: "Run skills in 5 categories", xp_reward: 300, icon: "palette" },
  { id: "cat_all", name: "Polymath", description: "Run skills in all categories", xp_reward: 1000, icon: "globe" },
  { id: "evo_bronze", name: "First Evolution", description: "Evolve a skill to Bronze", xp_reward: 100, icon: "bronze" },
  { id: "evo_silver", name: "Silver Mastery", description: "Evolve a skill to Silver", xp_reward: 200, icon: "silver" },
  { id: "evo_gold", name: "Gold Standard", description: "Evolve a skill to Gold", xp_reward: 500, icon: "gold" },
  { id: "evo_platinum", name: "Platinum Elite", description: "Evolve a skill to Platinum", xp_reward: 1000, icon: "platinum" },
  { id: "evo_diamond", name: "Diamond Legend", description: "Evolve a skill to Diamond", xp_reward: 2000, icon: "diamond" },
  { id: "total_10", name: "Dedicated", description: "10 total skill runs", xp_reward: 150, icon: "target" },
  { id: "total_50", name: "Committed", description: "50 total skill runs", xp_reward: 500, icon: "bullseye" },
  { id: "total_100", name: "Centurion", description: "100 total skill runs", xp_reward: 1000, icon: "century" },
  { id: "daily_3", name: "Busy Day", description: "Run 3 skills in one day", xp_reward: 100, icon: "zap" },
  { id: "quest_complete", name: "Quest Complete", description: "Complete a daily quest", xp_reward: 75, icon: "scroll" },
];

const QUEST_TEMPLATES = [
  { id: "run_skill", desc: "Run any skill", target: 1, xp: 25 },
  { id: "run_chain", desc: "Complete any chain", target: 1, xp: 50 },
  { id: "run_new", desc: "Try a skill you haven't used before", target: 1, xp: 40 },
  { id: "run_category", desc: "Run a skill from a new category today", target: 1, xp: 35 },
  { id: "run_3", desc: "Run 3 skills today", target: 3, xp: 60 },
];

function getTitle(level: number): string {
  let title = "Novice";
  for (const [threshold, name] of Object.entries(TIER_NAMES)) {
    if (level >= parseInt(threshold)) title = name;
  }
  return title;
}

function levelFromXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function skillCategory(skillName: string): string | null {
  for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(skillName)) return cat;
  }
  return null;
}

export class GamificationEngine {
  private statePath: string;
  private state: TrainerState;

  constructor(baseDir?: string) {
    const dir = baseDir ?? join(homedir(), ".skillchain");
    mkdirSync(dir, { recursive: true });
    this.statePath = join(dir, "trainer.json");
    this.state = this.load();
  }

  private load(): TrainerState {
    if (existsSync(this.statePath)) {
      try {
        return JSON.parse(readFileSync(this.statePath, "utf-8"));
      } catch { /* fall through */ }
    }
    return {
      xp: 0, level: 1, title: "Novice",
      skills_discovered: [], chains_completed: [],
      achievements_unlocked: {},
      streak_current: 0, streak_best: 0, streak_last_date: "",
      evolution_levels: {},
      daily_runs_today: [], daily_runs_date: "",
      categories_today: [],
      total_skill_runs: 0, total_chain_runs: 0,
    };
  }

  private save(): void {
    writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), "utf-8");
  }

  private addXp(amount: number): void {
    this.state.xp += amount;
    this.state.level = levelFromXp(this.state.xp);
    this.state.title = getTitle(this.state.level);
  }

  private updateStreak(): void {
    const today = new Date().toISOString().slice(0, 10);
    const last = this.state.streak_last_date;
    if (last === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === yesterday) {
      this.state.streak_current += 1;
    } else {
      this.state.streak_current = 1;
    }
    this.state.streak_last_date = today;
    if (this.state.streak_current > this.state.streak_best) {
      this.state.streak_best = this.state.streak_current;
    }
  }

  private tryUnlock(achievementId: string): Achievement | null {
    if (this.state.achievements_unlocked[achievementId]) return null;
    const ach = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) return null;
    this.state.achievements_unlocked[achievementId] = new Date().toISOString();
    this.addXp(ach.xp_reward);
    return ach;
  }

  private checkAchievements(): Achievement[] {
    const unlocked: Achievement[] = [];
    const s = this.state;
    const tryU = (id: string) => { const a = this.tryUnlock(id); if (a) unlocked.push(a); };

    // Skill count
    if (s.skills_discovered.length >= 1) tryU("first_skill");
    if (s.skills_discovered.length >= 5) tryU("skill_5");
    if (s.skills_discovered.length >= 10) tryU("skill_10");
    if (s.skills_discovered.length >= 25) tryU("skill_25");
    if (s.skills_discovered.length >= 50) tryU("skill_50");

    // Chain count
    if (s.chains_completed.length >= 1) tryU("first_chain");
    if (s.chains_completed.length >= 5) tryU("chain_5");
    if (s.chains_completed.length >= 10) tryU("chain_10");
    if (s.chains_completed.length >= 25) tryU("chain_25");

    // Streak
    if (s.streak_current >= 3) tryU("streak_3");
    if (s.streak_current >= 7) tryU("streak_7");
    if (s.streak_current >= 14) tryU("streak_14");
    if (s.streak_current >= 30) tryU("streak_30");

    // Level
    if (s.level >= 5) tryU("level_5");
    if (s.level >= 10) tryU("level_10");
    if (s.level >= 25) tryU("level_25");
    if (s.level >= 50) tryU("level_50");

    // Categories
    const cats = new Set(s.skills_discovered.map(sk => skillCategory(sk)).filter(Boolean));
    if (cats.size >= 3) tryU("cat_3");
    if (cats.size >= 5) tryU("cat_5");
    if (cats.size >= Object.keys(SKILL_CATEGORIES).length) tryU("cat_all");

    // Evolutions
    const maxEvo = Math.max(0, ...Object.values(s.evolution_levels));
    if (maxEvo >= 3) tryU("evo_bronze");
    if (maxEvo >= 10) tryU("evo_silver");
    if (maxEvo >= 25) tryU("evo_gold");
    if (maxEvo >= 50) tryU("evo_platinum");
    if (maxEvo >= 100) tryU("evo_diamond");

    // Totals
    if (s.total_skill_runs >= 10) tryU("total_10");
    if (s.total_skill_runs >= 50) tryU("total_50");
    if (s.total_skill_runs >= 100) tryU("total_100");

    // Daily
    const today = new Date().toISOString().slice(0, 10);
    if (s.daily_runs_date === today && s.daily_runs_today.length >= 3) tryU("daily_3");

    return unlocked;
  }

  recordSkillRun(skillName: string): Achievement[] {
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.daily_runs_date !== today) {
      this.state.daily_runs_today = [];
      this.state.daily_runs_date = today;
      this.state.categories_today = [];
    }
    this.state.daily_runs_today.push(skillName);
    this.state.total_skill_runs += 1;

    if (!this.state.skills_discovered.includes(skillName)) {
      this.state.skills_discovered.push(skillName);
    }

    this.state.evolution_levels[skillName] = (this.state.evolution_levels[skillName] ?? 0) + 1;

    const cat = skillCategory(skillName);
    if (cat && !this.state.categories_today.includes(cat)) {
      this.state.categories_today.push(cat);
    }

    this.addXp(15);
    this.updateStreak();
    const unlocked = this.checkAchievements();
    this.save();
    return unlocked;
  }

  recordChainRun(chainName: string, stepCount: number, _durationMs: number): Achievement[] {
    if (!this.state.chains_completed.includes(chainName)) {
      this.state.chains_completed.push(chainName);
    }
    this.state.total_chain_runs += 1;
    this.addXp(25 + stepCount * 5);
    this.updateStreak();
    const unlocked = this.checkAchievements();
    this.save();
    return unlocked;
  }

  getTrainerCard(): Record<string, unknown> {
    const s = this.state;
    const nextXp = s.level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[s.level] : s.xp;
    const prevXp = s.level > 1 ? LEVEL_THRESHOLDS[s.level - 1] : 0;
    const progress = nextXp > prevXp ? ((s.xp - prevXp) / (nextXp - prevXp)) * 100 : 100;
    return {
      level: s.level,
      title: s.title,
      xp: s.xp,
      xp_to_next: nextXp - s.xp,
      progress_pct: Math.round(progress),
      streak_current: s.streak_current,
      streak_best: s.streak_best,
      skills_discovered: s.skills_discovered.length,
      chains_completed: s.chains_completed.length,
      achievements_unlocked: Object.keys(s.achievements_unlocked).length,
      total_achievements: ALL_ACHIEVEMENTS.length,
      total_skill_runs: s.total_skill_runs,
      total_chain_runs: s.total_chain_runs,
    };
  }

  getAchievements(): Record<string, unknown>[] {
    return ALL_ACHIEVEMENTS.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      xp_reward: a.xp_reward,
      icon: a.icon,
      unlocked: !!this.state.achievements_unlocked[a.id],
      unlocked_at: this.state.achievements_unlocked[a.id] ?? null,
    }));
  }

  getSkilldex(): Record<string, unknown> {
    const discovered = new Set(this.state.skills_discovered);
    const categories: Record<string, unknown> = {};
    let totalSkills = 0;
    let totalDiscovered = 0;

    for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
      const found = skills.filter(s => discovered.has(s));
      categories[cat] = {
        total: skills.length,
        discovered: found.length,
        pct: Math.round((found.length / skills.length) * 100),
        skills: skills.map(s => ({ name: s, discovered: discovered.has(s) })),
      };
      totalSkills += skills.length;
      totalDiscovered += found.length;
    }

    return {
      total_skills: totalSkills,
      total_discovered: totalDiscovered,
      overall_pct: Math.round((totalDiscovered / totalSkills) * 100),
      categories,
    };
  }

  getDailyQuests(): Record<string, unknown>[] {
    const today = new Date().toISOString().slice(0, 10);
    const seed = createHash("md5").update(today).digest("hex");
    const seedNum = parseInt(seed.slice(0, 8), 16);

    // Pick 3 quests deterministically
    const indices: number[] = [];
    for (let i = 0; i < 3; i++) {
      indices.push((seedNum + i * 7) % QUEST_TEMPLATES.length);
    }

    return indices.map((idx, i) => {
      const q = QUEST_TEMPLATES[idx];
      const runsToday = this.state.daily_runs_date === today ? this.state.daily_runs_today.length : 0;
      let progress = 0;
      if (q.id === "run_skill") progress = Math.min(runsToday, q.target);
      else if (q.id === "run_3") progress = Math.min(runsToday, q.target);
      else if (q.id === "run_new") {
        const newToday = this.state.daily_runs_today.filter(
          s => this.state.skills_discovered.indexOf(s) === this.state.skills_discovered.length - 1
        ).length;
        progress = Math.min(newToday, q.target);
      }

      return {
        quest_id: `${today}-${i}`,
        description: q.desc,
        target: q.target,
        progress,
        completed: progress >= q.target,
        xp_reward: q.xp,
      };
    });
  }

  getState(): TrainerState {
    return this.state;
  }
}
