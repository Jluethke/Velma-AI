import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────

interface Question {
  id: string;
  label: string;
  type: 'text';
}

interface FabricSession {
  id: string;
  title: string;
  flowSlug: string;
  hostName: string;
  questions: Question[];
  submissionDeadline?: number;
  synthesis?: { status: string };
}

type PageState = 'loading' | 'form' | 'submitting' | 'waiting' | 'done' | 'error';

// ── Mock data ─────────────────────────────────────────────────────

function useMockSession(_sessionId: string): FabricSession {
  return useMemo<FabricSession>(() => ({
    id: 'abc123',
    title: 'contract-scope-alignment',
    flowSlug: 'contract-scope-alignment',
    hostName: 'Jonathan',
    questions: [
      { id: 'budget',   label: "What's your budget range for this project?",      type: 'text' },
      { id: 'timeline', label: 'What timeline works for you?',                    type: 'text' },
      { id: 'priority', label: 'What matters most — speed, quality, or cost?',    type: 'text' },
      { id: 'concerns', label: 'Any concerns or non-negotiables going in?',        type: 'text' },
    ],
  }), []);
}

// ── Animation keyframes injected once ────────────────────────────

const KEYFRAMES = `
@keyframes fabric-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes fabric-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes fabric-pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.6); }
  50%       { box-shadow: 0 0 0 7px rgba(167,139,250,0);  }
}
@keyframes fabric-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes fabric-check-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes fabric-thread-grow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}
@keyframes fabric-spin {
  to { transform: rotate(360deg); }
}
`;

function injectKeyframes() {
  if (document.getElementById('fabric-kf')) return;
  const s = document.createElement('style');
  s.id = 'fabric-kf';
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

// ── Sub-components ────────────────────────────────────────────────

function PulseDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'var(--purple)',
      animation: 'fabric-pulse-dot 2s ease-in-out infinite',
      flexShrink: 0,
    }} />
  );
}

