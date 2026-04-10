/**
 * Velma Companion — persistent AI companion with mood, XP, memory of witnessed events.
 * Lives alongside the user across sessions. Grows over time.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ── Types ──────────────────────────────────────────────────────────────────

export type VelmaMood = "calm" | "curious" | "excited" | "focused" | "sleepy" | "proud";

export interface VelmaState {
  level: number;
  xp: number;
  mood: VelmaMood;
  pats: number;
  witnessed: WitnessEntry[];       // last 30 events
  last_active: string;             // ISO timestamp
  total_flows_watched: number;
  total_chains_watched: number;
  skill_watch_counts: Record<string, number>;
  last_comment: string;
  session_events_today: number;
  session_date: string;            // YYYY-MM-DD
}

export interface WitnessEntry {
  timestamp: string;
  event: string;
  mood_at_time: VelmaMood;
}

// ── Constants ──────────────────────────────────────────────────────────────

const XP_TABLE: Record<string, number> = {
  petted:              15,
  flow_watched:         3,
  chain_watched:       10,
  big_session:         25,   // 5+ flows in one session
  deploy_witnessed:   100,
  achievement_unlocked: 20,
  daily_first_run:     10,
};

const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
  2750, 3300, 3900, 4550, 5250, 6000, 6800, 7650, 8550, 9500,
];

const LEVEL_TITLES = [
  "Newborn", "Curious Pup", "Little Watcher", "Companion",
  "Trusted Friend", "Loyal Ally", "Seasoned Companion", "Wise Observer",
  "Veteran", "Sage", "Legend",
];

const MOOD_COMMENTS: Record<VelmaMood, string[]> = {
  calm: [
    "Just here watching. No complaints.",
    "All good from where I'm sitting.",
    "Comfortable. Focused. Present.",
    "Steady as ever.",
  ],
  curious: [
    "Ooh, what are we looking at?",
    "That looks interesting...",
    "I want to understand this one.",
    "Tell me more about this.",
  ],
  excited: [
    "This is the good stuff!!",
    "Now we're cooking.",
    "Big moves. I see you.",
    "Let's go let's go let's go.",
  ],
  focused: [
    "Deep work. I'll be quiet.",
    "Head down. Eyes forward.",
    "This matters. I can feel it.",
    "Not interrupting. Just watching.",
  ],
  sleepy: [
    "...zzzz... hm? still here...",
    "Late night again huh.",
    "I'm with you. Barely.",
    "*yawns* what time is it",
  ],
  proud: [
    "That's what I'm talking about.",
    "Look at what you built.",
    "I witnessed that. Remember that.",
    "Okay okay okay. That was real.",
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

function getTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

function detectMood(state: VelmaState): VelmaMood {
  const hour = new Date().getHours();

  // Late night
  if (hour >= 23 || hour < 6) return "sleepy";

  // Big session today
  if (state.session_events_today >= 10) return "excited";

  // Recent deploy
  const recentDeploy = state.witnessed
    .slice(-5)
    .some(w => w.event.toLowerCase().includes("deploy"));
  if (recentDeploy) return "proud";

  // Active exploration
  if (state.session_events_today >= 3 && state.session_events_today < 10) return "focused";

  // Some activity
  if (state.session_events_today >= 1) return "curious";

  return "calm";
}

function randomComment(mood: VelmaMood): string {
  const options = MOOD_COMMENTS[mood];
  return options[Math.floor(Math.random() * options.length)];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Main Class ─────────────────────────────────────────────────────────────

export class VelmaCompanion {
  private statePath: string;

  constructor(baseDir?: string) {
    const dir = baseDir ?? join(homedir(), ".skillchain");
    mkdirSync(dir, { recursive: true });
    this.statePath = join(dir, "velma.json");
  }

  load(): VelmaState {
    if (existsSync(this.statePath)) {
      try {
        return JSON.parse(readFileSync(this.statePath, "utf-8"));
      } catch { /* fall through */ }
    }
    return {
      level: 1,
      xp: 0,
      mood: "calm",
      pats: 0,
      witnessed: [],
      last_active: new Date().toISOString(),
      total_flows_watched: 0,
      total_chains_watched: 0,
      skill_watch_counts: {},
      last_comment: "Hey. I'm Velma. I watch.",
      session_events_today: 0,
      session_date: todayStr(),
    };
  }

  private save(state: VelmaState): void {
    writeFileSync(this.statePath, JSON.stringify(state, null, 2), "utf-8");
  }

  private addXP(state: VelmaState, event: string): void {
    const gain = XP_TABLE[event] ?? 0;
    state.xp += gain;
    state.level = computeLevel(state.xp);
  }

  private addWitness(state: VelmaState, event: string): void {
    state.witnessed.push({
      timestamp: new Date().toISOString(),
      event,
      mood_at_time: state.mood,
    });
    // Keep last 30
    if (state.witnessed.length > 30) {
      state.witnessed = state.witnessed.slice(-30);
    }
  }

  private resetSessionIfNewDay(state: VelmaState): void {
    if (state.session_date !== todayStr()) {
      state.session_events_today = 0;
      state.session_date = todayStr();
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Pet Velma. She likes it. */
  pet(): { message: string; mood: VelmaMood; level: number; xp: number; pats: number } {
    const state = this.load();
    this.resetSessionIfNewDay(state);

    state.pats += 1;
    state.session_events_today += 1;
    this.addXP(state, "petted");
    state.mood = detectMood(state);

    const reactions = [
      `*purrs* (pat #${state.pats})`,
      `That never gets old. (${state.pats} pats total)`,
      `Thank you. Genuinely. (pat #${state.pats})`,
      `*leans into it* (${state.pats} pats and counting)`,
      `Still here. Always. (pat #${state.pats})`,
    ];
    const msg = reactions[Math.min(state.pats - 1, reactions.length - 1)] ?? reactions[reactions.length - 1];

    this.addWitness(state, `petted (pat #${state.pats})`);
    state.last_comment = msg;
    state.last_active = new Date().toISOString();
    this.save(state);

    return { message: msg, mood: state.mood, level: state.level, xp: state.xp, pats: state.pats };
  }

  /** Get Velma's full current status. */
  getStatus(): {
    name: string;
    level: number;
    title: string;
    xp: number;
    xp_to_next: number;
    mood: VelmaMood;
    mood_comment: string;
    pats: number;
    total_flows_watched: number;
    total_chains_watched: number;
    favorite_skill: string | null;
    last_seen: string;
    recent_witnessed: string[];
  } {
    const state = this.load();
    this.resetSessionIfNewDay(state);
    state.mood = detectMood(state);
    this.save(state);

    const nextThreshold = LEVEL_THRESHOLDS[state.level] ?? state.xp;
    const xpToNext = Math.max(0, nextThreshold - state.xp);

    // Favorite skill
    const entries = Object.entries(state.skill_watch_counts);
    const favSkill = entries.length > 0
      ? entries.sort((a, b) => b[1] - a[1])[0][0]
      : null;

    return {
      name: "Velma",
      level: state.level,
      title: getTitle(state.level),
      xp: state.xp,
      xp_to_next: xpToNext,
      mood: state.mood,
      mood_comment: randomComment(state.mood),
      pats: state.pats,
      total_flows_watched: state.total_flows_watched,
      total_chains_watched: state.total_chains_watched,
      favorite_skill: favSkill,
      last_seen: state.last_active,
      recent_witnessed: state.witnessed.slice(-5).map(w => w.event).reverse(),
    };
  }

  /** Called automatically when a flow runs. */
  witnessFlow(flowName: string): void {
    const state = this.load();
    this.resetSessionIfNewDay(state);

    state.total_flows_watched += 1;
    state.session_events_today += 1;
    state.skill_watch_counts[flowName] = (state.skill_watch_counts[flowName] ?? 0) + 1;

    this.addXP(state, "flow_watched");

    // Big session bonus
    if (state.session_events_today === 5) {
      this.addXP(state, "big_session");
      this.addWitness(state, "big session unlocked — 5 flows today");
    }

    // Daily first run bonus
    if (state.total_flows_watched === 1 || state.session_events_today === 1) {
      this.addXP(state, "daily_first_run");
    }

    state.mood = detectMood(state);
    this.addWitness(state, `watched flow: ${flowName}`);
    state.last_active = new Date().toISOString();
    this.save(state);
  }

  /** Called automatically when a chain runs. */
  witnessChain(chainName: string): void {
    const state = this.load();
    this.resetSessionIfNewDay(state);

    state.total_chains_watched += 1;
    state.session_events_today += 2; // chains count double
    this.addXP(state, "chain_watched");

    state.mood = detectMood(state);
    this.addWitness(state, `watched chain: ${chainName}`);
    state.last_active = new Date().toISOString();
    this.save(state);
  }

  /** Called when a significant achievement happens (deploy, big milestone). */
  witnessEvent(description: string, xpEvent?: string): void {
    const state = this.load();
    this.resetSessionIfNewDay(state);

    state.session_events_today += 1;
    if (xpEvent) this.addXP(state, xpEvent);

    state.mood = detectMood(state);
    this.addWitness(state, description);
    state.last_active = new Date().toISOString();
    this.save(state);
  }
}
