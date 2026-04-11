import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useVelma } from '../contexts/VelmaContext';

// ── Types ─────────────────────────────────────────────────────────

interface Question {
  id: string;
  label: string;
  type: 'text';
}

type PageState = 'loading' | 'form' | 'submitting' | 'waiting' | 'done' | 'error';

// ── Flow questions registry ───────────────────────────────────────
// Questions are defined per flow slug. Any flow not listed falls back
// to the universal alignment set.

const UNIVERSAL_QUESTIONS: Question[] = [
  { id: 'goals',     label: 'What are your main goals for this session?',          type: 'text' },
  { id: 'context',   label: 'Give me the relevant context — situation, background.', type: 'text' },
  { id: 'needs',     label: 'What do you need from the other party?',              type: 'text' },
  { id: 'concerns',  label: 'Any concerns or non-negotiables going in?',           type: 'text' },
];

const FLOW_QUESTIONS: Record<string, Question[]> = {
  'contract-scope-alignment': [
    { id: 'budget',    label: 'What is your budget range for this project?',       type: 'text' },
    { id: 'timeline',  label: 'What timeline works for you?',                      type: 'text' },
    { id: 'priority',  label: 'What matters most \u2014 speed, quality, or cost?', type: 'text' },
    { id: 'concerns',  label: 'Any concerns or non-negotiables going in?',         type: 'text' },
  ],
  'co-founder-alignment': [
    { id: 'vision',    label: 'What is your vision for the company in 5 years?',   type: 'text' },
    { id: 'role',      label: 'What role do you want to own long-term?',           type: 'text' },
    { id: 'equity',    label: 'What split feels fair to you and why?',             type: 'text' },
    { id: 'dealbreak', label: 'What would make you walk away from this partnership?', type: 'text' },
  ],
  'salary-negotiation': [
    { id: 'target',    label: 'What compensation are you targeting (base + equity)?', type: 'text' },
    { id: 'batna',     label: 'What is your best alternative if this does not work out?', type: 'text' },
    { id: 'priorities', label: 'Beyond base salary, what matters most to you?',    type: 'text' },
    { id: 'timeline',  label: 'When do you need a decision by?',                   type: 'text' },
  ],
  'kitchen-renovation': [
    { id: 'budget',    label: 'What is your total budget for the renovation?',     type: 'text' },
    { id: 'scope',     label: 'Describe the scope \u2014 what stays, what changes?', type: 'text' },
    { id: 'timeline',  label: 'When do you need it complete?',                     type: 'text' },
    { id: 'style',     label: 'What is your style vision? Any reference images or keywords?', type: 'text' },
  ],
  'freelance-brief': [
    { id: 'deliverable', label: 'What exactly are you delivering?',                type: 'text' },
    { id: 'rate',      label: 'What is your rate and preferred payment structure?', type: 'text' },
    { id: 'timeline',  label: 'What is your available timeline for this project?', type: 'text' },
    { id: 'terms',     label: 'Any specific terms, IP ownership, or revision limits?', type: 'text' },
  ],
};

function getQuestionsForFlow(flowSlug: string): Question[] {
  return FLOW_QUESTIONS[flowSlug] ?? UNIVERSAL_QUESTIONS;
}

// ── Real session API ──────────────────────────────────────────────

interface LiveSession {
  id: string;
  flowSlug: string;
  title?: string;
  submissionDeadline?: number;
  synthesis: { status: string; output?: string };
  host: { submitted: boolean };
  guests: { submitted: boolean }[];
  maxGuests?: number;
}

async function fetchSession(sessionId: string): Promise<LiveSession | null> {
  try {
    const res = await fetch(`/api/fabric/${sessionId}`);
    if (!res.ok) return null;
    return await res.json() as LiveSession;
  } catch {
    return null;
  }
}

const PROXY_URL = 'http://localhost:8082';

async function proxyAvailable(): Promise<boolean> {
  try {
    const r = await fetch(`${PROXY_URL}/v1/models`, { signal: AbortSignal.timeout(1500) });
    return r.ok || r.status === 404; // proxy is up even if endpoint unknown
  } catch {
    return false;
  }
}

