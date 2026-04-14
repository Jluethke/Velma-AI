import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchChains, useChains, type ChainMatch } from '../hooks/useChains';
import { useChainRunner } from '../hooks/useChainRunner';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// ── Constants ────────────────────────────────────────────────────────

const PLACEHOLDER_EXAMPLES = [
  'I need help budgeting and saving money',
  'Prepare me for a job interview',
  'I want to start a side business',
  'Help me plan a healthy meal prep',
  'I feel stuck in my career',
  'How do I negotiate a raise',
  'I want to learn to invest',
  'Help me write a resume',
];

const CATEGORY_COLORS: Record<string, string> = {
  life: 'var(--green)',
  career: 'var(--cyan)',
  money: 'var(--gold)',
  health: 'var(--green)',
  business: 'var(--purple)',
  learning: 'var(--cyan)',
  decisions: 'var(--gold)',
  conversations: 'var(--red)',
  home: 'var(--text-secondary)',
  technology: 'var(--cyan)',
  events: 'var(--purple)',
  developer: 'var(--cyan)',
  default: 'var(--text-secondary)',
};

function getCategoryColor(category: string): string {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_COLORS.default;
}

// ── Cycling placeholder ──────────────────────────────────────────────

function useCyclingPlaceholder() {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const target = PLACEHOLDER_EXAMPLES[index];
    if (typing) {
      if (display.length < target.length) {
        const t = setTimeout(() => setDisplay(target.slice(0, display.length + 1)), 40);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2000);
        return () => clearTimeout(t);
      }
    } else {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay(display.slice(0, -1)), 20);
        return () => clearTimeout(t);
      } else {
        setIndex((index + 1) % PLACEHOLDER_EXAMPLES.length);
        setTyping(true);
      }
    }
  }, [display, typing, index]);

  return display;
}

// ── Debounce hook ────────────────────────────────────────────────────

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Sub-components ───────────────────────────────────────────────────

