/**
 * VelmaWidget — Floating companion. Lives in the bottom-right corner.
 * Evolves visually as she levels up: 8-bit → 16-bit → 32-bit → holographic.
 * Gamification: floating +XP, level-up burst, tier evolution flash, first-wake intro.
 */
import { useState, useEffect, useRef } from 'react';
import { useVelma } from '../contexts/VelmaContext';
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

function Sprite8bit({ color, mood }: { color: string; mood: VelmaMood }) {
  const px = 4;
  const sleeping = mood === 'sleepy';
  const excited = mood === 'excited';
  const pixels: [number, number, string][] = [
    [6,2,color],[7,2,color],[8,2,color],[9,2,color],
    [5,3,color],[6,3,color],[7,3,color],[8,3,color],[9,3,color],[10,3,color],
    [5,4,color],[6,4,'#001a2e'],[7,4,color],[8,4,color],[9,4,'#001a2e'],[10,4,color],
    [5,5,color],[6,5,color],[7,5,color],[8,5,color],[9,5,color],[10,5,color],
    [7,6,color],[8,6,color],
    [5,7,color],[6,7,color],[7,7,color],[8,7,color],[9,7,color],[10,7,color],
    [5,8,color],[6,8,color],[7,8,color],[8,8,color],[9,8,color],[10,8,color],
    [5,9,color],[6,9,color],[7,9,color],[8,9,color],[9,9,color],[10,9,color],
    [3,7,color],[4,7,color],[11,7,color],[12,7,color],
    [3,8,color],[11,8,color],
    [6,10,color],[7,10,color],[8,10,color],[9,10,color],
    [6,11,color],[7,11,color],[8,11,color],[9,11,color],
    [5,12,color],[6,12,color],[8,12,color],[9,12,color],
    ...(sleeping ? [
      [6,4,'#aaffee'],[9,4,'#aaffee'],
    ] as [number,number,string][] : excited ? [
      [6,4,'#fff'],[9,4,'#fff'],
    ] as [number,number,string][] : []),
  ];

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ imageRendering: 'pixelated' }}>
      <rect width="64" height="64" fill="transparent" />
      {pixels.map(([x, y, c], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px} fill={c} />
      ))}
    </svg>
  );
}

function Sprite16bit({ color, mood }: { color: string; mood: VelmaMood }) {
  const sleeping = mood === 'sleepy';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <defs>
        <radialGradient id="body16" cx="50%" cy="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#001a2e" stopOpacity="1" />
        </radialGradient>
        <filter id="glow16">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="40" cy="52" rx="14" ry="18" fill="url(#body16)" filter="url(#glow16)" />
      <ellipse cx="40" cy="26" rx="13" ry="13" fill="url(#body16)" filter="url(#glow16)" />
      {sleeping ? (
        <>
          <line x1="33" y1="25" x2="37" y2="25" stroke={color} strokeWidth="2" />
          <line x1="43" y1="25" x2="47" y2="25" stroke={color} strokeWidth="2" />
        </>
      ) : (
        <>
          <ellipse cx="35" cy="25" rx="3" ry="3.5" fill={color} />
          <ellipse cx="45" cy="25" rx="3" ry="3.5" fill={color} />
          <ellipse cx="35" cy="25" rx="1.5" ry="1.5" fill="#001a2e" />
          <ellipse cx="45" cy="25" rx="1.5" ry="1.5" fill="#001a2e" />
        </>
      )}
      <path d="M26 48 Q18 44 14 52" stroke={color} strokeWidth="2" fill="none" strokeDasharray="3,2" />
      <path d="M54 48 Q62 44 66 52" stroke={color} strokeWidth="2" fill="none" strokeDasharray="3,2" />
      <ellipse cx="40" cy="10" rx="16" ry="4" fill="none" stroke="#ffd700" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

function Sprite32bit({ color, mood }: { color: string; mood: VelmaMood }) {
  const proud = mood === 'proud';
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <radialGradient id="aura32" cx="50%" cy="40%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="body32" cx="50%" cy="40%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="60%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#001a2e" stopOpacity="0.9" />
        </radialGradient>
        <filter id="glow32">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="48" cy="52" rx="36" ry="42" fill="url(#aura32)" />
      <path d="M28 82 Q24 60 28 50 Q32 38 48 36 Q64 38 68 50 Q72 60 68 82 Z"
        fill="url(#body32)" filter="url(#glow32)" />
      <ellipse cx="48" cy="28" rx="16" ry="16" fill="url(#body32)" filter="url(#glow32)" />
      <ellipse cx="41" cy="26" rx="4" ry="5" fill={color} filter="url(#glow32)" />
      <ellipse cx="55" cy="26" rx="4" ry="5" fill={color} filter="url(#glow32)" />
      <ellipse cx="41" cy="27" rx="2" ry="2.5" fill="#001a2e" />
      <ellipse cx="55" cy="27" rx="2" ry="2.5" fill="#001a2e" />
      <ellipse cx="48" cy="9" rx="20" ry="5" fill="none" stroke="#ffd700"
        strokeWidth="2" opacity="0.9" filter="url(#glow32)" />
      <path d="M30 58 Q14 52 10 62" stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M66 58 Q82 52 86 62" stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M32 68 Q16 70 14 78" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M64 68 Q80 70 82 78" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      {proud && <>
        <circle cx="20" cy="20" r="2" fill="#ffd700" opacity="0.9" />
        <circle cx="76" cy="18" r="2" fill="#ffd700" opacity="0.9" />
        <circle cx="14" cy="44" r="1.5" fill={color} opacity="0.8" />
        <circle cx="82" cy="40" r="1.5" fill={color} opacity="0.8" />
      </>}
    </svg>
  );
}

