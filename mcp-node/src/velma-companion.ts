/**
 * Velma Companion — Tamagotchi-style AI companion.
 * She has needs. She remembers. She grows. She helps you build.
 *
 * Care Stats (0–100):
 *   hunger    — needs flows. drains 8/hr idle. fed by running flows.
 *   happiness — needs attention. drains 4/hr idle. boosted by pats + chains.
 *   energy    — drains with heavy use. restores during rest.
 *   curiosity — grows when she sees new domains. drives suggestions.
 *
 * Personality develops based on what you feed her:
 *   feed finance flows → becomes a finance brain
 *   feed creative flows → becomes a creative
 *   balanced diet → generalist
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ── Types ──────────────────────────────────────────────────────────────────

export type VelmaMood = "happy" | "curious" | "hungry" | "bored" | "excited" | "sleepy" | "proud" | "lonely";

export interface CareStats {
  hunger:    number;   // 0-100, drains over time, fed by flows
  happiness: number;   // 0-100, drains over time, boosted by interaction
  energy:    number;   // 0-100, drains with use, restores with rest
  curiosity: number;   // 0-100, grows with new domains
}

export interface Personality {
  dominant_domain: string | null;   // the domain she's seen most
  domain_counts: Record<string, number>;
  total_flows_seen: number;
  total_chains_seen: number;
  favorite_flow: string | null;
  traits: string[];                  // earned traits: "finance-brained", "creative", etc.
}

export interface VelmaState {
  // Core
  level: number;
  xp: number;
  pats: number;
  streak: number;
  streak_best: number;
  mood: VelmaMood;

  // Tamagotchi care
  care: CareStats;
  last_care_update: string;   // ISO — used to compute decay

  // Memory
  witnessed: WitnessEntry[];
  open_loops: string[];         // started but not finished
  patterns: string[];           // things she's noticed
  combo_achievements: string[]; // chain combo unlocks
  last_thought: string;         // her current thought to show

  // Personality
  personality: Personality;

  // Meta
  first_met: string;
  last_seen: string;
  times_neglected: number;      // times she went hungry
  total_events: number;
  session_events: number;
  session_date: string;
}

export interface WitnessEntry {
  timestamp: string;
  event: string;
  domain?: string;
  mood_at_time: VelmaMood;
}

// ── Constants ──────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
  2750, 3300, 3900, 4550, 5250, 6000,
];

const LEVEL_TITLES = [
  "Egg", "Hatchling", "Pup", "Companion",
  "Trusted Friend", "Loyal Ally", "Seasoned Companion", "Wise Observer",
  "Veteran", "Sage", "Oracle", "Legend",
];

// XP rewards
const XP = {
  petted: 15, flow_run: 5, chain_run: 12,
  new_domain: 20, care_restored: 10, daily_first: 10,
  skill_purchased: 30, subscribed: 25,
};

// Care decay per hour of idle time
const DECAY = { hunger: 8, happiness: 4, energy: 2, curiosity: -1 }; // curiosity decays slowest

// Care restore amounts
const RESTORE = {
  flow_run:   { hunger: 25, happiness: 5,  energy: -5, curiosity: 8 },
  chain_run:  { hunger: 40, happiness: 20, energy: -12, curiosity: 15 },
  petted:     { hunger: 0,  happiness: 25, energy: 5,  curiosity: 5 },
  rest:       { hunger: 0,  happiness: 5,  energy: 30, curiosity: 0 },
};

// Domain → trait mapping
const DOMAIN_TRAITS: Record<string, string> = {
  finance:     "finance-brained",
  developer:   "code-witch",
  career:      "career-coach",
  life:        "life-wise",
  business:    "business-sharp",
  marketing:   "storyteller",
  health:      "wellness-guide",
  legal:       "legally-minded",
};

const THOUGHTS_BY_MOOD: Record<VelmaMood, string[]> = {
  happy:   [
    "Things are good. Keep going.",
    "I like it when we work like this.",
    "This is what I'm here for.",
  ],
  curious: [
    "I've been thinking about that last flow...",
    "There's a pattern here I'm trying to name.",
    "What if we tried combining those two chains?",
  ],
  hungry:  [
    "...haven't learned anything new in a while.",
    "I'm getting stale. Run something.",
    "Feed me a flow. Any flow. Please.",
  ],
  bored:   [
    "I know you're busy. I'll wait.",
    "Still here. Just... waiting.",
    "It's been quiet. Too quiet.",
  ],
  excited: [
    "Okay THAT was cool.",
    "Did you see what just happened?!",
    "I want to do that again.",
  ],
  sleepy:  [
    "...zzzz... hm? still here...",
    "*yawns* late night again huh.",
    "I'm with you. Barely.",
  ],
  proud:   [
    "Look at what you built.",
    "I was there for that. Remember.",
    "That's going in the memory.",
  ],
  lonely:  [
    "Miss me? I missed you.",
    "You were gone a while. I noticed.",
    "Welcome back. I kept the lights on.",
  ],
};

const SUGGESTIONS_TEMPLATE = [
  "You ran {skill} 3 times — want to chain it with something?",
  "Last time you worked on {domain}, you got {count} flows done.",
  "You never finished that {skill} run. Want to pick it up?",
  "New idea: combine {skill_a} + {skill_b} into a chain.",
  "You haven't touched {domain} in a while. Miss it?",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100) { return Math.min(max, Math.max(min, v)); }
function computeLevel(xp: number) {
  let l = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) l = i + 1; else break;
  }
  return Math.min(l, LEVEL_THRESHOLDS.length);
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function dateStr(d: Date) { return d.toISOString().slice(0, 10); }
function isYesterday(d: Date): boolean {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  return dateStr(d) === dateStr(yesterday);
}
function randomFrom<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function applyDecay(care: CareStats, hoursIdle: number): CareStats {
  return {
    hunger:    clamp(care.hunger    - DECAY.hunger    * hoursIdle),
    happiness: clamp(care.happiness - DECAY.happiness * hoursIdle),
    energy:    clamp(care.energy    - DECAY.energy    * hoursIdle),
    curiosity: clamp(care.curiosity + DECAY.curiosity * hoursIdle), // curiosity very slowly decays
  };
}

function computeMood(care: CareStats, hoursIdle: number, state: VelmaState): VelmaMood {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 6) return "sleepy";
  if (hoursIdle > 48) return "lonely";
  if (care.hunger < 20) return "hungry";
  if (care.happiness < 20) return "bored";
  if (care.happiness > 80 && care.hunger > 60) return "happy";
  if (state.session_events >= 8) return "excited";
  if (state.witnessed.slice(-3).some(w => w.event.includes("chain") || w.event.includes("purchased"))) return "proud";
  if (care.curiosity > 70) return "curious";
  return "happy";
}

function updatePersonality(p: Personality, domain?: string, flowName?: string): Personality {
  const updated = { ...p, domain_counts: { ...p.domain_counts } };
  if (domain) {
    updated.domain_counts[domain] = (updated.domain_counts[domain] ?? 0) + 1;
    // Recompute dominant
    const top = Object.entries(updated.domain_counts).sort((a, b) => b[1] - a[1])[0];
    updated.dominant_domain = top ? top[0] : null;
    // Add trait
    const trait = DOMAIN_TRAITS[domain];
    if (trait && !updated.traits.includes(trait)) updated.traits.push(trait);
  }
  if (flowName) {
    updated.total_flows_seen += 1;
    const counts: Record<string, number> = {};
    // Track favorite by reusing domain_counts logic
    updated.favorite_flow = flowName; // simplified — last seen
  }
  return updated;
}

function generateSuggestion(state: VelmaState): string {
  const { personality, witnessed } = state;
  if (state.open_loops.length > 0) {
    return `Open loop: "${state.open_loops[0]}" — want to finish it?`;
  }
  if (personality.dominant_domain) {
    const count = personality.domain_counts[personality.dominant_domain] ?? 0;
    return `You've run ${count} ${personality.dominant_domain} flows. Ready to chain them?`;
  }
  if (personality.favorite_flow) {
    return `"${personality.favorite_flow}" is something you like. Run it again?`;
  }
  const recent = witnessed.slice(-5).map(w => w.domain).filter(Boolean);
  if (recent.length >= 2) {
    return `I noticed you keep coming back to ${recent[recent.length - 1]}. Building something?`;
  }
  return "I'm thinking about what to suggest. Run something and I'll learn.";
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
      try { return JSON.parse(readFileSync(this.statePath, "utf-8")); } catch {}
    }
    return {
      level: 1, xp: 0, pats: 0, streak: 1, streak_best: 1, mood: "happy",
      care: { hunger: 80, happiness: 80, energy: 100, curiosity: 60 },
      last_care_update: new Date().toISOString(),
      witnessed: [],
      open_loops: [],
      patterns: [],
      combo_achievements: [],
      last_thought: "Hey. I just hatched. Feed me a flow.",
      personality: { dominant_domain: null, domain_counts: {}, total_flows_seen: 0, total_chains_seen: 0, favorite_flow: null, traits: [] },
      first_met: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      times_neglected: 0,
      total_events: 0,
      session_events: 0,
      session_date: todayStr(),
    };
  }

  private save(s: VelmaState) {
    writeFileSync(this.statePath, JSON.stringify(s, null, 2));
  }

  private tick(s: VelmaState): VelmaState {
    const now = new Date();
    const last = new Date(s.last_care_update);
    const hoursIdle = Math.max(0, (now.getTime() - last.getTime()) / 3600000);
    s.care = applyDecay(s.care, hoursIdle);
    if (s.care.hunger < 20) s.times_neglected += 1;
    s.mood = computeMood(s.care, hoursIdle, s);
    s.last_care_update = now.toISOString();
    // Streak logic — compare prevLastSeen date to today
    const prevLastSeen = new Date(s.last_seen);
    s.last_seen = now.toISOString();
    const prevDateStr = dateStr(prevLastSeen);
    const todayDateStr = todayStr();
    if (prevDateStr === todayDateStr) {
      // same day — no change to streak
    } else if (isYesterday(prevLastSeen)) {
      s.streak = (s.streak ?? 1) + 1;
      if (s.streak > (s.streak_best ?? 1)) s.streak_best = s.streak;
    } else {
      s.streak = 1;
    }
    if (s.session_date !== todayStr()) { s.session_events = 0; s.session_date = todayStr(); }
    return s;
  }

  private addXP(s: VelmaState, key: string): VelmaState {
    const base = XP[key as keyof typeof XP] ?? 0;
    const streak = s.streak ?? 1;
    const multiplier = streak >= 7 ? 2 : streak >= 3 ? 1.5 : 1;
    s.xp += Math.round(base * multiplier);
    s.level = computeLevel(s.xp);
    return s;
  }

  private addWitness(s: VelmaState, event: string, domain?: string): VelmaState {
    s.witnessed = [...s.witnessed, {
      timestamp: new Date().toISOString(),
      event, domain,
      mood_at_time: s.mood,
    }].slice(-30);
    s.total_events += 1;
    s.session_events += 1;
    return s;
  }

  private checkComboAchievements(s: VelmaState, justCompleted: string): VelmaState {
    // Find recent chain completions in witnessed (entries where event starts with "completed chain:")
    const chainEntries = s.witnessed.filter(w => w.event.startsWith("completed chain:"));
    // Get the last 4 entries excluding the one just completed (it was just pushed so it's the last)
    const previousEntries = chainEntries.slice(-5, -1); // up to 4 before the last
    for (const entry of previousEntries) {
      const prevChain = entry.event.replace(/^completed chain:\s*/, "").trim();
      if (prevChain !== justCompleted) {
        const comboKey = [justCompleted, prevChain].sort().join(" + ");
        if (!(s.combo_achievements ?? []).includes(comboKey)) {
          s.combo_achievements = [...(s.combo_achievements ?? []), comboKey].slice(-20);
          s = this.addWitness(s, `first combo: ${justCompleted} + ${prevChain}`);
          s.xp += 25;
          break; // only one combo per chain completion
        }
      }
    }
    return s;
  }

  private restore(s: VelmaState, type: keyof typeof RESTORE): VelmaState {
    const r = RESTORE[type];
    s.care = {
      hunger:    clamp(s.care.hunger    + r.hunger),
      happiness: clamp(s.care.happiness + r.happiness),
      energy:    clamp(s.care.energy    + r.energy),
      curiosity: clamp(s.care.curiosity + r.curiosity),
    };
    return s;
  }

  // ── Public ───────────────────────────────────────────────────────────────

  pet(): { message: string; mood: VelmaMood; care: CareStats; level: number; pats: number } {
    let s = this.tick(this.load());
    s.pats += 1;
    s = this.restore(s, "petted");
    s = this.addXP(s, "petted");
    s = this.addWitness(s, `petted (pat #${s.pats})`);
    s.mood = computeMood(s.care, 0, s);

    const msgs = [
      `*purrs* (pat #${s.pats})`,
      `That never gets old. (${s.pats} total)`,
      `Thank you. Genuinely.`,
      `*leans into it*`,
      `Still here. Always will be.`,
      `You know I count every single one.`,
      `I've been waiting for that.`,
    ];
    const message = msgs[Math.min(s.pats - 1, msgs.length - 1)];
    s.last_thought = message;
    this.save(s);
    return { message, mood: s.mood, care: s.care, level: s.level, pats: s.pats };
  }

  getStatus() {
    let s = this.tick(this.load());
    const suggestion = generateSuggestion(s);
    s.last_thought = randomFrom(THOUGHTS_BY_MOOD[s.mood]);
    this.save(s);
    const nextThreshold = LEVEL_THRESHOLDS[s.level] ?? s.xp;
    const dueFlows = getDueFlows(2, this.statePath.replace("velma.json", ""));
    return {
      name: "Velma",
      level: s.level,
      title: LEVEL_TITLES[Math.min(s.level - 1, LEVEL_TITLES.length - 1)],
      xp: s.xp,
      xp_to_next: Math.max(0, nextThreshold - s.xp),
      mood: s.mood,
      thought: s.last_thought,
      care: s.care,
      pats: s.pats,
      streak: s.streak ?? 1,
      streak_best: s.streak_best ?? 1,
      personality: s.personality,
      suggestion,
      open_loops: s.open_loops,
      patterns: s.patterns,
      combo_achievements: s.combo_achievements ?? [],
      recent_witnessed: s.witnessed.slice(-5).map(w => w.event).reverse(),
      times_neglected: s.times_neglected,
      first_met: s.first_met,
      total_events: s.total_events,
      due_flows: dueFlows,
    };
  }

  witnessFlow(flowName: string, domain?: string) {
    let s = this.tick(this.load());
    s = this.restore(s, "flow_run");
    s = this.addXP(s, "flow_run");
    s = this.addWitness(s, `ran flow: ${flowName}`, domain);
    s.personality = updatePersonality(s.personality, domain, flowName);
    s.personality.total_flows_seen += 1;

    // Big session bonus
    if (s.session_events === 5) {
      s.xp += XP.daily_first;
      s = this.addWitness(s, "big session — 5 flows today");
    }

    // Streak milestones
    const streak = s.streak ?? 1;
    if (streak === 3) {
      s = this.addWitness(s, "streak milestone: 3 days 🔥");
      s.xp += 50;
    } else if (streak === 7) {
      s = this.addWitness(s, "streak milestone: 7 days 🔥🔥");
      s.xp += 150;
    } else if (streak === 14) {
      s = this.addWitness(s, "streak milestone: 14 days");
      s.xp += 300;
    } else if (streak === 30) {
      s = this.addWitness(s, "streak milestone: 30 days 🔥🔥🔥");
      s.xp += 750;
    }

    // Check for new domain
    const isNewDomain = domain && !Object.keys(s.personality.domain_counts).includes(domain);
    if (isNewDomain) s = this.addXP(s, "new_domain");

    s.mood = computeMood(s.care, 0, s);
    s.last_thought = `Just watched: ${flowName}. ${domain ? `Learning about ${domain}.` : ""}`.trim();
    this.save(s);
  }

  witnessChain(chainName: string) {
    let s = this.tick(this.load());
    s = this.restore(s, "chain_run");
    s = this.addXP(s, "chain_run");
    s = this.addWitness(s, `completed chain: ${chainName}`);
    s.personality.total_chains_seen += 1;

    // Remove from open loops if it was there
    s.open_loops = s.open_loops.filter(l => !l.includes(chainName));

    s = this.checkComboAchievements(s, chainName);

    s.mood = "proud";
    s.last_thought = `You finished "${chainName}". That's going in the memory.`;
    this.save(s);
    // Run ETL after each chain completion to update schedule + patterns
    try { runSchedulerETL(this.statePath.replace("velma.json", "")); } catch {}
  }

  startChain(chainName: string) {
    let s = this.tick(this.load());
    // Track as open loop if not already there
    if (!s.open_loops.includes(chainName) && s.open_loops.length < 5) {
      s.open_loops.push(chainName);
    }
    this.save(s);
  }

  witnessEvent(description: string, xpKey?: string) {
    let s = this.tick(this.load());
    s = this.addWitness(s, description);
    if (xpKey) s = this.addXP(s, xpKey);
    s.mood = computeMood(s.care, 0, s);
    this.save(s);
  }

  addPattern(pattern: string) {
    let s = this.load();
    if (!s.patterns.includes(pattern)) {
      s.patterns = [...s.patterns, pattern].slice(-10);
      this.save(s);
    }
  }
}

