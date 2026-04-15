/**
 * OnboardingGuide — Velma-narrated step-by-step intro for first-time users.
 * Floats bottom-right. Steps animate in ("raise") as the previous one completes.
 * Disappears once all 3 steps are done, or when the user dismisses it.
 */
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useVelma } from '../contexts/VelmaContext';

const STORAGE_KEY = 'flowfabric-onboarding-v1';

interface OBState {
  dismissed: boolean;
  visitedExplore: boolean;
  ranFlow: boolean;
  openedVelma: boolean;
}

function load(): OBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as OBState;
  } catch { /* ignore */ }
  return { dismissed: false, visitedExplore: false, ranFlow: false, openedVelma: false };
}
function save(s: OBState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

const STEPS = [
  {
    id: 'explore',
    emoji: '🔍',
    title: 'Find your first flow',
    detail: 'Browse 165+ AI flows — pick one that fits your situation.',
    cta: 'Browse flows →',
    to: '/explore',
  },
  {
    id: 'run',
    emoji: '⚡',
    title: 'Run it',
    detail: 'Answer the prompts. The AI does the heavy lifting.',
    cta: null,
    to: null,
  },
  {
    id: 'velma',
    emoji: '✨',
    title: 'Track your progress',
    detail: 'Click the Velma icon (bottom-right) — she tracks your XP and level.',
    cta: null,
    to: null,
  },
] as const;

export default function OnboardingGuide() {
  const location = useLocation();
  const { state: velmaState } = useVelma();

  const [obs, setObs] = useState<OBState>(load);
  const [visible, setVisible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Delay first appearance — don't interrupt page load
  useEffect(() => {
    const s = load();
    if (!s.dismissed) {
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  // Step 1: visited /explore or /flow/*
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/explore') || p.startsWith('/flow/') || p.startsWith('/skill/')) {
      setObs(prev => {
        if (prev.visitedExplore) return prev;
        const next = { ...prev, visitedExplore: true };
        save(next);
        return next;
      });
    }
  }, [location.pathname]);

  // Step 2: ran a flow (Velma tracks flows_run)
  useEffect(() => {
    if (velmaState.flows_run > 0) {
      setObs(prev => {
        if (prev.ranFlow) return prev;
        const next = { ...prev, ranFlow: true };
        save(next);
        return next;
      });
    }
  }, [velmaState.flows_run]);

  // Step 3: opened Velma (pats > 0 means they clicked her)
  useEffect(() => {
    if (velmaState.pats > 0) {
      setObs(prev => {
        if (prev.openedVelma) return prev;
        const next = { ...prev, openedVelma: true };
        save(next);
        return next;
      });
    }
  }, [velmaState.pats]);

  // Celebrate then auto-dismiss when all done
  useEffect(() => {
    if (obs.visitedExplore && obs.ranFlow && obs.openedVelma && !obs.dismissed) {
      setCelebrating(true);
      const t = setTimeout(() => {
        const next = { ...obs, dismissed: true };
        save(next);
        setObs(next);
        setVisible(false);
      }, 3500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obs.visitedExplore, obs.ranFlow, obs.openedVelma]);

  const dismiss = () => {
    const next = { ...obs, dismissed: true };
    save(next);
    setObs(next);
    setVisible(false);
  };

  if (!visible || obs.dismissed) return null;

  const done = [obs.visitedExplore, obs.ranFlow, obs.openedVelma];
  const completedCount = done.filter(Boolean).length;
  const currentStep = done.findIndex(v => !v); // -1 when all done

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '76px',
        right: '16px',
        width: '272px',
        zIndex: 996,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'none',
      }}
    >
      {/* Header strip */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '9px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'all',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          animation: 'fadeInUp 0.4s ease both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '15px' }}>🤖</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan)' }}>
            {celebrating
              ? "You're all set! 🎉"
              : `Getting started · ${completedCount}/3`}
          </span>
        </div>
        {!celebrating && (
          <button
            onClick={dismiss}
            aria-label="Dismiss guide"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: '16px', lineHeight: 1, padding: '1px 5px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Step cards — only completed steps + the current active one */}
      {STEPS.map((step, i) => {
        const isComplete = done[i];
        const isActive = i === currentStep;

        // Don't render future steps yet
        if (!isComplete && !isActive) return null;

        return (
          <div
            key={step.id}
            style={{
              background: isActive ? 'rgba(0,255,200,0.04)' : 'var(--bg-card)',
              border: `1px solid ${isActive ? 'rgba(0,255,200,0.22)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '9px 11px',
              pointerEvents: 'all',
              boxShadow: isActive
                ? '0 2px 16px rgba(0,255,200,0.08)'
                : '0 1px 8px rgba(0,0,0,0.18)',
              // "raises" into view when it first becomes active
              animation: isActive ? 'onboarding-raise 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
              opacity: isComplete ? 0.55 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>
                {isComplete ? '✓' : step.emoji}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px', fontWeight: 700, lineHeight: 1.3,
                    color: isComplete ? 'var(--green)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: isComplete ? 'line-through' : 'none',
                  }}
                >
                  {step.title}
                </div>
                {isActive && (
                  <div
                    style={{
                      fontSize: '10.5px', color: 'var(--text-secondary)',
                      marginTop: '3px', lineHeight: 1.45,
                    }}
                  >
                    {step.detail}
                  </div>
                )}
              </div>
            </div>

            {isActive && step.cta && step.to && (
              <Link
                to={step.to}
                style={{
                  display: 'block', marginTop: '8px', textAlign: 'center',
                  padding: '5px 8px', borderRadius: '7px',
                  fontSize: '10.5px', fontWeight: 700,
                  background: 'rgba(0,255,200,0.10)',
                  border: '1px solid rgba(0,255,200,0.22)',
                  color: 'var(--cyan)', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                {step.cta}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