function SpriteHolographic({ color }: { color: string }) {
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <defs>
        <radialGradient id="coreHolo" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="30%" stopColor={color} stopOpacity="0.8" />
          <stop offset="70%" stopColor="#aa44ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bodyHolo" cx="50%" cy="40%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="50%" stopColor="#aa44ff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#001a2e" stopOpacity="0.4" />
        </radialGradient>
        <filter id="glowHolo">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="56" cy="60" rx="48" ry="52" fill="url(#coreHolo)" opacity="0.4" />
      <path d="M42 22 Q34 8 28 4 Q22 0 18 6" stroke={color} strokeWidth="2" fill="none"
        opacity="0.7" filter="url(#softGlow)" />
      <path d="M50 18 Q48 4 44 0" stroke="#aa44ff" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M62 18 Q64 4 68 0" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M70 22 Q78 8 84 4 Q90 0 94 6" stroke="#aa44ff" strokeWidth="2" fill="none"
        opacity="0.7" filter="url(#softGlow)" />
      <path d="M32 96 Q26 72 30 58 Q36 44 56 42 Q76 44 82 58 Q86 72 80 96 Z"
        fill="url(#bodyHolo)" filter="url(#glowHolo)" opacity="0.85" />
      <ellipse cx="56" cy="32" rx="20" ry="20" fill="url(#bodyHolo)" filter="url(#glowHolo)" />
      <path d="M40 70 L40 76 L46 76 M52 64 L58 64 L58 70 M68 72 L68 78 L62 78"
        stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
      <ellipse cx="47" cy="30" rx="5" ry="6" fill={color} filter="url(#glowHolo)" />
      <ellipse cx="65" cy="30" rx="5" ry="6" fill={color} filter="url(#glowHolo)" />
      <ellipse cx="47" cy="31" rx="2.5" ry="3" fill="#001a2e" />
      <ellipse cx="65" cy="31" rx="2.5" ry="3" fill="#001a2e" />
      <ellipse cx="47" cy="31" rx="1" ry="1" fill={color} opacity="0.8" />
      <ellipse cx="65" cy="31" rx="1" ry="1" fill={color} opacity="0.8" />
      <ellipse cx="56" cy="10" rx="24" ry="6" fill="none" stroke="#ffd700"
        strokeWidth="2.5" opacity="1" filter="url(#glowHolo)" />
      <ellipse cx="56" cy="10" rx="28" ry="8" fill="none" stroke="#ffd700"
        strokeWidth="1" opacity="0.4" />
      {[
        [18,30],[16,50],[20,72],[96,34],[94,58],[98,78],
        [36,8],[76,8],[26,88],[86,90],
      ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2" fill={i % 2 === 0 ? color : '#ffd700'}
          opacity="0.7" filter="url(#softGlow)" />
      ))}
      <path d="M34 68 Q18 62 12 72" stroke={color} strokeWidth="3" fill="none"
        opacity="0.8" filter="url(#softGlow)" />
      <path d="M78 68 Q94 62 100 72" stroke={color} strokeWidth="3" fill="none"
        opacity="0.8" filter="url(#softGlow)" />
      <path d="M50 40 Q56 44 62 40" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
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

