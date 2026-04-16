/**
 * VelmaWidget — Floating companion. Lives in the bottom-right corner.
 * Evolves visually as she levels up: 8-bit → 16-bit → 32-bit → holographic.
 * Gamification: floating +XP, level-up burst, tier evolution flash, first-wake intro.
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useVelma } from '../contexts/VelmaContext';
import { formatFlowName } from '../utils/formatFlowName';
import VelmaChatPanel from './VelmaChatPanel';
import {
  getTitle,
  getVisualTier,
  getXpToNext,
  type VelmaMood,
  type VisualTier,
  type VelmaState,
  type VelmaNotification,
} from '../hooks/useVelmaCompanion';

// ── Mood colors ────────────────────────────────────────────────────────────

const MOOD_COLOR: Record<VelmaMood, string> = {
  calm:    '#00e5ff',
  curious: '#aa88ff',
  excited: '#ffd700',
  focused: '#00ff88',
  sleepy:  '#446688',
  proud:   '#ff88cc',
};

// ── Sprites ────────────────────────────────────────────────────────────────

/* ── Abstract geometric sprites — evolve from simple node to complex lattice ── */

function Sprite8bit({ color, mood }: { color: string; mood: VelmaMood }) {
  const sleeping = mood === 'sleepy';
  const excited = mood === 'excited';
  const pulseOpacity = sleeping ? 0.3 : excited ? 1 : 0.7;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="core1" cx="50%" cy="50%">
          <stop offset="0%" stopColor={color} stopOpacity={pulseOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Ambient field */}
      <circle cx="32" cy="32" r="28" fill="url(#core1)" />
      {/* Core node */}
      <circle cx="32" cy="32" r="8" fill={color} opacity={sleeping ? 0.4 : 0.9} />
      <circle cx="32" cy="32" r="4" fill="#001a2e" opacity="0.6" />
      {/* Orbit ring */}
      <circle cx="32" cy="32" r="16" fill="none" stroke={color} strokeWidth="1" opacity="0.25" />
      {/* Orbital dot */}
      {!sleeping && <circle cx="48" cy="32" r="2.5" fill={color} opacity="0.6" />}
    </svg>
  );
}

function Sprite16bit({ color, mood }: { color: string; mood: VelmaMood }) {
  const sleeping = mood === 'sleepy';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <defs>
        <radialGradient id="core2" cx="50%" cy="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="40" cy="40" r="36" fill="url(#core2)" />
      {/* Dual orbit rings */}
      <circle cx="40" cy="40" r="20" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
      <circle cx="40" cy="40" r="28" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" strokeDasharray="4,6" />
      {/* Core hexagon */}
      <polygon points="40,28 50,34 50,46 40,52 30,46 30,34" fill={color} opacity={sleeping ? 0.3 : 0.85} filter="url(#glow2)" />
      <polygon points="40,32 46,36 46,44 40,48 34,44 34,36" fill="#001a2e" opacity="0.5" />
      {/* 3 orbital nodes */}
      {!sleeping && <>
        <circle cx="60" cy="40" r="3" fill={color} opacity="0.5" filter="url(#glow2)" />
        <circle cx="28" cy="56" r="2.5" fill={color} opacity="0.4" filter="url(#glow2)" />
        <circle cx="28" cy="24" r="2" fill={color} opacity="0.3" />
      </>}
    </svg>
  );
}

