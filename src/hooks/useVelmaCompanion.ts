/**
 * useVelmaCompanion — Velma's persistent state, stored in localStorage.
 * Tracks XP, level, mood, witnessed events, pats. Grows over time.
 * Also polls for in-app notifications from the server.
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
  witnessed: string[];       // last 20 events
  last_comment: string;
  show_bubble: boolean;
  total_events: number;
  session_events: number;
  session_date: string;
  first_met: string;
}

// Tier 1: L1–3 (8-bit), Tier 2: L4–6 (16-bit), Tier 3: L7–10 (32-bit), Tier 4: L11+ (holographic)
export type VisualTier = 1 | 2 | 3 | 4;

const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
  2750, 3300, 3900, 4550, 5250, 6000,
];

const LEVEL_TITLES = [
  'Newborn', 'Curious Pup', 'Little Watcher', 'Companion',
  'Trusted Friend', 'Loyal Ally', 'Seasoned Companion', 'Wise Observer',
  'Veteran', 'Sage', 'Legend',
];

const XP_TABLE: Record<string, number> = {
  petted: 15,
  page_visited: 2,
  wallet_connected: 20,
  flow_run: 5,
  chain_run: 12,
  skill_purchased: 30,
  subscribed: 25,
  staked: 20,
  daily_first: 10,
  // Fabric
  session_created: 20,
  answers_submitted: 15,
  synthesis_triggered: 30,
  guest_link_copied: 5,
  // Discovery
  discovery_submitted: 15,
  match_found: 25,
  // Settings
  key_configured: 10,
};

// Action-specific comments override the generic mood comment for big moments
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
  ],
  session_created: [
    "Session live. Now send them the link.",
    "Smart move — get both sides on record.",
    "This is how alignment actually happens.",
  ],
  answers_submitted: [
    "Locked in. Waiting on the other side now.",
    "Your side's done. Velma's watching the clock.",
    "Good. Private and sealed.",
  ],
  synthesis_triggered: [
    "Truth laid bare. That's what we're here for.",
    "Nobody can argue with the neutral read.",
    "Claude saw everything. Time to see what it found.",
  ],
  key_configured: [
    "Claude key set. You're ready to run synthesis.",
    "Setup done. Now the real work starts.",
  ],
  wallet_connected: [
    "Wallet connected. I can see you now.",
    "Identity verified. Welcome to the network.",
    "On-chain now. Let's make it count.",
  ],
  match_found: [
    "Somebody out there fits. Don't sleep on this.",
    "New match dropped. I'd look at this one.",
  ],
  skill_purchased: [
    "Investment made. That flow's yours permanently.",
    "Bought and unlocked. No daily limits.",
  ],
};

const MOOD_COMMENTS: Record<VelmaMood, string[]> = {
  calm: [
    "Just watching. No complaints.",
    "All good from where I'm sitting.",
    "Steady. Present. Ready.",
    "I see everything from here.",
  ],
  curious: [
    "Ooh, what are we looking at?",
    "That looks interesting...",
    "Tell me more about this.",
    "I want to understand this one.",
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
    "*yawns softly*",
  ],
  proud: [
    "That's what I'm talking about.",
    "Look at what you built.",
    "I witnessed that. Remember it.",
    "Okay okay okay. That was real.",
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
  if (state.session_events >= 10) return 'excited';
  if (state.total_events > 0 && state.witnessed.slice(-3).some(e => e.includes('purchased') || e.includes('staked') || e.includes('subscribed'))) return 'proud';
  if (state.session_events >= 5) return 'focused';
  if (state.session_events >= 2) return 'curious';
  return 'calm';
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const STORAGE_KEY = 'flowfabric-velma-v1';

function loadState(): VelmaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  return {
    level: 1, xp: 0, mood: 'calm', pats: 0,
    witnessed: [], last_comment: "Hey. I'm Velma. I watch.",
    show_bubble: true, total_events: 0, session_events: 0,
    session_date: todayStr(), first_met: new Date().toISOString(),
  };
}

function saveState(s: VelmaState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useVelmaCompanion() {
  const [state, setState] = useState<VelmaState>(loadState);

  // Persist on every change
  useEffect(() => { saveState(state); }, [state]);

  // Reset session counter on new day
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
      return {
        ...s,
        xp: s.xp + gain,
        total_events: s.total_events + 1,
        session_events: s.session_events + 1,
        witnessed,
      };
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
      ];
      const comment = reactions[Math.min(pats - 1, reactions.length - 1)];
      const gain = XP_TABLE.petted;
      return {
        ...s,
        pats,
        xp: s.xp + gain,
        total_events: s.total_events + 1,
        session_events: s.session_events + 1,
        last_comment: comment,
        show_bubble: true,
        witnessed: [...s.witnessed, `petted (pat #${pats})`].slice(-20),
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

  const speak = useCallback(() => {
    setState(s => {
      const comment = randomFrom(MOOD_COMMENTS[s.mood]);
      return { ...s, last_comment: comment, show_bubble: true };
    });
  }, []);

  // ── Notification polling ─────────────────────────────────────────────────

  const [notifications, setNotifications] = useState<VelmaNotification[]>([]);
  const notifyCtxRef = useRef<VelmaNotifyContext>({});

  const setNotifyContext = useCallback((ctx: VelmaNotifyContext) => {
    notifyCtxRef.current = ctx;
  }, []);

  const pollNotifications = useCallback(async () => {
    const ctx = notifyCtxRef.current;
    const params = new URLSearchParams();
    if (ctx.wallet) {
      params.set('wallet', ctx.wallet);
    } else if (ctx.sessionId && ctx.token) {
      params.set('sessionId', ctx.sessionId);
      params.set('token', ctx.token);
    } else {
      return;
    }

    try {
      const res = await fetch(`/api/velma/notifications?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { notifications: VelmaNotification[] };
      if (data.notifications.length > 0) {
        setNotifications(data.notifications);
        // Wake Velma when a new notification arrives
        const first = data.notifications[0];
        mutate(s => ({
          ...s,
          last_comment: first.title,
          show_bubble: true,
        }));
      }
    } catch { /* non-fatal */ }
  }, [mutate]);

  const dismissNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch('/api/velma/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch { /* non-fatal */ }
  }, []);

  const dismissAllNotifications = useCallback(async () => {
    const ctx = notifyCtxRef.current;
    setNotifications([]);
    try {
      if (ctx.wallet) {
        await fetch('/api/velma/dismiss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: ctx.wallet }),
        });
      }
    } catch { /* non-fatal */ }
  }, []);

  // Poll every 60 seconds when a notify context is set
  useEffect(() => {
    const interval = setInterval(() => {
      const ctx = notifyCtxRef.current;
      if (ctx.wallet || (ctx.sessionId && ctx.token)) {
        pollNotifications();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  return {
    state,
    pet,
    witnessEvent,
    addXP,
    dismissBubble,
    speak,
    notifications,
    setNotifyContext,
    pollNotifications,
    dismissNotification,
    dismissAllNotifications,
  };
}