// ── Stat panel ─────────────────────────────────────────────────────────────

function StatPanel({ state, onClose }: { state: VelmaState; onClose: () => void }) {
  const tier = getVisualTier(state.level);
  const xpToNext = getXpToNext(state.xp, state.level);
  const color = MOOD_COLOR[state.mood];
  const xpPercent = Math.min(100, (state.xp / (state.xp + xpToNext)) * 100);

  return (
    <div style={{
      position: 'absolute', bottom: '120px', right: 0,
      width: '220px',
      background: 'rgba(0,10,20,0.96)',
      border: `1px solid ${color}44`,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: `0 0 24px ${color}33`,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#cdd',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
        <span style={{ color, fontWeight: 'bold', fontSize: '14px' }}>Velma</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#668', cursor: 'pointer', fontSize: '16px' }}>×</button>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <span style={{ color: '#668' }}>Level </span>
        <span style={{ color }}>{state.level}</span>
        <span style={{ color: '#668' }}> — </span>
        <span style={{ color: '#aaa' }}>{getTitle(state.level)}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#668' }}>Tier </span>
        <span style={{ color }}>
          {tier === 1 ? '8-bit' : tier === 2 ? '16-bit' : tier === 3 ? '32-bit' : 'Holographic'}
        </span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#668' }}>
          <span>XP</span>
          <span>{state.xp} / {state.xp + xpToNext}</span>
        </div>
        <div style={{ height: '6px', background: '#112233', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${xpPercent}%`,
            background: `linear-gradient(90deg, ${color}, #aa44ff)`,
            borderRadius: '3px', transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        <div style={{ background: '#0a1a2a', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
          <div style={{ color, fontSize: '16px', fontWeight: 'bold' }}>{state.pats}</div>
          <div style={{ color: '#668', fontSize: '10px' }}>pats</div>
        </div>
        <div style={{ background: '#0a1a2a', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
          <div style={{ color, fontSize: '16px', fontWeight: 'bold' }}>{state.total_events}</div>
          <div style={{ color: '#668', fontSize: '10px' }}>witnessed</div>
        </div>
      </div>

      <div style={{ color: '#556', fontSize: '10px', marginBottom: '4px' }}>Mood</div>
      <div style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
        background: `${color}22`, border: `1px solid ${color}44`,
        color, fontSize: '11px', marginBottom: '10px',
      }}>
        {state.mood}
      </div>

      {state.witnessed.length > 0 && (
        <>
          <div style={{ color: '#556', fontSize: '10px', marginBottom: '4px' }}>Recently witnessed</div>
          {state.witnessed.slice(-3).reverse().map((e, i) => (
            <div key={i} style={{ color: '#557', fontSize: '10px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              · {e}
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: '10px', color: '#445', fontSize: '10px' }}>
        First met {new Date(state.first_met).toLocaleDateString()}
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
  1: '8-BIT',
  2: '16-BIT',
  3: '32-BIT',
  4: 'HOLOGRAPHIC',
};

// ── Onboarding guide panel ─────────────────────────────────────────────────

const API_KEY_STORAGE = 'flowfabric-anthropic-key';

const GUIDE_STEPS = [
  {
    icon: '🔑',
    label: 'Set your Claude key',
    desc: 'Synthesis needs it. One time. Stays on your device.',
    href: '/settings',
    check: () => Boolean(localStorage.getItem(API_KEY_STORAGE)?.trim()),
    urgentIfMissing: true,
  },
  {
    icon: '🤝',
    label: 'Start a Fabric session',
    desc: 'Both sides answer privately. Claude finds the alignment.',
    href: '/start',
    check: () => false,
    urgentIfMissing: false,
  },
  {
    icon: '⚡',
    label: 'Explore flows',
    desc: '165+ flows ready to run. Career, money, decisions, life.',
    href: '/explore',
    check: () => false,
    urgentIfMissing: false,
  },
  {
    icon: '🔗',
    label: 'Find your match',
    desc: "Tell me what you need. I'll find who fits.",
    href: '/discover',
    check: () => false,
    urgentIfMissing: false,
  },
];

function VelmaGuidePanel({
  color,
  onClose,
  onDone,
}: {
  color: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const hasKey = Boolean(localStorage.getItem(API_KEY_STORAGE)?.trim());

  return (
    <div style={{
      position: 'absolute',
      bottom: '120px',
      right: 0,
      width: '280px',
      background: 'rgba(0,10,20,0.97)',
      border: `1px solid ${color}55`,
      borderRadius: '14px',
      padding: '18px',
      boxShadow: `0 0 32px ${color}22`,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#cdd',
      animation: 'velma-bubble-in 0.25s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ color, fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>
            You're new here.
          </div>
          <div style={{ color: '#778', fontSize: '11px' }}>
            Let me be brief.
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#556', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {GUIDE_STEPS.map((step, i) => {
          const done = step.check();
          const urgent = step.urgentIfMissing && !done;
          return (
            <a
              key={i}
              href={step.href}
              onClick={onDone}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '9px',
                background: urgent ? `${color}0d` : '#0a1a2a',
                border: `1px solid ${urgent ? color + '44' : done ? 'rgba(74,222,128,0.2)' : '#1a2a3a'}`,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>
                {done ? '✓' : step.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: done ? 'rgba(74,222,128,0.8)' : urgent ? color : '#cde',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginBottom: '2px',
                }}>
                  {step.label}
                  {urgent && <span style={{ color, fontSize: '10px', marginLeft: '6px' }}>← start here</span>}
                </div>
                <div style={{ color: '#668', fontSize: '10px', lineHeight: 1.4 }}>
                  {step.desc}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={onDone}
        style={{
          width: '100%',
          padding: '9px',
          borderRadius: '8px',
          background: `${color}15`,
          border: `1px solid ${color}44`,
          color,
          fontSize: '12px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        {hasKey ? "Got it. I'll take it from here." : "Got it — I'll set the key first."}
      </button>

      {/* Bubble tail */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        right: '28px',
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${color}55`,
      }} />
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export default function VelmaWidget({ wallet }: { wallet?: string } = {}) {
  const {
    state, pet, witnessEvent, dismissBubble, speak, completeOnboarding,
    notifications, dismissNotification, dismissAllNotifications,
    setNotifyContext, pollNotifications,
  } = useVelma();

  const [showStats, setShowStats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Gamification state ─────────────────────────────────────────────────
  const [xpFloats, setXpFloats] = useState<{ id: number; amount: number }[]>([]);
  const [levelUpActive, setLevelUpActive] = useState(false);
  const [evolutionTier, setEvolutionTier] = useState<VisualTier | null>(null);
  const [firstWake, setFirstWake] = useState(false);

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
      }, 5000);
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
      zIndex: 1000,
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

      {/* Onboarding guide panel */}
      {showGuide && (
        <VelmaGuidePanel
          color={color}
          onClose={() => setShowGuide(false)}
          onDone={() => {
            setShowGuide(false);
            completeOnboarding();
          }}
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

      {/* Speech bubble */}
      {state.show_bubble && (
        <div
          onClick={dismissBubble}
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
            if (!state.onboarded) {
              setShowGuide(s => !s);
              setShowStats(false);
              setShowNotifications(false);
            } else {
              pet();
            }
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
          title={state.onboarded
            ? `Velma — Level ${state.level} ${getTitle(state.level)} (click to pat, right-click for ${notifications.length > 0 ? 'notifications' : 'stats'})`
            : 'Velma — click to get started'}
          style={{
            cursor: 'pointer',
            width: `${spriteSize}px`,
            height: `${spriteSize}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s ease',
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
      `}</style>
    </div>
  );
}