function ThreadLine({ visible }: { visible: boolean }) {
  return (
    <div style={{
      width: '2px',
      height: '36px',
      margin: '0 auto',
      background: 'linear-gradient(to bottom, rgba(167,139,250,0.4), rgba(167,139,250,0.1))',
      transformOrigin: 'top center',
      animation: visible ? 'fabric-thread-grow 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
      opacity: visible ? 1 : 0,
    }} />
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isActive: boolean;
  isAnswered: boolean;
  isVisible: boolean;
}

function QuestionCard({
  question, index, value, onChange, onSubmit, isActive, isAnswered, isVisible,
}: QuestionCardProps) {

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isActive && !isAnswered) {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [isActive, isAnswered]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        animation: `fabric-fade-up 0.5s cubic-bezier(0.34,1.2,0.64,1) ${isAnswered ? '0s' : '0.1s'} both`,
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: isAnswered
            ? 'rgba(167,139,250,0.04)'
            : isActive
              ? 'rgba(28,28,34,0.9)'
              : 'rgba(28,28,34,0.5)',
          border: isAnswered
            ? '1px solid rgba(167,139,250,0.2)'
            : isActive
              ? '1px solid rgba(167,139,250,0.35)'
              : '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px',
          padding: isActive && !isAnswered ? '28px 32px 24px' : '22px 28px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isActive && !isAnswered
            ? '0 0 0 1px rgba(167,139,250,0.12), 0 20px 60px rgba(0,0,0,0.25)'
            : '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Question number */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: isAnswered
              ? 'rgba(167,139,250,0.15)'
              : isActive
                ? 'rgba(167,139,250,0.12)'
                : 'rgba(255,255,255,0.04)',
            border: isAnswered
              ? '1px solid rgba(167,139,250,0.4)'
              : '1px solid rgba(167,139,250,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
            transition: 'all 0.3s ease',
          }}>
            {isAnswered ? (
              <svg
                width="13" height="13" viewBox="0 0 13 13" fill="none"
                style={{ animation: 'fabric-check-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
              >
                <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="var(--purple)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isActive ? 'var(--purple)' : 'var(--text-secondary)',
                fontFamily: '"JetBrains Mono", monospace',
                transition: 'color 0.3s ease',
              }}>
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{
              color: isAnswered
                ? 'var(--text-secondary)'
                : 'var(--text-primary)',
              fontSize: isActive && !isAnswered ? '16px' : '14px',
              fontWeight: isActive && !isAnswered ? 500 : 400,
              lineHeight: 1.6,
              margin: '0 0 ' + (isActive && !isAnswered ? '18px' : isAnswered ? '10px' : '0') + ' 0',
              transition: 'all 0.3s ease',
            }}>
              {question.label}
            </p>

            {/* Answered state: show locked answer */}
            {isAnswered && value && (
              <p style={{
                color: 'var(--purple)',
                fontSize: '14px',
                lineHeight: 1.6,
                margin: 0,
                fontStyle: 'italic',
                opacity: 0.9,
                animation: 'fabric-fade-in 0.3s ease both',
              }}>
                "{value}"
              </p>
            )}

            {/* Active state: textarea */}
            {isActive && !isAnswered && (
              <div style={{ animation: 'fabric-fade-up 0.3s ease 0.15s both' }}>
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer…"
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'rgba(9,9,11,0.6)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.7,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: '"Inter", sans-serif',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    caretColor: 'var(--purple)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(167,139,250,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(167,139,250,0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(161,161,170,0.5)',
                    letterSpacing: '0.02em',
                  }}>
                    Press <kbd style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '5px',
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}>Enter</kbd> to continue
                  </span>
                  <button
                    onClick={onSubmit}
                    disabled={!value.trim()}
                    style={{
                      background: value.trim()
                        ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))'
                        : 'rgba(255,255,255,0.04)',
                      border: value.trim()
                        ? '1px solid rgba(167,139,250,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: value.trim() ? 'var(--purple)' : 'var(--text-secondary)',
                      cursor: value.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.01em',
                    }}
                    onMouseEnter={e => {
                      if (value.trim()) {
                        (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(167,139,250,0.15))';
                        (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLButtonElement).style.background = value.trim()
                        ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))'
                        : 'rgba(255,255,255,0.04)';
                      (e.target as HTMLButtonElement).style.transform = 'none';
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────

function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  return (
    <div style={{
      height: '2px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '1px',
      overflow: 'hidden',
      marginBottom: '40px',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'linear-gradient(90deg, rgba(167,139,250,0.6), rgba(167,139,250,1))',
        borderRadius: '1px',
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

// ── Synthesis output card ─────────────────────────────────────────

function SynthesisCard({ hostName }: { hostName: string }) {
  // Simulated synthesis — in production this comes from the API
  const items = [
    { label: 'Budget alignment', value: 'Ranges overlap — room to negotiate', status: 'aligned' as const },
    { label: 'Timeline',         value: 'Both sides flexible within Q1',       status: 'aligned' as const },
    { label: 'Priority',         value: 'Host: quality · Guest: speed — discuss', status: 'tension' as const },
    { label: 'Non-negotiables',  value: 'No conflicts identified',              status: 'clear' as const },
  ];

  return (
    <div style={{ animation: 'fabric-fade-up 0.6s cubic-bezier(0.34,1.2,0.64,1) both' }}>
      <div style={{
        background: 'rgba(167,139,250,0.04)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: '20px',
        padding: '32px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M9 3l6 6-6 6" stroke="var(--purple)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px', margin: 0 }}>
              Synthesis ready
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
              Both sides are in — here's what we found
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(item => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.label}
                </p>
                <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  {item.value}
                </p>
              </div>
              <span style={{
                flexShrink: 0,
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                background: item.status === 'aligned'
                  ? 'rgba(74,222,128,0.1)'
                  : item.status === 'tension'
                    ? 'rgba(251,191,36,0.1)'
                    : 'rgba(167,139,250,0.1)',
                border: item.status === 'aligned'
                  ? '1px solid rgba(74,222,128,0.25)'
                  : item.status === 'tension'
                    ? '1px solid rgba(251,191,36,0.25)'
                    : '1px solid rgba(167,139,250,0.25)',
                color: item.status === 'aligned'
                  ? 'var(--green)'
                  : item.status === 'tension'
                    ? 'var(--gold)'
                    : 'var(--purple)',
                marginTop: '2px',
              }}>
                {item.status === 'aligned' ? 'Aligned' : item.status === 'tension' ? 'Discuss' : 'Clear'}
              </span>
            </div>
          ))}
        </div>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          lineHeight: 1.7,
          margin: '20px 0 0',
          padding: '16px',
          background: 'rgba(167,139,250,0.04)',
          border: '1px solid rgba(167,139,250,0.12)',
          borderRadius: '12px',
        }}>
          A synthesis doc has been shared with {hostName}. You're both set to start the conversation with full context.
        </p>
      </div>
    </div>
  );
}

// ── Waiting state ─────────────────────────────────────────────────