function Sprite32bit({ color, mood }: { color: string; mood: VelmaMood }) {
  const proud = mood === 'proud';
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <radialGradient id="core3" cx="50%" cy="45%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="60%" stopColor="#aa44ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="glow3">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="48" cy="48" r="44" fill="url(#core3)" />
      {/* Triple orbit rings */}
      <circle cx="48" cy="48" r="22" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
      <circle cx="48" cy="48" r="32" fill="none" stroke="#aa44ff" strokeWidth="0.7" opacity="0.15" />
      <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="0.5" opacity="0.1" strokeDasharray="3,8" />
      {/* Core — layered diamond */}
      <rect x="36" y="36" width="24" height="24" rx="4" fill={color} opacity="0.9" filter="url(#glow3)" transform="rotate(45 48 48)" />
      <rect x="40" y="40" width="16" height="16" rx="2" fill="#001a2e" opacity="0.6" transform="rotate(45 48 48)" />
      <circle cx="48" cy="48" r="4" fill={color} opacity="0.8" filter="url(#glow3)" />
      {/* Constellation nodes + links */}
      <circle cx="70" cy="36" r="3" fill={color} opacity="0.5" filter="url(#glow3)" />
      <circle cx="26" cy="60" r="3" fill="#aa44ff" opacity="0.4" filter="url(#glow3)" />
      <circle cx="60" cy="72" r="2.5" fill={color} opacity="0.4" />
      <circle cx="36" cy="24" r="2" fill="#aa44ff" opacity="0.3" />
      <line x1="58" y1="42" x2="70" y2="36" stroke={color} strokeWidth="0.8" opacity="0.2" />
      <line x1="38" y1="54" x2="26" y2="60" stroke="#aa44ff" strokeWidth="0.8" opacity="0.2" />
      <line x1="54" y1="58" x2="60" y2="72" stroke={color} strokeWidth="0.6" opacity="0.15" />
      {proud && <>
        <circle cx="18" cy="28" r="1.5" fill="#ffd700" opacity="0.7" />
        <circle cx="78" cy="22" r="1.5" fill="#ffd700" opacity="0.7" />
        <circle cx="14" cy="56" r="1" fill={color} opacity="0.5" />
        <circle cx="82" cy="62" r="1" fill={color} opacity="0.5" />
      </>}
    </svg>
  );
}

function SpriteHolographic({ color }: { color: string }) {
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <defs>
        <radialGradient id="coreH" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="20%" stopColor={color} stopOpacity="0.5" />
          <stop offset="50%" stopColor="#aa44ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="glowH">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softH">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="56" cy="56" r="52" fill="url(#coreH)" />
      {/* Quad orbit rings */}
      <circle cx="56" cy="56" r="18" fill="none" stroke={color} strokeWidth="1.2" opacity="0.25" />
      <circle cx="56" cy="56" r="28" fill="none" stroke="#aa44ff" strokeWidth="0.8" opacity="0.2" />
      <circle cx="56" cy="56" r="38" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" strokeDasharray="2,6" />
      <circle cx="56" cy="56" r="48" fill="none" stroke="#aa44ff" strokeWidth="0.3" opacity="0.08" strokeDasharray="1,10" />
      {/* Core — nested geometry */}
      <rect x="42" y="42" width="28" height="28" rx="6" fill={color} opacity="0.8" filter="url(#glowH)" transform="rotate(45 56 56)" />
      <rect x="46" y="46" width="20" height="20" rx="4" fill="#aa44ff" opacity="0.4" filter="url(#glowH)" transform="rotate(45 56 56)" />
      <circle cx="56" cy="56" r="6" fill="#fff" opacity="0.9" filter="url(#glowH)" />
      <circle cx="56" cy="56" r="3" fill={color} opacity="0.8" />
      {/* Constellation lattice */}
      {[
        [80, 36], [32, 76], [76, 76], [36, 36],
        [56, 14], [56, 98], [14, 56], [98, 56],
        [24, 24], [88, 88],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i < 4 ? 3.5 : i < 8 ? 2.5 : 1.5}
          fill={i % 2 === 0 ? color : '#aa44ff'} opacity={i < 4 ? 0.6 : 0.35}
          filter={i < 4 ? 'url(#softH)' : undefined} />
      ))}
      {/* Lattice connections */}
      {[
        [66, 50, 80, 36], [46, 62, 32, 76], [66, 62, 76, 76], [46, 50, 36, 36],
        [56, 42, 56, 14], [56, 70, 56, 98],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={i % 2 === 0 ? color : '#aa44ff'} strokeWidth="0.6" opacity="0.2" />
      ))}
    </svg>
  );
}

