/**
 * Velma Recommender — "what now?" intelligent recommendations.
 * Port of sdk/velma_recommender.py
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GamificationEngine, SKILL_CATEGORIES } from "./gamification.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface VelmaRecommendation {
  chain_name: string;
  reason: string;
  priority: number;
  category: string;
  nudge: string;
}

const DAY_CHAINS: Record<number, [string, string]> = {
  0: ["weekly-review", "Sunday is for reflecting. Let's review your week."],
  1: ["weekly-ops", "Monday energy. Let's plan the week."],
  2: ["learn-anything", "Tuesday is learning day. Pick something new."],
  3: ["content-machine", "Midweek momentum. Create something."],
  4: ["networking-blitz", "Thursday is for people. Expand your network."],
  5: ["side-hustle-launch", "Friday build day. Ship something."],
  6: ["am-i-okay", "Saturday check-in. How are you really doing?"],
};

const TIME_CHAINS: Array<[number, number, string, string]> = [
  [5, 9, "morning-routine", "Early bird gets the worm. Let's start your day right."],
  [9, 12, "weekly-ops", "Prime focus hours. Let's get things done."],
  [12, 14, "learn-anything", "Lunch break learning. Feed your brain."],
  [14, 17, "content-machine", "Afternoon creative block. Make something."],
  [17, 20, "budget-builder", "Evening admin. Get your money right."],
  [20, 23, "daily-reflection", "Wind down. Reflect on today."],
];

const CATEGORY_NUDGES: Record<string, [string, string]> = {
  Life: ["am-i-okay", "You haven't explored Life skills yet. Start with a check-in."],
  Career: ["career-pivot", "Career skills untouched. Let's figure out your next move."],
  Business: ["side-hustle-launch", "Business skills waiting. Ready to build something?"],
  Health: ["burnout-recovery", "Health matters. Let's check in on you."],
  Developer: ["debug-and-fix", "Dev skills ready. Let's sharpen your code."],
  Finance: ["budget-builder", "Finance skills available. Get your money right."],
  Creative: ["content-machine", "Creative skills unlocked. Time to create."],
  Education: ["learn-anything", "Learning skills ready. What do you want to master?"],
};

const NEW_USER_SEQUENCE: Array<[string, string]> = [
  ["am-i-okay", "Welcome to SkillChain. Let's start with a check-in."],
  ["learn-anything", "Day 2. Let's learn something new together."],
  ["budget-builder", "Day 3. Let's look at your finances."],
  ["career-pivot", "Day 4. Let's think about your career."],
  ["side-hustle-launch", "Day 5. Ready to build something?"],
  ["weekly-ops", "Day 6. Let's plan your week."],
  ["content-machine", "Week 2. Time to create."],
  ["tech-confidence-builder", "Scared of AI? Let's fix that."],
  ["debug-and-fix", "Let's solve a real problem."],
  ["networking-blitz", "Time to connect with people."],
  ["big-decision", "Got a big choice? Let's think it through."],
  ["burnout-recovery", "Halfway through. Let's check your energy."],
  ["competitive-intel", "Know your landscape."],
  ["before-you-leap", "Almost two weeks in. What's your big move?"],
];

export class VelmaRecommender {
  private engine: GamificationEngine;
  private chainsDir: string;

  constructor(marketplaceDir?: string) {
    this.engine = new GamificationEngine();
    this.chainsDir = marketplaceDir
      ? join(marketplaceDir, "chains")
      : join(__dirname, "..", "..", "marketplace", "chains");
  }

  private loadChains(): Array<Record<string, unknown>> {
    if (!existsSync(this.chainsDir)) return [];
    return readdirSync(this.chainsDir)
      .filter(f => f.endsWith(".chain.json"))
      .map(f => {
        try { return JSON.parse(readFileSync(join(this.chainsDir, f), "utf-8")); }
        catch { return null; }
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  whatNow(): VelmaRecommendation[] {
    const recs: VelmaRecommendation[] = [];
    const state = this.engine.getState();

    // 1. New user sequence (first 14 days)
    const totalRuns = state.total_skill_runs + state.total_chain_runs;
    if (totalRuns < NEW_USER_SEQUENCE.length) {
      const [chain, nudge] = NEW_USER_SEQUENCE[totalRuns];
      recs.push({
        chain_name: chain,
        reason: "new_user_progression",
        priority: 1,
        category: "onboarding",
        nudge,
      });
    }

    // 2. Streak maintenance
    const today = new Date().toISOString().slice(0, 10);
    if (state.streak_current > 0 && state.streak_last_date !== today) {
      recs.push({
        chain_name: "learn-anything",
        reason: `Don't break your ${state.streak_current}-day streak!`,
        priority: 1,
        category: "streak",
        nudge: `${state.streak_current}-day streak on the line. Run any skill to keep it alive.`,
      });
    }

    // 3. Time-of-day recommendation
    const hour = new Date().getHours();
    for (const [start, end, chain, nudge] of TIME_CHAINS) {
      if (hour >= start && hour < end) {
        recs.push({ chain_name: chain, reason: "time_of_day", priority: 3, category: "timing", nudge });
        break;
      }
    }

    // 4. Day-of-week recommendation
    const day = new Date().getDay();
    const dayRec = DAY_CHAINS[day];
    if (dayRec) {
      recs.push({ chain_name: dayRec[0], reason: "day_of_week", priority: 3, category: "timing", nudge: dayRec[1] });
    }

    // 5. Category gaps
    const discoveredCats = new Set(
      state.skills_discovered.map(sk => {
        for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
          if (skills.includes(sk)) return cat;
        }
        return null;
      }).filter(Boolean)
    );
    for (const [cat, [chain, nudge]] of Object.entries(CATEGORY_NUDGES)) {
      if (!discoveredCats.has(cat)) {
        recs.push({ chain_name: chain, reason: "category_gap", priority: 2, category: cat, nudge });
      }
    }

    // 6. Daily quest nudge
    if (state.daily_runs_date !== today || state.daily_runs_today.length === 0) {
      recs.push({
        chain_name: "learn-anything",
        reason: "daily_quests",
        priority: 2,
        category: "quests",
        nudge: "You have daily quests waiting. Run a skill to start earning bonus XP.",
      });
    }

    // Sort by priority, deduplicate by chain_name
    const seen = new Set<string>();
    return recs
      .sort((a, b) => a.priority - b.priority)
      .filter(r => {
        if (seen.has(r.chain_name)) return false;
        seen.add(r.chain_name);
        return true;
      })
      .slice(0, 5);
  }
}