function PipelineArrows({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-3">
      {skills.map((skill, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: 'rgba(0,255,200,0.06)',
              border: '1px solid rgba(0,255,200,0.12)',
              color: 'var(--cyan)',
            }}
          >
            {skill}
          </span>
          {i < skills.length - 1 && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              &rarr;
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ChainCard({
  chain,
  isSelected,
  onClick,
}: {
  chain: ChainMatch;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = getCategoryColor(chain.category);
  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-lg p-5 transition-all cursor-pointer"
      style={{
        background: isSelected ? 'rgba(0,255,200,0.04)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'rgba(0,255,200,0.3)' : 'var(--border)'}`,
        boxShadow: isSelected ? '0 0 20px rgba(0,255,200,0.08)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {chain.chain_name.replace(/-/g, ' ')}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {chain.category}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
        {chain.description}
      </p>

      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>{chain.step_count} steps</span>
        <span style={{ color: 'var(--cyan)' }}>
          {Math.round(chain.score * 100)}% match
        </span>
      </div>

      <PipelineArrows skills={chain.skills} />
    </button>
  );
}

// ── Markdown-lite renderer ────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const html = useMemo(() => {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^#### (.+)$/gm, '<h4 style="margin:10px 0 3px;font-size:0.8rem;color:var(--text-primary)">$1</h4>')
      .replace(/^### (.+)$/gm, '<h3 style="margin:12px 0 4px;font-size:0.85rem;color:var(--cyan)">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="margin:14px 0 5px;font-size:0.9rem;color:var(--cyan)">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^(\s*)[-*] (.+)$/gm, '$1<li style="margin-left:14px;list-style:disc;margin-bottom:2px">$2</li>')
      .replace(/^(\s*)\d+\.\s+(.+)$/gm, '$1<li style="margin-left:14px;list-style:decimal;margin-bottom:2px">$2</li>')
      .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
  }, [text]);
  return (
    <div
      className="text-xs leading-relaxed"
      style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Detail Panel ─────────────────────────────────────────────────────

function ChainDetail({
  chain,
  locked,
  isConnected,
}: {
  chain: ChainMatch;
  locked: boolean;
  isConnected: boolean;
}) {
  const color = getCategoryColor(chain.category);
  const { state, run, stop, reset } = useChainRunner(chain.chain_name, chain.skills);
  const [goal, setGoal] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll while streaming
  useEffect(() => {
    if (state.stage === 'running') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [state.skillStreaming, state.stage]);

  // Auto-expand steps as they complete
  useEffect(() => {
    if (state.skillResults.size > 0) {
      setExpandedSteps(prev => {
        const next = new Set(prev);
        state.skillResults.forEach((_, i) => next.add(i));
        return next;
      });
    }
  }, [state.skillResults.size]);

  // Reset local state when chain changes
  useEffect(() => {
    reset();
    setGoal('');
    setExpandedSteps(new Set());
  }, [chain.chain_name]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStep = (i: number) =>
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const handleRun = () => { if (goal.trim()) run(goal.trim()); };

  return (
    <div
      ref={scrollRef}
      className="rounded-xl overflow-y-auto lg:sticky lg:top-24"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 0 30px rgba(0,255,200,0.04)',
        maxHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* ── Header (always visible) ── */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
          >
            {chain.category}
          </span>
          {state.stage !== 'idle' && (
            <button
              onClick={() => { reset(); setGoal(''); setExpandedSteps(new Set()); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
            >
              ← back
            </button>
          )}
        </div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {chain.chain_name.replace(/-/g, ' ')}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {chain.description}
        </p>
      </div>

      {/* ── Step progress bar (running / complete) ── */}
      {(state.stage === 'running' || state.stage === 'complete') && (
        <div className="px-5 pt-3 pb-2 flex flex-wrap items-center gap-1"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {chain.skills.map((skill, i) => {
            const done = state.skillResults.has(i);
            const active = state.currentSkillIndex === i && state.stage === 'running';
            return (
              <span key={i} className="flex items-center gap-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full${active ? ' animate-pulse' : ''}`}
                  style={{
                    background: done ? 'rgba(0,255,136,0.12)' : active ? 'rgba(0,255,200,0.12)' : 'rgba(255,255,255,0.04)',
                    color: done ? 'var(--green)' : active ? 'var(--cyan)' : 'var(--text-secondary)',
                    border: `1px solid ${done ? 'rgba(0,255,136,0.2)' : active ? 'rgba(0,255,200,0.2)' : 'var(--border)'}`,
                  }}
                >
                  {done ? '✓ ' : active ? '● ' : '○ '}{skill}
                </span>
                {i < chain.skills.length - 1 && (
                  <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>→</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="p-5">
        {/* ── LOCKED ── */}
        {locked ? (
          !isConnected ? (
            <div className="text-center">
              <p className="text-xs mb-3" style={{ color: 'var(--gold)' }}>
                Connect your wallet with TRUST tokens to run this pipeline
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="rounded-lg p-4 text-center"
              style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)', margin: '0 auto 8px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>TRUST tokens required</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                Earn tokens by publishing flows or validating.
              </p>
            </div>
          )

        /* ── IDLE: pipeline preview + goal input ── */
        ) : state.stage === 'idle' ? (
          <>
            <div className="mb-4">
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Pipeline — {chain.skills.length} steps
              </div>
              <div className="space-y-1.5">
                {chain.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(0,255,200,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.2)', fontSize: '9px' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(0,255,200,0.04)', border: '1px solid rgba(0,255,200,0.08)', color: 'var(--text-primary)' }}>
                      {skill}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {chain.match_reason && (
              <p className="text-xs mb-4 italic" style={{ color: 'var(--cyan)', opacity: 0.7 }}>
                {chain.match_reason}
              </p>
            )}

            <div className="mb-4">
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                What do you want to achieve?
              </label>
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun(); }}
                placeholder="Describe your situation or goal..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-xs resize-none outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
              />
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                Cmd+Enter to run
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={!goal.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider cursor-pointer transition-all"
              style={{
                background: goal.trim() ? 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,255,200,0.05))' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${goal.trim() ? 'rgba(0,255,200,0.4)' : 'var(--border)'}`,
                color: goal.trim() ? 'var(--cyan)' : 'var(--text-secondary)',
                opacity: goal.trim() ? 1 : 0.6,
                fontFamily: 'inherit',
              }}
            >
              Run Pipeline
            </button>
          </>

        /* ── RUNNING: step-by-step streaming ── */
        ) : state.stage === 'running' ? (
          <>
            {/* Completed steps (collapsible) */}
            {Array.from(state.skillResults.entries()).map(([i, text]) => (
              <div key={i} className="mb-3">
                <button
                  onClick={() => toggleStep(i)}
                  className="w-full flex items-center justify-between text-xs py-2 px-3 rounded cursor-pointer"
                  style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', color: 'var(--green)', fontFamily: 'inherit' }}
                >
                  <span>✓ Step {i + 1}: {chain.skills[i]}</span>
                  <span style={{ opacity: 0.6 }}>{expandedSteps.has(i) ? '▲' : '▼'}</span>
                </button>
                {expandedSteps.has(i) && (
                  <div className="mt-1 p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.08)' }}>
                    <RichText text={text} />
                  </div>
                )}
              </div>
            ))}

            {/* Active streaming step */}
            {state.currentSkillIndex >= 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs animate-pulse" style={{ color: 'var(--cyan)' }}>
                  <span>●</span>
                  <span>Step {state.currentSkillIndex + 1}: {chain.skills[state.currentSkillIndex]}</span>
                </div>
                <div className="p-3 rounded-lg min-h-[60px]"
                  style={{ background: 'rgba(0,255,200,0.03)', border: '1px solid rgba(0,255,200,0.1)' }}>
                  <RichText text={state.skillStreaming.get(state.currentSkillIndex) || '…'} />
                </div>
              </div>
            )}

            <button
              onClick={stop}
              className="w-full py-2 rounded-lg text-xs cursor-pointer"
              style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: 'var(--red)', fontFamily: 'inherit' }}
            >
              Stop
            </button>
          </>

        /* ── COMPLETE ── */
        ) : state.stage === 'complete' ? (
          <>
            <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: 'var(--green)' }}>
              <span>✓</span>
              <span className="font-semibold">Pipeline complete — {chain.skills.length} steps</span>
            </div>

            {chain.skills.map((skill, i) => {
              const text = state.skillResults.get(i) || '';
              const open = expandedSteps.has(i);
              return (
                <div key={i} className="mb-3">
                  <button
                    onClick={() => toggleStep(i)}
                    className="w-full flex items-center justify-between text-xs py-2 px-3 rounded cursor-pointer"
                    style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', color: 'var(--green)', fontFamily: 'inherit' }}
                  >
                    <span>Step {i + 1}: {skill}</span>
                    <span style={{ opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <div className="mt-1 p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.08)' }}>
                      <RichText text={text} />
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => { reset(); setGoal(''); setExpandedSteps(new Set()); }}
              className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ background: 'linear-gradient(135deg, rgba(0,255,200,0.12), rgba(0,255,200,0.04))', border: '1px solid rgba(0,255,200,0.3)', color: 'var(--cyan)', fontFamily: 'inherit' }}
            >
              Run Again
            </button>
          </>

        /* ── ERROR ── */
        ) : (
          <>
            <div className="p-4 rounded-lg mb-4"
              style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--red)' }}>Error</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{state.error}</div>
            </div>
            <button
              onClick={() => { reset(); setExpandedSteps(new Set()); }}
              className="w-full py-2 rounded-lg text-xs cursor-pointer"
              style={{ background: 'rgba(0,255,200,0.08)', border: '1px solid rgba(0,255,200,0.2)', color: 'var(--cyan)', fontFamily: 'inherit' }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Browse / All Chains grid ─────────────────────────────────────────

function BrowseChains({
  onSelect,
  selectedName,
}: {
  onSelect: (chain: ChainMatch) => void;
  selectedName: string | null;
}) {
  const { data: allChains, isLoading } = useChains();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-5 animate-pulse"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="h-4 w-3/4 rounded mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-3 w-full rounded mb-2" style={{ background: 'rgba(255,255,255,0.03)' }} />
            <div className="h-3 w-2/3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!allChains || allChains.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pipelines available.</p>
      </div>
    );
  }

  // Convert ChainSummary to ChainMatch-compatible shape for rendering
  const asMatches: ChainMatch[] = allChains.map((c) => ({
    chain_name: c.name,
    description: c.description,
    category: c.category,
    score: 1,
    match_reason: '',
    skills: c.skills,
    step_count: c.steps,
    free: c.free,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {asMatches.map((chain) => (
        <ChainCard
          key={chain.chain_name}
          chain={chain}
          isSelected={selectedName === chain.chain_name}
          onClick={() => onSelect(chain)}
        />
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function Chains() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const placeholder = useCyclingPlaceholder();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<ChainMatch | null>(null);
  const isConnected = false; // wallet connect still available in docs

  const { data: searchResults, isLoading: isSearching } = useSearchChains(debouncedQuery);

  const hasSearch = debouncedQuery.length > 2;
  const results = searchResults || [];

  const handleSelect = useCallback((chain: ChainMatch) => {
    setSelected(chain);
    // Scroll detail into view on mobile
    setTimeout(() => {
      document.getElementById('chain-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
          Flow Pipelines
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Multi-step flows that run in sequence. Describe what you need and
          let the system find the right pipeline.
        </p>
        {/* Claude Desktop nudge */}
        <div
          className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs"
          style={{
            background: 'rgba(0,255,200,0.04)',
            border: '1px solid rgba(0,255,200,0.1)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--cyan)', fontSize: '14px' }}>✦</span>
          <span>
            Best experience:{' '}
            <a
              href="https://claude.ai/download"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--cyan)', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,200,0.3)' }}
            >
              Claude Desktop
            </a>{' '}
            + SkillChain MCP — persistent memory, wallet integration, and richer pipeline output.
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: query ? '0 0 30px rgba(0,255,200,0.06)' : 'none',
            transition: 'box-shadow 0.3s',
          }}
        >
          <div className="flex items-center px-4 py-1">
            <svg
              className="shrink-0 mr-3"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: query ? 'var(--cyan)' : 'var(--text-secondary)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || 'What do you need help with?'}
              className="flex-1 py-3 text-sm outline-none"
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelected(null);
                  inputRef.current?.focus();
                }}
                className="text-xs px-2 py-1 rounded cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                }}
              >
                clear
              </button>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isSearching && hasSearch && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cyan)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Searching pipelines...</span>
          </div>
        )}
      </div>

      {/* Results layout: grid + detail panel */}
      {hasSearch && results.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Results list */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              {results.length} pipeline{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map((chain) => (
              <ChainCard
                key={chain.chain_name}
                chain={chain}
                isSelected={selected?.chain_name === chain.chain_name}
                onClick={() => handleSelect(chain)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2" id="chain-detail">
            {selected ? (
              <ChainDetail
                chain={selected}
                locked={false}
                isConnected={isConnected}
              />
            ) : (
              <div
                className="rounded-xl p-8 text-center sticky top-24"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Select a pipeline to view details
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                  Click any result to see its flows and run it
                </div>
              </div>
            )}
          </div>
        </div>
      ) : hasSearch && !isSearching ? (
        <div className="text-center py-16">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            No pipelines match that query.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            Try a different description of what you need.
          </p>
        </div>
      ) : (
        /* Browse all chains when no search */
        <div>
          <div className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
            Browse All Pipelines
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <BrowseChains onSelect={handleSelect} selectedName={selected?.chain_name ?? null} />
            </div>
            <div className="lg:col-span-2" id="chain-detail">
              {selected ? (
                <ChainDetail
                  chain={selected}
                  locked={false}
                  isConnected={isConnected}
                />
              ) : (
                <div
                  className="rounded-xl p-8 text-center sticky top-24"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Select a pipeline to view details
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                    Click any pipeline to see its flows and run it
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
