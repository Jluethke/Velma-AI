/**
 * FlowRunner — production flow execution overlay.
 * Replaces SkillRunner with phase-by-phase execution, structured inputs,
 * a vertical progress stepper, and streaming AI output per phase.
 */
import { useEffect, useMemo } from 'react';
import { useFlowRunner } from '../hooks/useFlowRunner';
import Badge from './Badge';

interface FlowRunnerProps {
  skillName: string;
  skillDescription: string;
  skillContent: string;
  skillManifest: Record<string, unknown>;
  domain?: string;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Markdown-lite renderer: bold, headings, lists, line breaks        */
/* ------------------------------------------------------------------ */
function RichText({ text }: { text: string }) {
  const html = useMemo(() => {
    let out = text
      // escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // headings
      .replace(/^#### (.+)$/gm, '<h4 style="margin:12px 0 4px;font-size:0.85rem;color:var(--text-primary)">$1</h4>')
      .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 4px;font-size:0.9rem;color:var(--cyan)">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="margin:16px 0 6px;font-size:0.95rem;color:var(--cyan)">$1</h2>')
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      // italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // unordered list items
      .replace(/^(\s*)[-*] (.+)$/gm, '$1<li style="margin-left:16px;list-style:disc;margin-bottom:2px">$2</li>')
      // ordered list items
      .replace(/^(\s*)\d+\.\s+(.+)$/gm, '$1<li style="margin-left:16px;list-style:decimal;margin-bottom:2px">$2</li>')
      // line breaks (double newline → paragraph break)
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return out;
  }, [text]);

  return (
    <div
      className="text-sm leading-relaxed"
      style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Stepper                                                   */
/* ------------------------------------------------------------------ */
function PhaseStepper({
  phases,
  currentIndex,
  phaseResults,
}: {
  phases: { number: number; name: string }[];
  currentIndex: number;
  phaseResults: Map<number, string>;
}) {
  return (
    <div className="flex flex-col gap-0">
      {phases.map((phase, i) => {
        const isDone = phaseResults.has(i);
        const isCurrent = i === currentIndex && !isDone;
        const isUpcoming = i > currentIndex && !isDone;

        return (
          <div key={i} className="flex items-start gap-3" style={{ minHeight: 40 }}>
            {/* Connector line + circle */}
            <div className="flex flex-col items-center" style={{ width: 28 }}>
              <div
                className="flex items-center justify-center rounded-full shrink-0 transition-all"
                style={{
                  width: 28,
                  height: 28,
                  border: isDone
                    ? '2px solid var(--green)'
                    : isCurrent
                    ? '2px solid var(--cyan)'
                    : '2px solid var(--border)',
                  background: isDone
                    ? 'rgba(34,197,94,0.15)'
                    : isCurrent
                    ? 'rgba(0,255,200,0.1)'
                    : 'transparent',
                  ...(isCurrent ? { boxShadow: '0 0 12px rgba(0,255,200,0.25)' } : {}),
                }}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: isCurrent ? 'var(--cyan)' : 'var(--text-secondary)',
                      opacity: isUpcoming ? 0.4 : 1,
                    }}
                  >
                    {phase.number}
                  </span>
                )}
              </div>
              {i < phases.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 12,
                    background: isDone ? 'var(--green)' : 'var(--border)',
                    opacity: isDone ? 0.5 : 0.3,
                  }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-sm font-medium pt-0.5"
              style={{
                color: isDone
                  ? 'var(--green)'
                  : isCurrent
                  ? 'var(--cyan)'
                  : 'var(--text-secondary)',
                opacity: isUpcoming ? 0.4 : 1,
              }}
            >
              {phase.name}
              {isCurrent && (
                <span
                  className="ml-2 text-xs"
                  style={{ color: 'var(--cyan)', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                >
                  running...
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main FlowRunner Component                                          */
/* ------------------------------------------------------------------ */
export default function FlowRunner({
  skillName,
  skillDescription,
  skillContent,
  skillManifest,
  domain,
  onClose,
}: FlowRunnerProps) {
  const {
    state,
    initialize,
    setInputValue,
    goToInputs,
    startExecution,
    stop,
    reset,
    requiredInputsFilled,
  } = useFlowRunner();

  // Initialize on mount
  useEffect(() => {
    initialize(skillName, skillDescription, skillContent, skillManifest);
  }, [skillName]);

  const def = state.definition;
  const hasInputs = def && def.inputs.length > 0;

  // Current streaming text for the active phase
  const activeStreamText = state.phaseStreaming.get(state.currentPhaseIndex) || '';

  return (
    <div
      className="fixed inset-0 z-[998] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl flex flex-col animate-fade-in-up"
        style={{
          maxHeight: '100vh',
          height: '100dvh',
          borderTop: '2px solid rgba(0,255,200,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(0,255,200,0.04), rgba(170,136,255,0.04))',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold gradient-text">{skillName}</span>
            {domain && <Badge label={domain} variant="domain" />}
            <span
              className="text-xs"
              style={{
                color:
                  state.stage === 'running'
                    ? 'var(--cyan)'
                    : state.stage === 'complete'
                    ? 'var(--green)'
                    : state.stage === 'error'
                    ? 'var(--red)'
                    : 'var(--text-secondary)',
                ...(state.stage === 'running'
                  ? { animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }
                  : {}),
              }}
            >
              {state.stage === 'overview'
                ? 'overview'
                : state.stage === 'inputs'
                ? 'collecting inputs'
                : state.stage === 'running'
                ? `phase ${state.currentPhaseIndex + 1}/${def?.phases.length || 0}`
                : state.stage === 'complete'
                ? 'complete'
                : 'error'}
            </span>
          </div>
          <div className="flex gap-2">
            {state.stage === 'running' && (
              <button
                onClick={stop}
                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' }}
              >
                Stop
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ minHeight: 0 }}>
          {/* ---- OVERVIEW STAGE ---- */}
          {state.stage === 'overview' && def && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Description */}
              <div>
                <h2
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  About this flow
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {def.description}
                </p>
              </div>

              {/* Phases preview */}
              <div>
                <h2
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Phases ({def.phases.length})
                </h2>
                <div className="space-y-2">
                  {def.phases.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                      style={{
                        background: 'rgba(136,136,170,0.06)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span
                        className="text-xs font-bold shrink-0 w-6 h-6 flex items-center justify-center rounded-full"
                        style={{
                          background: 'rgba(0,255,200,0.1)',
                          color: 'var(--cyan)',
                          border: '1px solid rgba(0,255,200,0.2)',
                        }}
                      >
                        {p.number}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inputs preview */}
              {hasInputs && (
                <div>
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Required Inputs
                  </h2>
                  <ul className="space-y-1">
                    {def.inputs.map(inp => (
                      <li key={inp.name} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{inp.name}</span>
                        {!inp.required && (
                          <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
                            (optional)
                          </span>
                        )}
                        {inp.description && <> &mdash; {inp.description}</>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Start button */}
              <button
                onClick={() => (hasInputs ? goToInputs() : startExecution())}
                className="btn-primary px-8 py-3 text-sm font-semibold cursor-pointer w-full sm:w-auto"
                style={{ color: 'var(--cyan)' }}
              >
                {hasInputs ? 'Provide Inputs' : 'Start Flow'}
              </button>
            </div>
          )}

          {/* ---- INPUTS STAGE ---- */}
          {state.stage === 'inputs' && def && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <h2
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Flow Inputs
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Provide the information needed to run this flow. Fields marked with * are required.
                </p>
              </div>

              <div className="space-y-4">
                {def.inputs.map(inp => (
                  <div key={inp.name}>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {inp.name}
                      {inp.required && (
                        <span className="ml-1" style={{ color: 'var(--red)' }}>*</span>
                      )}
                    </label>
                    {inp.description && (
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {inp.description}
                      </p>
                    )}
                    <textarea
                      value={state.inputValues.get(inp.name) || ''}
                      onChange={e => setInputValue(inp.name, e.target.value)}
                      placeholder={`Enter ${inp.name}...`}
                      rows={inp.type === 'object' || inp.type === 'array' ? 4 : 2}
                      className="w-full"
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => reset()}
                  className="btn-secondary px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Back
                </button>
                <button
                  onClick={startExecution}
                  disabled={!requiredInputsFilled}
                  className={`px-8 py-3 text-sm font-semibold cursor-pointer ${
                    requiredInputsFilled ? 'btn-primary' : ''
                  }`}
                  style={{
                    ...(requiredInputsFilled
                      ? { color: 'var(--cyan)' }
                      : {
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          cursor: 'not-allowed',
                        }),
                  }}
                >
                  Start Flow
                </button>
              </div>
            </div>
          )}

          {/* ---- RUNNING STAGE ---- */}
          {state.stage === 'running' && def && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Stepper */}
              <PhaseStepper
                phases={def.phases}
                currentIndex={state.currentPhaseIndex}
                phaseResults={state.phaseResults}
              />

              {/* Phase outputs */}
              <div className="space-y-4 mt-4">
                {def.phases.map((phase, i) => {
                  const result = state.phaseResults.get(i);
                  const isStreaming = i === state.currentPhaseIndex && !result;
                  const streamText = isStreaming ? activeStreamText : null;

                  if (!result && !isStreaming) return null;

                  return (
                    <div
                      key={i}
                      className="rounded-xl p-4"
                      style={{
                        background: 'rgba(136,136,170,0.04)',
                        border: `1px solid ${result ? 'rgba(34,197,94,0.2)' : 'rgba(0,255,200,0.2)'}`,
                      }}
                    >
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: result ? 'var(--green)' : 'var(--cyan)' }}
                      >
                        Phase {phase.number}: {phase.name}
                        {result && ' -- Done'}
                      </h3>
                      <RichText text={result || streamText || ''} />
                      {isStreaming && !streamText && (
                        <div
                          className="text-xs mt-2"
                          style={{
                            color: 'var(--cyan)',
                            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                          }}
                        >
                          Generating...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- COMPLETE STAGE ---- */}
          {state.stage === 'complete' && def && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Success banner */}
              <div
                className="rounded-xl p-5 text-center"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <div className="text-2xl mb-2">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ display: 'inline' }}>
                    <circle cx="18" cy="18" r="17" stroke="var(--green)" strokeWidth="2" fill="rgba(34,197,94,0.1)"/>
                    <path d="M10 18L16 24L26 12" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--green)' }}>
                  Flow Complete
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  All {def.phases.length} phases executed successfully
                </p>
              </div>

              {/* Stepper — all done */}
              <PhaseStepper
                phases={def.phases}
                currentIndex={def.phases.length}
                phaseResults={state.phaseResults}
              />

              {/* Phase results */}
              <div className="space-y-4">
                {def.phases.map((phase, i) => {
                  const result = state.phaseResults.get(i);
                  if (!result) return null;
                  return (
                    <details
                      key={i}
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: 'rgba(136,136,170,0.04)',
                        border: '1px solid rgba(34,197,94,0.15)',
                      }}
                    >
                      <summary
                        className="px-4 py-3 cursor-pointer text-sm font-medium flex items-center gap-2"
                        style={{ color: 'var(--green)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Phase {phase.number}: {phase.name}
                      </summary>
                      <div className="px-4 pb-4">
                        <RichText text={result} />
                      </div>
                    </details>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="btn-primary px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{ color: 'var(--cyan)' }}
                >
                  Run Again
                </button>
                <button
                  onClick={onClose}
                  className="btn-secondary px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ---- ERROR STAGE ---- */}
          {state.stage === 'error' && (
            <div className="space-y-5 animate-fade-in-up">
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--red)' }}>
                  Flow Error
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {state.error || 'An unknown error occurred'}
                </p>
              </div>

              {/* Show any completed phase results */}
              {state.phaseResults.size > 0 && def && (
                <div className="space-y-3">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Completed phases
                  </h3>
                  {def.phases.map((phase, i) => {
                    const result = state.phaseResults.get(i);
                    if (!result) return null;
                    return (
                      <details
                        key={i}
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: 'rgba(136,136,170,0.04)',
                          border: '1px solid rgba(34,197,94,0.15)',
                        }}
                      >
                        <summary
                          className="px-4 py-3 cursor-pointer text-sm font-medium"
                          style={{ color: 'var(--green)' }}
                        >
                          Phase {phase.number}: {phase.name}
                        </summary>
                        <div className="px-4 pb-4">
                          <RichText text={result} />
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="btn-primary px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{ color: 'var(--cyan)' }}
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="btn-secondary px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile full-screen */}
      <style>{`
        @media (max-width: 639px) {
          .glass-card[style] {
            border-radius: 0 !important;
            max-height: 100dvh !important;
            height: 100dvh !important;
          }
        }
      `}</style>
    </div>
  );
}