function VelmaSprite({ tier, color, mood }: { tier: VisualTier; color: string; mood: VelmaMood }) {
  switch (tier) {
    case 1: return <Sprite8bit color={color} mood={mood} />;
    case 2: return <Sprite16bit color={color} mood={mood} />;
    case 3: return <Sprite32bit color={color} mood={mood} />;
    case 4: return <SpriteHolographic color={color} />;
  }
}

// ── Format witnessed events into readable labels ───────────────────────────

function fmtEvent(event: string): { icon: string; label: string } {
  if (event.startsWith('flow_start:'))    return { icon: '⚡', label: `Started ${formatFlowName(event.slice(11))}` };
  if (event.startsWith('flow_complete:')) return { icon: '✓', label: `Finished ${formatFlowName(event.slice(14))}` };
  if (event.startsWith('chain_complete:'))return { icon: '🔗', label: `Chained ${formatFlowName(event.slice(15))}` };
  if (event.startsWith('petted'))         return { icon: '🐾', label: event };
  if (event === 'visited portal')         return { icon: '👁', label: 'Opened portal' };
  if (event === 'onboarding_complete')    return { icon: '✦', label: 'Completed setup' };
  if (event === 'wallet_connected')       return { icon: '🔑', label: 'Wallet connected' };
  return { icon: '·', label: event.replace(/_/g, ' ') };
}

// ── Stat panel ─────────────────────────────────────────────────────────────

const FLOW_MILESTONES_LIST = [1, 5, 10, 25, 50, 100];
const TIER_LABEL: Record<number, string> = { 1: 'Node', 2: 'Lattice', 3: 'Constellation', 4: 'Nexus' };