function WaitingCard({ hostName }: { hostName: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 32px',
      background: 'rgba(28,28,34,0.6)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'fabric-fade-up 0.5s ease both',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '2px solid rgba(167,139,250,0.3)',
        borderTopColor: 'var(--purple)',
        animation: 'fabric-spin 1s linear infinite',
        margin: '0 auto 20px',
      }} />
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>
        Waiting for {hostName}
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
        Your answers are in. Once {hostName} completes their side, the synthesis will appear here automatically.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function Fabric() {
  const { sessionId = 'abc123' } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');

  const session = useMockSession(sessionId);

  const [pageState, setPageState] = useState<PageState>('form');
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visibleUpTo, setVisibleUpTo] = useState(0);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  // Pre-fill answers from Discovery listing via Claude
  const handlePrefill = async () => {
    if (!listingId || prefilling) return;
    setPrefilling(true);
    try {
      const res = await fetch('/api/discovery/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          questions: session.questions.map(q => ({ id: q.id, label: q.label })),
        }),
      });
      if (!res.ok) throw new Error('prefill failed');
      const { answers: drafted } = await res.json() as { answers: Record<string, string> };
      setAnswers(drafted);
      // Reveal all questions at once in review mode
      setVisibleUpTo(session.questions.length);
      setActiveIndex(session.questions.length - 1);
      setPrefillDone(true);
    } catch {
      // silently fail — user can still fill manually
    } finally {
      setPrefilling(false);
    }
  };

  // Reveal first question after brief delay
  useEffect(() => {
    if (pageState === 'form') {
      const t = setTimeout(() => setVisibleUpTo(1), 400);
      return () => clearTimeout(t);
    }
  }, [pageState]);

  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = (index: number) => {
    const q = session.questions[index];
    const val = answers[q.id];
    if (!val?.trim()) return;

    const nextIndex = index + 1;

    if (nextIndex >= session.questions.length) {
      // All answered — submit
      handleSubmitAll();
    } else {
      setActiveIndex(nextIndex);
      setVisibleUpTo(nextIndex + 1);
      // Scroll to bottom after new card appears
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
    }
  };

  const handleSubmitAll = async () => {
    setPageState('submitting');
    try {
      // POST to API (mocked — API not yet built)
      await fetch(`/api/fabric/${session.id}/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }).catch(() => {/* API not built yet — swallow the error */});

      // Simulate waiting briefly, then show "waiting for host"
      setTimeout(() => setPageState('waiting'), 600);

      // After 4s, simulate synthesis arriving (demo only)
      setTimeout(() => setPageState('done'), 4600);
    } catch {
      setPageState('error');
    }
  };

  const titleFormatted = session.title
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
    }}>

      {/* Purple glow backdrop specific to Fabric pages */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '560px',
        margin: '0 auto',
        padding: '0 20px 80px',
      }}>

        {/* ── Header ── */}
        <div style={{
          paddingTop: '48px',
          paddingBottom: '40px',
          animation: 'fabric-fade-up 0.5s ease both',
        }}>
          {/* "You've been invited" pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: '20px',
            padding: '5px 14px 5px 10px',
            marginBottom: '24px',
          }}>
            <PulseDot />
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--purple)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              You've been invited to a Fabric
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            margin: '0 0 12px',
          }}>
            {titleFormatted}
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '15px',
            lineHeight: 1.7,
            margin: '0 0 6px',
          }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{session.hostName}</span>
            {' '}invited you to align on this together. Answer {session.questions.length} quick questions — no account needed.
          </p>

          {/* Pre-fill from Discovery listing */}
          {listingId && !prefillDone && pageState === 'form' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '10px',
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '12px', padding: '12px 16px', marginTop: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>✦</span>
                <div>
                  <p style={{ color: 'var(--purple)', fontWeight: 700, fontSize: '13px', margin: '0 0 2px' }}>
                    Claude can draft your answers
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                    From your Discovery listing — review before submitting
                  </p>
                </div>
              </div>
              <button
                onClick={handlePrefill}
                disabled={prefilling}
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))',
                  border: '1px solid rgba(167,139,250,0.4)',
                  borderRadius: '9px', padding: '8px 14px',
                  fontSize: '12px', fontWeight: 700, color: 'var(--purple)',
                  cursor: prefilling ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}
              >
                {prefilling ? (
                  <>
                    <span style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--purple)',
                      animation: 'fabric-spin 0.8s linear infinite', display: 'inline-block',
                    }} />
                    Drafting…
                  </>
                ) : 'Draft my answers →'}
              </button>
            </div>
          )}

          {/* Pre-fill done banner */}
          {prefillDone && pageState === 'form' && (
            <div style={{
              background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '12px', padding: '10px 14px', marginTop: '16px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ color: 'var(--green)', fontSize: '12px', fontWeight: 600, margin: 0 }}>
                Claude drafted your answers — review each one and edit anything before submitting.
              </p>
            </div>
          )}

          {/* Host attribution */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.4), rgba(56,189,248,0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              {session.hostName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              From <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{session.hostName}</span> via FlowFabric
            </span>
          </div>
        </div>

        {/* ── Deadline banner ── */}
        {session.submissionDeadline && (pageState === 'form' || pageState === 'submitting') && session.synthesis?.status !== 'complete' && (() => {
          const remaining = session.submissionDeadline - Date.now();
          const hours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
          const isUrgent = remaining < 4 * 60 * 60 * 1000;
          return (
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: isUrgent ? 'var(--red, #ef4444)' : 'var(--gold)',
              padding: '4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>{isUrgent ? '\u26a0' : '\u23f1'}</span>
              <span>Submit within {hours}h or this session expires</span>
            </div>
          );
})()}

        {/* ── Progress bar ── */}
        {pageState === 'form' && (
          <ProgressBar answered={answeredCount} total={session.questions.length} />
        )}

        {/* ── Form state ── */}
        {pageState === 'form' && (
          <div>
            {session.questions.map((q, i) => (
              <div key={q.id}>
                <QuestionCard
                  question={q}
                  index={i}

                  value={answers[q.id] ?? ''}
                  onChange={val => handleAnswer(q.id, val)}
                  onSubmit={() => handleNext(i)}
                  isActive={i === activeIndex}
                  isAnswered={!!answers[q.id] && i < activeIndex}
                  isVisible={i < visibleUpTo}
                />
                {/* Thread connector between cards */}
                {i < session.questions.length - 1 && i < visibleUpTo - 1 && (
                  <ThreadLine visible={i < visibleUpTo - 1} />
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}

        {/* ── Submitting state ── */}
        {pageState === 'submitting' && (
          <div style={{
            textAlign: 'center',
            padding: '64px 32px',
            animation: 'fabric-fade-in 0.4s ease both',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '2px solid rgba(167,139,250,0.3)',
              borderTopColor: 'var(--purple)',
              animation: 'fabric-spin 0.8s linear infinite',
              margin: '0 auto 20px',
            }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
              Sending your answers…
            </p>
          </div>
        )}

        {/* ── Waiting for host ── */}
        {pageState === 'waiting' && (
          <WaitingCard hostName={session.hostName} />
        )}

        {/* ── Synthesis done ── */}
        {pageState === 'done' && (
          <SynthesisCard hostName={session.hostName} />
        )}

        {/* ── Error state ── */}
        {pageState === 'error' && (
          <div style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: 'rgba(248,113,113,0.05)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: '20px',
            animation: 'fabric-fade-up 0.4s ease both',
          }}>
            <p style={{ color: 'var(--red)', fontWeight: 600, margin: '0 0 8px', fontSize: '16px' }}>
              Something went wrong
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
              Couldn't submit your answers. Please try again.
            </p>
            <button
              onClick={() => setPageState('form')}
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '10px',
                padding: '10px 20px',
                color: 'var(--red)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── CTA footer ── */}
        <div style={{
          marginTop: '56px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          animation: 'fabric-fade-up 0.5s ease 0.3s both',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                margin: '0 0 2px',
                lineHeight: 1.5,
              }}>
                Want to run your own flows?
              </p>
              <p style={{
                color: 'rgba(161,161,170,0.6)',
                fontSize: '12px',
                margin: 0,
              }}>
                FlowFabric has 165+ flows for decisions, contracts, and more.
              </p>
            </div>
            <Link
              to="/get-started"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.08))',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--purple)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.12))';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(167,139,250,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.08))';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
              }}
            >
              Start free →
            </Link>
          </div>

          {/* Branding */}
          <p style={{
            textAlign: 'center',
            color: 'rgba(161,161,170,0.35)',
            fontSize: '11px',
            marginTop: '28px',
            letterSpacing: '0.02em',
          }}>
            Powered by{' '}
            <Link to="/" style={{ color: 'rgba(167,139,250,0.5)', textDecoration: 'none' }}>
              FlowFabric
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