async function triggerSynthesis(sessionId: string, hostToken: string): Promise<void> {
  // 1. Fetch the assembled prompt from the server
  const promptRes = await fetch(`/api/fabric/${sessionId}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostToken }),
  });
  if (!promptRes.ok) throw new Error(`prompt_fetch_${promptRes.status}`);
  const { systemPrompt, userPrompt, model, max_tokens } =
    await promptRes.json() as { systemPrompt: string; userPrompt: string; model: string; max_tokens: number };

  // 2. Run synthesis locally via claude-code-proxy
  const claudeRes = await fetch(`${PROXY_URL}/v1/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'local' },
    body: JSON.stringify({
      model,
      max_tokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!claudeRes.ok) throw new Error(`proxy_${claudeRes.status}`);
  const claudeData = await claudeRes.json() as { content?: Array<{ type: string; text: string }> };
  const output = claudeData.content?.find(b => b.type === 'text')?.text ?? '';
  if (!output) throw new Error('empty_output');

  // 3. Save the result back to the server
  const saveRes = await fetch(`/api/fabric/${sessionId}/save-synthesis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostToken, output }),
  });
  if (!saveRes.ok) throw new Error(`save_${saveRes.status}`);
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

function SynthesisCard({ output }: { output: string }) {
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
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
              Claude mediated both sides \u2014 here is what was found
            </p>
          </div>
        </div>

        {/* Real synthesis output from Claude — rendered as plain text with line breaks */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px', padding: '20px',
          color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.8,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {output}
        </div>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7,
          margin: '20px 0 0', padding: '16px',
          background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)',
          borderRadius: '12px',
        }}>
          Neither party\u2019s raw answers were shared \u2014 only this synthesis. Your private inputs stayed private.
        </p>
      </div>
    </div>
  );
}

// ── Guest done state (no synthesis — host only) ───────────────────

function GuestDoneCard() {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 32px',
      background: 'rgba(28,28,34,0.6)', border: '1px solid var(--border)',
      borderRadius: '20px', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', animation: 'fabric-fade-up 0.5s ease both',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: '22px',
      }}>
        ✓
      </div>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>
        You're done
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
        Your answers were submitted privately. The host will receive the neutral analysis — your raw answers are never shared.
      </p>
    </div>
  );
}

// ── Waiting state ─────────────────────────────────────────────────

function WaitingCard({ hostName }: { hostName: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 32px',
      background: 'rgba(28,28,34,0.6)', border: '1px solid var(--border)',
      borderRadius: '20px', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', animation: 'fabric-fade-up 0.5s ease both',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--purple)',
        animation: 'fabric-spin 1s linear infinite', margin: '0 auto 20px',
      }} />
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>
        Waiting for {hostName}
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
        Your answers are in. Claude will synthesise both sides the moment the other party submits \u2014 this page updates automatically.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function Fabric() {
  const { witnessEvent } = useVelma();
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const listingId   = searchParams.get('listingId');
  const hostToken   = searchParams.get('hostToken');
  const guestToken  = searchParams.get('guestToken');
  const isHost      = !!hostToken;

  // ── Live session state ──────────────────────────────────────────
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setSessionLoading(false); return; }
    fetchSession(sessionId).then(s => {
      setLiveSession(s);
      setSessionLoading(false);
      // If synthesis is already complete when the page loads, go straight to done
      if (s?.synthesis?.status === 'complete') setPageState('done');
    });
  }, [sessionId]);

  // Derive questions and display title from live session
  const questions = liveSession ? getQuestionsForFlow(liveSession.flowSlug) : UNIVERSAL_QUESTIONS;
  const session = {
    id: liveSession?.id ?? sessionId,
    title: liveSession?.title ?? liveSession?.flowSlug ?? 'Fabric Session',
    flowSlug: liveSession?.flowSlug ?? '',
    hostName: 'the host',
    questions,
    submissionDeadline: liveSession?.submissionDeadline,
    synthesis: liveSession?.synthesis,
  };

  const [pageState, setPageState] = useState<PageState>('loading');
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visibleUpTo, setVisibleUpTo] = useState(0);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);
  const [synthesisOutput, setSynthesisOutput] = useState('');
  const [synthError, setSynthError] = useState<'no_proxy' | 'failed' | null>(null);
  const [proxyChecked, setProxyChecked] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  // Transition from loading → form once session is ready
  useEffect(() => {
    if (!sessionLoading && pageState === 'loading') {
      if (liveSession?.synthesis?.status === 'complete') {
        setSynthesisOutput(liveSession.synthesis.output ?? '');
        setPageState('done');
      } else {
        setPageState('form');
      }
    }
  }, [sessionLoading, liveSession, pageState]);

  // ── Polling — runs after submit until synthesis is complete ──────
  const startPolling = () => {
    if (pollRef.current) return;
    // Give up after 3 minutes
    const deadline = Date.now() + 3 * 60 * 1000;

    pollRef.current = setInterval(async () => {
      if (Date.now() > deadline) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setSynthError('failed');
        setPageState('error');
        return;
      }

      const updated = await fetchSession(sessionId);
      if (!updated) return;
      setLiveSession(updated);

      const status = updated.synthesis?.status;

      // Host auto-triggers synthesis when both sides are ready
      if (isHost && hostToken && status === 'ready') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        witnessEvent('synthesis_triggered', 'synthesis_triggered', 'synthesis_triggered');
        // Check proxy before attempting
        const up = await proxyAvailable();
        setProxyChecked(true);
        if (!up) {
          setSynthError('no_proxy');
          setPageState('error');
          return;
        }
        try {
          await triggerSynthesis(sessionId, hostToken);
        } catch {
          setSynthError('failed');
          setPageState('error');
          return;
        }
        // Re-poll to pick up the completed synthesis — 2-minute inner deadline
        const innerDeadline = Date.now() + 2 * 60 * 1000;
        pollRef.current = setInterval(async () => {
          if (Date.now() > innerDeadline) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setSynthError('failed');
            setPageState('error');
            return;
          }
          const final = await fetchSession(sessionId);
          if (final?.synthesis?.status === 'complete') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setSynthesisOutput(final.synthesis.output ?? '');
            setPageState('done');
          }
        }, 3000);
        return;
      }

      if (status === 'complete') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setSynthesisOutput(updated.synthesis.output ?? '');
        setPageState('done');
      }
    }, 5000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
      void handleSubmitAll();
    } else {
      setActiveIndex(nextIndex);
      setVisibleUpTo(nextIndex + 1);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
    }
  };

  const handleSubmitAll = async () => {
    setPageState('submitting');
    try {
      const endpoint = isHost
        ? `/api/fabric/${sessionId}/host`
        : `/api/fabric/${sessionId}/guest`;

      const token = isHost ? hostToken : guestToken;
      const tokenKey = isHost ? 'hostToken' : 'guestToken';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [tokenKey]: token, data: answers }),
      });

      if (!res.ok) throw new Error('submit failed');
      const result = await res.json() as { readyForSynthesis?: boolean };

      witnessEvent('answers_submitted', 'answers_submitted', 'answers_submitted');

      // If both sides are already in, host triggers synthesis immediately
      if (isHost && hostToken && result.readyForSynthesis) {
        setPageState('waiting');
        witnessEvent('synthesis_triggered', 'synthesis_triggered', 'synthesis_triggered');
        const up = await proxyAvailable();
        setProxyChecked(true);
        if (!up) {
          setSynthError('no_proxy');
          setPageState('error');
          return;
        }
        try {
          await triggerSynthesis(sessionId, hostToken);
        } catch {
          setSynthError('failed');
          setPageState('error');
          return;
        }
        startPolling();
      } else {
        setPageState('waiting');
        startPolling();
      }
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

        {/* ── Waiting ── */}
        {pageState === 'waiting' && (
          <WaitingCard hostName={isHost ? 'the other party' : session.hostName} />
        )}

        {/* ── Synthesis done ── */}
        {pageState === 'done' && (
          isHost
            ? <SynthesisCard output={synthesisOutput || 'Synthesis complete \u2014 both sides submitted.'} />
            : <GuestDoneCard />
        )}

        {/* ── Error state ── */}
        {pageState === 'error' && (
          <div style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: synthError === 'no_api_key' ? 'rgba(167,139,250,0.04)' : 'rgba(248,113,113,0.05)',
            border: `1px solid ${synthError === 'no_api_key' ? 'rgba(167,139,250,0.25)' : 'rgba(248,113,113,0.2)'}`,
            borderRadius: '20px',
            animation: 'fabric-fade-up 0.4s ease both',
          }}>
            {synthError === 'no_proxy' ? (
              <>
                <p style={{ color: 'var(--purple)', fontWeight: 700, margin: '0 0 8px', fontSize: '16px' }}>
                  Start your Claude proxy
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px', lineHeight: 1.6 }}>
                  Both answers are saved. Synthesis runs on your Claude plan — open a terminal and run:
                </p>
                <div style={{
                  background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                  fontFamily: '"JetBrains Mono", monospace', fontSize: '13px',
                  color: 'var(--purple)', textAlign: 'left',
                }}>
                  npx claude-code-proxy
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 20px' }}>
                  Then come back and click below.
                </p>
                <button
                  onClick={() => { setSynthError(null); setProxyChecked(false); startPolling(); }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))',
                    border: '1px solid rgba(167,139,250,0.4)',
                    borderRadius: '10px', padding: '10px 20px',
                    color: 'var(--purple)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Try again →
                </button>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--red)', fontWeight: 600, margin: '0 0 8px', fontSize: '16px' }}>
                  Something went wrong
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
                  Couldn't submit your answers. Please try again.
                </p>
                <button
                  onClick={() => { setSynthError(null); setPageState('form'); }}
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
              </>
            )}
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