function StatPanel({ state, onClose }: { state: VelmaState; onClose: () => void }) {
  const tier = getVisualTier(state.level);
  const xpToNext = getXpToNext(state.xp, state.level);
  const color = MOOD_COLOR[state.mood];
  const xpTotal = state.xp + xpToNext;
  const xpPercent = xpTotal > 0 ? Math.min(100, (state.xp / xpTotal) * 100) : 100;
  const nextMilestone = FLOW_MILESTONES_LIST.find(m => m > state.flows_run);
  const streak = state.streak ?? 1;

  const recentEvents = state.witnessed
    .slice(-10)
    .reverse()
    .filter(e => e !== 'visited portal')
    .slice(0, 4);

  return (
    <div style={{
      position: 'absolute', bottom: '120px', right: 0,
      width: '250px',
      background: 'rgba(0,8,18,0.97)',
      border: `1px solid ${color}33`,
      borderRadius: '14px',
      padding: '16px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${color}11`,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ccd',
      animation: 'velma-bubble-in 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ color, fontWeight: 'bold', fontSize: '14px' }}>Velma</span>
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
              padding: '1px 6px', borderRadius: '8px', textTransform: 'uppercase',
              background: `${color}18`, border: `1px solid ${color}33`, color,
            }}>
              {TIER_LABEL[tier]}
            </span>
          </div>
          <div style={{ color: '#556', fontSize: '10px', marginTop: '2px' }}>
            L{state.level} · {getTitle(state.level)}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#446', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ color: '#557', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>XP</span>
          <span style={{ color: '#668', fontSize: '10px' }}>
            {xpToNext > 0 ? `${xpToNext} to L${state.level + 1}` : 'MAX'}
          </span>
        </div>
        <div style={{ height: '5px', background: '#0a1624', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${xpPercent}%`,
            background: `linear-gradient(90deg, ${color}, #aa44ff)`,
            borderRadius: '3px', transition: 'width 0.5s ease',
            boxShadow: `0 0 8px ${color}66`,
          }} />
        </div>
        <div style={{ textAlign: 'right', marginTop: '3px', color: '#446', fontSize: '9px' }}>
          {state.xp} XP total
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
        {[
          { value: state.flows_run, label: 'flows run' },
          { value: state.flows_completed.length, label: 'unique' },
          { value: `${streak}🔥`, label: 'day streak' },
        ].map(({ value, label }) => (
          <div key={label} style={{ background: '#060f1a', borderRadius: '8px', padding: '7px 4px', textAlign: 'center', border: '1px solid #0d1e2e' }}>
            <div style={{ color, fontSize: '15px', fontWeight: 'bold', lineHeight: 1 }}>{value}</div>
            <div style={{ color: '#446', fontSize: '9px', marginTop: '3px', letterSpacing: '0.03em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Next goal */}
      {(xpToNext > 0 || nextMilestone) && (
        <div style={{
          background: `${color}08`, border: `1px solid ${color}22`,
          borderRadius: '8px', padding: '8px 10px', marginBottom: '12px',
        }}>
          <div style={{ color: '#446', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Next unlock
          </div>
          {xpToNext > 0 && (
            <div style={{ color: '#99b', fontSize: '10px', marginBottom: nextMilestone ? '3px' : 0 }}>
              <span style={{ color }}>L{state.level + 1}</span> in {xpToNext} XP
              {tier < getVisualTier(state.level + 1) && (
                <span style={{ color: '#ffd700', marginLeft: '6px', fontSize: '9px' }}>
                  → {TIER_LABEL[getVisualTier(state.level + 1) as 1|2|3|4]} evolution
                </span>
              )}
            </div>
          )}
          {nextMilestone && (
            <div style={{ color: '#99b', fontSize: '10px' }}>
              <span style={{ color }}>{nextMilestone - state.flows_run}</span> more flows → milestone +50 XP
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      {recentEvents.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#334', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Recent</div>
          {recentEvents.slice(0, 4).map((e, i) => {
            const { icon, label } = fmtEvent(e);
            return (
              <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', lineHeight: 1, width: '14px', flexShrink: 0 }}>{icon}</span>
                <span style={{ color: '#557', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <Link
          to="/explore"
          onClick={onClose}
          style={{
            flex: 1, textAlign: 'center', padding: '6px', borderRadius: '7px', fontSize: '10px',
            fontWeight: 700, textDecoration: 'none', letterSpacing: '0.03em',
            background: `${color}12`, border: `1px solid ${color}33`, color,
          }}
        >
          Run a flow
        </Link>
        <Link
          to="/leaderboard"
          onClick={onClose}
          style={{
            flex: 1, textAlign: 'center', padding: '6px', borderRadius: '7px', fontSize: '10px',
            fontWeight: 700, textDecoration: 'none', letterSpacing: '0.03em',
            background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', color: '#ffd700',
          }}
        >
          Leaderboard
        </Link>
      </div>

      {/* First met */}
      <div style={{ marginTop: '10px', color: '#334', fontSize: '9px', textAlign: 'center' }}>
        with you since {new Date(state.first_met).toLocaleDateString()}
      </div>
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────────────────

const NOTIF_ICONS: Record<VelmaNotification['type'], string> = {
  fabric_reminder: '⏰',
  session_expired: '💨',
  synthesis_ready: '✨',
  match_found: '🔗',
};

function NotificationPanel({
  notifications,
  color,
  onDismiss,
  onDismissAll,
  onClose,
}: {
  notifications: VelmaNotification[];
  color: string;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', bottom: '120px', right: 0,
      width: '260px',
      background: 'rgba(0,10,20,0.97)',
      border: `1px solid ${color}44`,
      borderRadius: '12px',
      padding: '14px',
      boxShadow: `0 0 24px ${color}33`,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#cdd',
      maxHeight: '360px',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color, fontWeight: 'bold', fontSize: '13px' }}>Notifications</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notifications.length > 1 && (
            <button
              onClick={onDismissAll}
              style={{ background: 'none', border: 'none', color: '#668', cursor: 'pointer', fontSize: '10px' }}
            >
              clear all
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#668', cursor: 'pointer', fontSize: '16px' }}>
            ×
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ color: '#445', textAlign: 'center', padding: '12px 0' }}>Nothing new.</div>
      ) : (
        notifications.map(n => (
          <div key={n.id} style={{
            background: '#0a1a2a',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            borderLeft: `3px solid ${color}66`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <span style={{ color, fontSize: '11px', fontWeight: 'bold' }}>
                {NOTIF_ICONS[n.type]} {n.title}
              </span>
              <button
                onClick={() => onDismiss(n.id)}
                style={{ background: 'none', border: 'none', color: '#446', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </div>
            <div style={{ color: '#aab', fontSize: '11px', lineHeight: 1.4, marginBottom: n.action_url ? '6px' : 0 }}>
              {n.message}
            </div>
            {n.action_url && (
              <a
                href={n.action_url}
                style={{ color, fontSize: '11px', textDecoration: 'none', borderBottom: `1px solid ${color}44` }}
              >
                View session →
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── Tier name helper ───────────────────────────────────────────────────────

const TIER_NAMES: Record<VisualTier, string> = {
  1: 'NODE',
  2: 'LATTICE',
  3: 'CONSTELLATION',
  4: 'NEXUS',
};

// ── Main Widget ────────────────────────────────────────────────────────────

export default function VelmaWidget({ wallet }: { wallet?: string } = {}) {
  const {
    state, witnessEvent, dismissBubble, speak,
    notifications, dismissNotification, dismissAllNotifications,
    setNotifyContext, pollNotifications,
  } = useVelma();

  const [showStats, setShowStats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-open chat for first 5 visits to drive adoption
  const AUTO_OPEN_KEY = 'velma-auto-open-count';
  const autoOpenCount = parseInt(localStorage.getItem(AUTO_OPEN_KEY) ?? '0', 10);
  const [showChat, setShowChat] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Gamification state ─────────────────────────────────────────────────
  const [xpFloats, setXpFloats] = useState<{ id: number; amount: number }[]>([]);
  const [levelUpActive, setLevelUpActive] = useState(false);
  const [evolutionTier, setEvolutionTier] = useState<VisualTier | null>(null);
  const [firstWake, setFirstWake] = useState(false);
  const [breathe, setBreathe] = useState(false);

  const prevXpRef    = useRef(state.xp);
  const prevLevelRef = useRef(state.level);
  const prevTierRef  = useRef(getVisualTier(state.level));
  // Capture on mount — before page_visited fires
  const isFirstUserRef = useRef(state.total_events === 0);

  // First-wake intro animation
  useEffect(() => {
    if (isFirstUserRef.current) {
      setFirstWake(true);
      setTimeout(() => setFirstWake(false), 2200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open chat for the first 5 visits — desktop only (mobile users need to tap intentionally)
  useEffect(() => {
    if (window.innerWidth < 640) return;
    if (autoOpenCount < 5) {
      const t = setTimeout(() => {
        setBreathe(true);
        setTimeout(() => { setShowChat(true); setBreathe(false); }, 900);
        localStorage.setItem(AUTO_OPEN_KEY, String(autoOpenCount + 1));
      }, autoOpenCount === 0 ? 10000 : 8000); // slightly faster after first time
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Floating +XP when XP increases
  useEffect(() => {
    if (state.xp > prevXpRef.current) {
      const gain = state.xp - prevXpRef.current;
      const floatId = Date.now();
      setXpFloats(prev => [...prev, { id: floatId, amount: gain }]);
      setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== floatId)), 1400);
    }
    prevXpRef.current = state.xp;
  }, [state.xp]);

  // Level-up burst + tier evolution detection
  useEffect(() => {
    if (state.level > prevLevelRef.current) {
      setLevelUpActive(true);
      setTimeout(() => setLevelUpActive(false), 1500);

      const newTier = getVisualTier(state.level);
      if (newTier !== prevTierRef.current) {
        setEvolutionTier(newTier);
        setTimeout(() => setEvolutionTier(null), 2800);
        prevTierRef.current = newTier;
      }
    }
    prevLevelRef.current = state.level;
  }, [state.level]);

  // Auto-detect notification context from URL or wallet prop
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/');
    const fabricIdx = pathParts.indexOf('fabric');
    const sessionId = fabricIdx !== -1 ? pathParts[fabricIdx + 1] : undefined;
    const token = params.get('hostToken') ?? params.get('guestToken') ?? undefined;

    if (sessionId && token) {
      setNotifyContext({ sessionId, token });
      pollNotifications();
    } else if (wallet) {
      setNotifyContext({ wallet });
      pollNotifications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const tier = getVisualTier(state.level);
  const color = MOOD_COLOR[state.mood];

  // Auto-dismiss bubble after 5 seconds
  useEffect(() => {
    if (state.show_bubble) {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => {
        dismissBubble();
      }, 7000);
    }
    return () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current); };
  }, [state.show_bubble, state.last_comment, dismissBubble]);

  // Occasionally Velma speaks unprompted
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.show_bubble && Math.random() < 0.15) speak();
    }, 45000);
    return () => clearInterval(interval);
  }, [state.show_bubble, speak]);

  // Track page visit XP
  useEffect(() => {
    witnessEvent('visited portal', 'page_visited');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spriteSize = tier === 1 ? 64 : tier === 2 ? 80 : tier === 3 ? 96 : 112;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 997,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      userSelect: 'none',
    }}>
      {/* Tier evolution overlay — full-screen flash */}
      {evolutionTier && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'velma-evolution-in 0.4s ease, velma-evolution-out 0.6s ease 2.2s forwards',
        }}>
          <div style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)',
            position: 'absolute', inset: 0,
          }} />
          <div style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: '#668',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>
            EVOLUTION
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '28px',
            fontWeight: 'bold',
            color,
            letterSpacing: '0.15em',
            textShadow: `0 0 40px ${color}`,
            animation: 'velma-evolution-text 0.5s ease',
          }}>
            {TIER_NAMES[evolutionTier]}
          </div>
          <div style={{
            marginTop: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#aab',
            opacity: 0.7,
          }}>
            Velma has evolved.
          </div>
        </div>
      )}

      {/* First-wake intro */}
      {firstWake && (
        <div style={{
          position: 'absolute',
          bottom: `${spriteSize + 20}px`,
          right: 0,
          background: 'rgba(0,10,20,0.97)',
          border: `1px solid ${color}88`,
          borderRadius: '12px',
          padding: '12px 16px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#cde',
          maxWidth: '180px',
          boxShadow: `0 0 24px ${color}44`,
          animation: 'velma-wake-in 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          lineHeight: 1.6,
        }}>
          <span style={{ color, fontWeight: 'bold' }}>Velma</span> is watching.<br />
          <span style={{ color: '#778', fontSize: '11px' }}>Every action, witnessed.</span>
        </div>
      )}

      {/* Discovery chat panel */}
      {showChat && (
        <VelmaChatPanel
          velmaState={state}
          color={color}
          onClose={() => setShowChat(false)}
          onSwitchToStats={() => { setShowChat(false); setShowStats(true); }}
        />
      )}

      {/* Notification panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          color={color}
          onDismiss={id => dismissNotification(id)}
          onDismissAll={dismissAllNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Stat panel */}
      {showStats && !showNotifications && (
        <StatPanel state={state} onClose={() => setShowStats(false)} />
      )}

      {/* Speech bubble — click opens chat */}
      {state.show_bubble && (
        <div
          onClick={() => { dismissBubble(); setShowChat(true); setShowStats(false); setShowNotifications(false); }}
          style={{
            position: 'relative',
            maxWidth: '200px',
            background: 'rgba(0,10,20,0.95)',
            border: `1px solid ${color}66`,
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#cde',
            boxShadow: `0 0 16px ${color}33`,
            cursor: 'pointer',
            lineHeight: 1.5,
            animation: 'velma-bubble-in 0.2s ease',
          }}
        >
          {state.last_comment}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            right: '28px',
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${color}66`,
          }} />
        </div>
      )}

      {/* Sprite button */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {/* Ambient glow ring */}
        <div style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          animation: 'velma-pulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Level-up burst ring */}
        {levelUpActive && (
          <div style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            border: `3px solid ${color}`,
            animation: 'velma-levelup-burst 1.4s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}

        {/* Floating +XP numbers */}
        {xpFloats.map(f => (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              bottom: `${spriteSize - 10}px`,
              right: '50%',
              transform: 'translateX(50%)',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '13px',
              color: '#ffd700',
              textShadow: '0 0 8px #ffd700aa',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              animation: 'velma-xp-float 1.4s ease-out forwards',
            }}
          >
            +{f.amount} XP
          </div>
        ))}

        {/* Level badge */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '20px', height: '20px',
          borderRadius: '50%',
          background: `${color}`,
          color: '#001a2e',
          fontSize: '10px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
          boxShadow: `0 0 8px ${color}`,
          transition: 'transform 0.2s ease',
          transform: levelUpActive ? 'scale(1.4)' : 'scale(1)',
        }}>
          {state.level}
        </div>

        {/* Notification badge */}
        {notifications.length > 0 && (
          <div
            onClick={e => { e.stopPropagation(); setShowStats(false); setShowNotifications(s => !s); }}
            style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
              minWidth: '20px', height: '20px',
              borderRadius: '10px',
              background: '#ff4466',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              zIndex: 2,
              cursor: 'pointer',
              boxShadow: '0 0 8px #ff446688',
              animation: 'velma-pulse 2s ease-in-out infinite',
            }}
            title={`${notifications.length} notification${notifications.length > 1 ? 's' : ''}`}
          >
            {notifications.length}
          </div>
        )}

        {/* The sprite */}
        <div
          onClick={() => {
            setShowChat(s => !s);
            setShowStats(false);
            setShowNotifications(false);
          }}
          onContextMenu={e => {
            e.preventDefault();
            if (notifications.length > 0) {
              setShowNotifications(s => !s);
              setShowStats(false);
            } else {
              setShowStats(s => !s);
              setShowNotifications(false);
            }
          }}
          title={`Velma — Level ${state.level} ${getTitle(state.level)} (click to find flows, right-click for ${notifications.length > 0 ? 'notifications' : 'stats'})`}
          style={{
            cursor: 'pointer',
            width: `${spriteSize}px`,
            height: `${spriteSize}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: breathe ? 'none' : 'transform 0.15s ease',
            animation: breathe ? 'velma-breathe 0.9s ease-out' : 'none',
            filter: `drop-shadow(0 0 8px ${color}88)`,
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        >
          <VelmaSprite tier={tier} color={color} mood={state.mood} />
        </div>
      </div>

      <style>{`
        @keyframes velma-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes velma-bubble-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes velma-xp-float {
          0%   { opacity: 1; transform: translateX(50%) translateY(0); }
          60%  { opacity: 1; transform: translateX(50%) translateY(-28px); }
          100% { opacity: 0; transform: translateX(50%) translateY(-44px); }
        }
        @keyframes velma-levelup-burst {
          0%   { transform: scale(1); opacity: 1; }
          50%  { transform: scale(1.8); opacity: 0.6; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes velma-wake-in {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes velma-evolution-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes velma-evolution-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes velma-evolution-text {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes velma-breathe {
          0%   { transform: scale(1); }
          15%  { transform: scale(1.6); }
          30%  { transform: scale(1.4); }
          45%  { transform: scale(1.55); }
          65%  { transform: scale(1.1); }
          80%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