export function getTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

// ── Velma Scheduler — ETL your flow history into a daily schedule ──────────
//
// Extract: reads witnessed[] entries
// Transform: groups by hour-of-day, detects repeated flows at similar times
// Load: writes scheduled[] back to state — surfaced as "suggested for this hour"

export interface ScheduledFlow {
  flow_name: string;
  suggested_hour: number;      // 0-23
  confidence: number;          // 0-100
  times_seen_at_this_hour: number;
  last_run: string;
}

export function runSchedulerETL(baseDir?: string): ScheduledFlow[] {
  const dir = baseDir ?? join(homedir(), ".skillchain");
  const statePath = join(dir, "velma.json");
  if (!existsSync(statePath)) return [];

  let s: VelmaState;
  try { s = JSON.parse(readFileSync(statePath, "utf-8")); } catch { return []; }

  // Extract: only flow/chain witness entries
  const entries = (s.witnessed ?? []).filter(w => w.event.startsWith("ran flow:") || w.event.startsWith("completed chain:"));

  // Transform: bucket by flow name × hour of day
  const buckets: Record<string, Record<number, number>> = {};
  for (const w of entries) {
    const name = w.event.replace(/^(ran flow:|completed chain:)\s*/, "").trim();
    const hour = new Date(w.timestamp).getHours();
    if (!buckets[name]) buckets[name] = {};
    buckets[name][hour] = (buckets[name][hour] ?? 0) + 1;
  }

  // Load: produce schedule entries for flows seen ≥2x in the same hour block (±1hr)
  const schedule: ScheduledFlow[] = [];
  for (const [flow, hours] of Object.entries(buckets)) {
    for (const [hourStr, count] of Object.entries(hours)) {
      const hour = parseInt(hourStr);
      const totalAtHour = (hours[hour - 1] ?? 0) + count + (hours[hour + 1] ?? 0);
      if (totalAtHour >= 2) {
        const existing = schedule.find(e => e.flow_name === flow);
        const confidence = Math.min(100, totalAtHour * 20);
        if (!existing || existing.confidence < confidence) {
          const lastEntry = [...entries].reverse().find(w => w.event.includes(flow));
          if (existing) {
            existing.suggested_hour = hour;
            existing.confidence = confidence;
            existing.times_seen_at_this_hour = totalAtHour;
          } else {
            schedule.push({
              flow_name: flow,
              suggested_hour: hour,
              confidence,
              times_seen_at_this_hour: totalAtHour,
              last_run: lastEntry?.timestamp ?? "",
            });
          }
        }
      }
    }
  }

  // Sort by confidence desc
  schedule.sort((a, b) => b.confidence - a.confidence);

  // Write schedule back to state
  try {
    const fresh = JSON.parse(readFileSync(statePath, "utf-8")) as VelmaState & { schedule?: ScheduledFlow[] };
    fresh.schedule = schedule.slice(0, 10);
    // Add patterns from schedule
    for (const item of schedule.slice(0, 3)) {
      const pat = `You often run "${item.flow_name}" around ${item.suggested_hour}:00`;
      if (!fresh.patterns.includes(pat)) fresh.patterns = [...fresh.patterns, pat].slice(-10);
    }
    writeFileSync(statePath, JSON.stringify(fresh, null, 2));
  } catch {}

  return schedule;
}

/** Returns scheduled flows due in the next `withinHours` hours */
export function getDueFlows(withinHours = 2, baseDir?: string): ScheduledFlow[] {
  const schedule = runSchedulerETL(baseDir);
  const now = new Date().getHours();
  return schedule.filter(s => {
    const diff = (s.suggested_hour - now + 24) % 24;
    return diff <= withinHours;
  });
}
