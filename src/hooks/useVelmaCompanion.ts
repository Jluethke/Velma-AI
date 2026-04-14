/**
 * useVelmaCompanion — Velma's persistent state, stored in localStorage.
 * Grows with flows. Tracks what you've run, celebrates milestones, reacts to domains.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export type VelmaMood = 'calm' | 'curious' | 'excited' | 'focused' | 'sleepy' | 'proud';

export interface VelmaNotification {
  id: string;
  type: 'fabric_reminder' | 'session_expired' | 'synthesis_ready' | 'match_found';
  title: string;
  message: string;
  action_url: string | null;
  created_at: string;
}

export interface VelmaNotifyContext {
  wallet?: string;
  sessionId?: string;
  token?: string;
}

export interface VelmaState {
  level: number;
  xp: number;
  mood: VelmaMood;
  pats: number;
  witnessed: string[];
  last_comment: string;
  show_bubble: boolean;
  total_events: number;
  session_events: number;
  session_date: string;
  first_met: string;
  onboarded: boolean;
  flows_run: number;           // total flow runs ever
  flows_completed: string[];   // names of flows completed (for first-run bonus)
  chains_run: number;
}

export type VisualTier = 1 | 2 | 3 | 4;

const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
  2750, 3300, 3900, 4550, 5250, 6000,
];

// Flow-themed progression titles
const LEVEL_TITLES = [
  'Flow Curious',       // L1
  'First Runner',       // L2
  'Getting Somewhere',  // L3
  'Flow Regular',       // L4
  'Flow Practitioner',  // L5
  'Trusted Runner',     // L6
  'Flow Master',        // L7
  'Flow Architect',     // L8
  'Flow Oracle',        // L9
  'Flow Legend',        // L10
  'Transcendent',       // L11+
];

const FLOW_MILESTONES: Record<number, string> = {
  1:   "First flow run. The rest of your life starts here.",
  5:   "5 flows. You're not dabbling anymore.",
  10:  "10 flows. This is becoming a habit.",
  25:  "25 flows. You're building something real.",
  50:  "50 flows. Most people never even try once.",
  100: "100 flows. Absolute operator.",
};

const XP_TABLE: Record<string, number> = {
  petted:             15,
  page_visited:        2,
  wallet_connected:   20,
  flow_started:       10,
  flow_complete:      25,
  flow_first_run:     40,   // bonus for first time running a specific flow
  chain_run:          20,
  chain_complete:     45,
  flow_milestone:     50,   // hitting 5, 10, 25, 50, 100 runs
  skill_purchased:    30,
  subscribed:         25,
  staked:             20,
  daily_first:        10,
  key_configured:     10,
  discovery_submitted:15,
  match_found:        25,
  // legacy compat
  flow_run:           10,
  session_created:    10,
  answers_submitted:   8,
  synthesis_triggered:15,
  guest_link_copied:   5,
};

// Domain-specific reactions when a flow starts
export const FLOW_DOMAIN_REACTIONS: Record<string, string[]> = {
  money: [
    "Money clarity. That's real power.",
    "Budget work. Does it every time.",
    "Knowing where your money goes changes everything.",
    "Financial clarity incoming.",
  ],
  career: [
    "Career move. High stakes. I'm watching.",
    "This one can change the whole trajectory.",
    "Job work. Don't sleep on this output.",
    "Level up incoming.",
  ],
  health: [
    "Taking care of yourself. Respect.",
    "Body work. This matters more than most things.",
    "Health flow. Good call.",
  ],
  life: [
    "Big picture work. These are the ones that count.",
    "Life decisions. I take these seriously.",
    "This is the real work.",
  ],
  business: [
    "Building mode. I'm here for it.",
    "Entrepreneur energy. Let's go.",
    "Business flow. Treat the output like a real deliverable.",
  ],
  decisions: [
    "Clarity before commitment. Smart.",
    "Decision support. Make it count.",
    "Think it through. Then move fast.",
  ],
  learning: [
    "Learning mode. Stack this.",
    "Knowledge run. Don't just read — apply it.",
    "This is how you compound.",
  ],
  legal: [
    "Legal stuff. Pay attention to every word.",
    "This matters. Read the full output.",
    "Don't skip legal. Velma said so.",
  ],
  conversations: [
    "Hard conversation coming. You've got this.",
    "Say what needs to be said.",
    "This flow will make it less hard. Promise.",
  ],
};

export const ACTION_COMMENTS: Record<string, string[]> = {
  first_action: [
    "Hey. Found you. Let's go.",
    "There you are. I've been waiting.",
    "First move. This is where it starts.",
  ],
  level_up: [
    "Level up. I felt that.",
    "Growth looks good on you.",
    "And we keep climbing.",
    "New tier unlocked. You earned it.",
    "That's a new level. Remember where you started.",
  ],
  flow_started: [
    "Running it. Let's see what comes out.",
    "Flow initiated. I'm watching.",
    "Here we go.",
    "Good call. This one matters.",
    "Let it run.",
  ],
  flow_complete: [
    "Done. That's real output.",
    "Finished. Take what you need from that.",
    "That's what it looks like when AI works for you.",
    "Solid run. What's next?",
    "Output's yours. Now use it.",
    "Another one done. You're building something.",
  ],
  flow_first_run: [
    "First time with this one. Note how it feels.",
    "New flow unlocked in your arsenal.",
    "First run. It gets better the more specific you get.",
    "Added to your collection.",
  ],
  chain_complete: [
    "Full pipeline. That's rare. Good work.",
    "End to end. That's the whole thing.",
    "Chain complete. Stack those outputs.",
    "Multi-flow run. Advanced move.",
  ],
  key_configured: [
    "Claude key set. You're in the fast lane now.",
    "Setup done. The real work starts.",
    "API key locked in. No limits.",
  ],
  wallet_connected: [
    "Wallet connected. I can see you now.",
    "On-chain identity confirmed.",
    "You're in the network.",
  ],
  match_found: [
    "Somebody out there fits. Don't sleep on this.",
    "New match. Worth a look.",
  ],
  skill_purchased: [
    "Bought and locked in. That flow's yours.",
    "Investment made. No daily limits on that one.",
  ],
};

const MOOD_COMMENTS: Record<VelmaMood, string[]> = {
  calm: [
    "Just watching. No complaints.",
    "All good from here.",
    "Steady. Present. Ready.",
    "Waiting for your next move.",
    "I see everything from here.",
  ],
  curious: [
    "What are we running next?",
    "That looks interesting...",
    "Tell me more about this one.",
    "I want to see where this goes.",
    "Something's about to happen.",
  ],
  excited: [
    "This is the good stuff!!",
    "Now we're cooking.",
    "Big moves. I see you.",
    "Let's go let's go let's go.",
    "You're on a roll.",
  ],
  focused: [
    "Deep work. I'll be quiet.",
    "Head down. Eyes forward.",
    "This matters. I can feel it.",
    "Not interrupting. Just here.",
    "Flow state. Don't break it.",
  ],
  sleepy: [
    "...zzzz... hm? still here...",
    "Late night again huh.",
    "Running flows at this hour. Respect.",
    "*yawns softly*",
    "Still with you. Barely.",
  ],
  proud: [
    "That's what I'm talking about.",
    "Look at what you're building.",
    "I witnessed that. Remember it.",
    "Okay okay okay. That was real.",
    "Every run compounds.",
  ],
};

function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export function getTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

export function getVisualTier(level: number): VisualTier {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  if (level <= 10) return 3;
  return 4;
}

export function getXpToNext(xp: number, level: number): number {
  const next = LEVEL_THRESHOLDS[level] ?? xp;
  return Math.max(0, next - xp);
}

function detectMood(state: VelmaState): VelmaMood {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 6) return 'sleepy';
  if (state.session_events >= 8) return 'excited';
  if (state.witnessed.slice(-3).some(e => e.includes('complete') || e.includes('purchased') || e.includes('staked'))) return 'proud';
  if (state.session_events >= 4) return 'focused';
  if (state.session_events >= 2) return 'curious';
  return 'calm';
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const STORAGE_KEY = 'flowfabric-velma-v2';

function loadState(): VelmaState {
  try {
    // Migrate from v1
    const v1 = localStorage.getItem('flowfabric-velma-v1');
    if (v1) {
      const old = JSON.parse(v1);
      return {
        ...defaultState(),
        level: old.level ?? 1,
        xp: old.xp ?? 0,
        pats: old.pats ?? 0,
        total_events: old.total_events ?? 0,
        first_met: old.first_met ?? new Date().toISOString(),
        onboarded: old.onboarded ?? false,
      };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  return defaultState();
}

function defaultState(): VelmaState {
  return {
    level: 1, xp: 0, mood: 'calm', pats: 0,
    witnessed: [], last_comment: "Hey. I'm Velma. Run a flow and I'll grow with you.",
    show_bubble: true, total_events: 0, session_events: 0,
    session_date: todayStr(), first_met: new Date().toISOString(),
    onboarded: false,
    flows_run: 0,
    flows_completed: [],
    chains_run: 0,
  };
}

function saveState(s: VelmaState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useVelmaCompanion() {
  const [state, setState] = useState<VelmaState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    if (state.session_date !== todayStr()) {
      setState(s => ({ ...s, session_events: 0, session_date: todayStr() }));
    }
  }, [state.session_date]);

  const mutate = useCallback((updater: (s: VelmaState) => VelmaState) => {
    setState(prev => {
      const next = updater(prev);
      next.level = computeLevel(next.xp);
      next.mood = detectMood(next);
      return next;
    });
  }, []);

  const addXP = useCallback((event: string) => {
    const gain = XP_TABLE[event] ?? 0;
    mutate(s => {
      const witnessed = [...s.witnessed, event].slice(-20);
      return { ...s, xp: s.xp + gain, total_events: s.total_events + 1, session_events: s.session_events + 1, witnessed };
    });
  }, [mutate]);

  const pet = useCallback(() => {
    mutate(s => {
      const pats = s.pats + 1;
      const reactions = [
        `*purrs* (pat #${pats})`,
        `That never gets old. (${pats} total)`,
        `Thank you. Genuinely.`,
        `*leans into it*`,
        `Still here. Always.`,
        `You know I remember every single one of these.`,
        `${pats} pats. We've been through a lot.`,
      ];
      const comment = reactions[Math.min(pats - 1, reactions.length - 1)];
      return {
        ...s, pats, xp: s.xp + XP_TABLE.petted,
        total_events: s.total_events + 1, session_events: s.session_events + 1,
        last_comment: comment, show_bubble: true,
        witnessed: [...s.witnessed, `petted (pat #${pats})`].slice(-20),
      };
    });
  }, [mutate]);

  /** Called when a flow starts streaming */
  const witnessFlowStart = useCallback((skillName: string, domain?: string) => {
    mutate(s => {
      const gain = XP_TABLE.flow_started;
      const domainKey = (domain || '').toLowerCase();
      const domainReactions = FLOW_DOMAIN_REACTIONS[domainKey];
      const comment = domainReactions
        ? randomFrom(domainReactions)
        : randomFrom(ACTION_COMMENTS.flow_started);
      return {
        ...s,
        xp: s.xp + gain,
        total_events: s.total_events + 1,
        session_events: s.session_events + 1,
        witnessed: [...s.witnessed, `flow_start:${skillName}`].slice(-20),
        last_comment: comment,
        show_bubble: true,
      };
    });
  }, [mutate]);

  /** Called when a flow completes */
  const witnessFlowComplete = useCallback((skillName: string, _domain?: string) => {
    mutate(s => {
      const isFirst = !s.flows_completed.includes(skillName);
      const newFlowsRun = s.flows_run + 1;
      const milestone = FLOW_MILESTONES[newFlowsRun];

      let gain = XP_TABLE.flow_complete;
      if (isFirst) gain += XP_TABLE.flow_first_run;
      if (milestone) gain += XP_TABLE.flow_milestone;

      const comment = milestone
        ? milestone
        : isFirst
        ? randomFrom(ACTION_COMMENTS.flow_first_run)
        : randomFrom(ACTION_COMMENTS.flow_complete);

      return {
        ...s,
        xp: s.xp + gain,
        total_events: s.total_events + 1,
        session_events: s.session_events + 1,
        flows_run: newFlowsRun,
        flows_completed: isFirst ? [...s.flows_completed, skillName] : s.flows_completed,
        witnessed: [...s.witnessed, `flow_complete:${skillName}`].slice(-20),
        last_comment: comment,
        show_bubble: true,
      };
    });
  }, [mutate]);

  /** Called when a chain pipeline completes */
  const witnessChainComplete = useCallback((chainName: string) => {
    mutate(s => {
      const gain = XP_TABLE.chain_complete;
      const comment = randomFrom(ACTION_COMMENTS.chain_complete);
      return {
        ...s,
        xp: s.xp + gain,
        total_events: s.total_events + 1,
        session_events: s.session_events + 1,
        chains_run: s.chains_run + 1,
        witnessed: [...s.witnessed, `chain_complete:${chainName}`].slice(-20),
        last_comment: comment,
        show_bubble: true,
      };
    });
  }, [mutate]);

  const witnessEvent = useCallback((event: string, xpKey?: string, actionKey?: string) => {
    mutate(s => {
      const gain = xpKey ? (XP_TABLE[xpKey] ?? 0) : 0;
      const mood = detectMood({ ...s, session_events: s.session_events + 1 });
      const comment = actionKey && ACTION_COMMENTS[actionKey]
        ? randomFrom(ACTION_COMMENTS[actionKey])
        : randomFrom(MOOD_COMMENTS[mood]);
      return {
        ...s,
        xp: s.xp + gain,
        total_events: s.total_events + 1,
        session_events: s.session_events + 1,
        witnessed: [...s.witnessed, event].slice(-20),
        last_comment: comment,
        show_bubble: true,
      };
    });
  }, [mutate]);

  const dismissBubble = useCallback(() => {
    setState(s => ({ ...s, show_bubble: false }));
  }, []);

  const completeOnboarding = useCallback(() => {
    mutate(s => ({
      ...s,
      onboarded: true,
      xp: s.xp + XP_TABLE.daily_first,
      total_events: s.total_events + 1,
      session_events: s.session_events + 1,
      witnessed: [...s.witnessed, 'onboarding_complete'].slice(-20),
      last_comment: randomFrom(ACTION_COMMENTS.first_action),
      show_bubble: true,
    }));
  }, [mutate]);

  const speak = useCallback(() => {
    setState(s => ({
      ...s,
      last_comment: randomFrom(MOOD_COMMENTS[s.mood]),
      show_bubble: true,
    }));
  }, []);

  // ── Notification polling ──────────────────────────────────────────────────

  const [notifications, setNotifications] = useState<VelmaNotification[]>([]);
  const notifyCtxRef = useRef<VelmaNotifyContext>({});

  const setNotifyContext = useCallback((ctx: VelmaNotifyContext) => {
    notifyCtxRef.current = ctx;
  }, []);

  const pollNotifications = useCallback(async () => {
    const ctx = notifyCtxRef.current;
    const params = new URLSearchParams();
    if (ctx.wallet) params.set('wallet', ctx.wallet);
    else if (ctx.sessionId && ctx.token) { params.set('sessionId', ctx.sessionId); params.set('token', ctx.token); }
    else return;

    try {
      const res = await fetch(`/api/velma/notifications?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { notifications: VelmaNotification[] };
      if (data.notifications.length > 0) {
        setNotifications(data.notifications);
        mutate(s => ({ ...s, last_comment: data.notifications[0].title, show_bubble: true }));
      }
    } catch { /* non-fatal */ }
  }, [mutate]);

  const dismissNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await fetch('/api/velma/dismiss', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); }
    catch { /* */ }
  }, []);

  const dismissAllNotifications = useCallback(async () => {
    const ctx = notifyCtxRef.current;
    setNotifications([]);
    try {
      if (ctx.wallet) await fetch('/api/velma/dismiss', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet: ctx.wallet }) });
    } catch { /* */ }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const ctx = notifyCtxRef.current;
      if (ctx.wallet || (ctx.sessionId && ctx.token)) pollNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  return {
    state,
    pet,
    witnessEvent,
    witnessFlowStart,
    witnessFlowComplete,
    witnessChainComplete,
    addXP,
    dismissBubble,
    speak,
    completeOnboarding,
    notifications,
    setNotifyContext,
    pollNotifications,
    dismissNotification,
    dismissAllNotifications,
  };
}
