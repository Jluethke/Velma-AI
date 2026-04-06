import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchChains, useChains, useRunChain, type ChainMatch, type ChainRunResult, type StepResult } from '../hooks/useChains';

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

function StepProgress({ steps, currentIndex }: { steps: StepResult[]; currentIndex: number }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const done = step.status === 'completed';
        const failed = step.status === 'failed';
        const running = i === currentIndex && !done && !failed;

        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{
              background: running ? 'rgba(0,255,200,0.04)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${running ? 'rgba(0,255,200,0.2)' : 'transparent'}`,
            }}
          >
            {/* Status indicator */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                background: done
                  ? 'rgba(0,255,136,0.15)'
                  : failed
                  ? 'rgba(255,68,68,0.15)'
                  : running
                  ? 'rgba(0,255,200,0.1)'
                  : 'rgba(255,255,255,0.05)',
                color: done
                  ? 'var(--green)'
                  : failed
                  ? 'var(--red)'
                  : running
                  ? 'var(--cyan)'
                  : 'var(--text-secondary)',
                border: `1px solid ${
                  done
                    ? 'rgba(0,255,136,0.3)'
                    : failed
                    ? 'rgba(255,68,68,0.3)'
                    : running
                    ? 'rgba(0,255,200,0.3)'
                    : 'rgba(255,255,255,0.05)'
                }`,
              }}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : failed ? (
                '!'
              ) : running ? (
                <span className="animate-pulse">...</span>
              ) : (
                i + 1
              )}
            </div>

            {/* Step info */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {step.alias || step.skill_name}
              </span>
            </div>

            {/* Duration */}
            {done && (
              <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {(step.duration_ms / 1000).toFixed(1)}s
              </span>
            )}

            {running && (
              <span className="text-xs shrink-0 animate-pulse" style={{ color: 'var(--cyan)' }}>
                running
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompletionPanel({ result }: { result: ChainRunResult }) {
  const { chain, gamification } = result;
  const totalSec = (chain.total_duration_ms / 1000).toFixed(1);
  const trainer = gamification.trainer as Record<string, unknown>;
  const unlocked = gamification.unlocked || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div
        className="rounded-lg p-5"
        style={{
          background: chain.success ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,68,0.04)',
          border: `1px solid ${chain.success ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,68,0.2)'}`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: chain.success ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,68,0.15)',
              color: chain.success ? 'var(--green)' : 'var(--red)',
            }}
          >
            {chain.success ? (
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              '!'
            )}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {chain.success ? 'Chain completed' : 'Chain failed'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {chain.steps.length} steps in {totalSec}s
            </div>
          </div>
        </div>

        {/* Step results */}
        <StepProgress steps={chain.steps} currentIndex={-1} />
      </div>

      {/* XP / Gamification */}
      {trainer && (
        <div
          className="rounded-lg p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
            Rewards
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--gold)' }}>
                Lv.{String(trainer.level ?? '?')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Level</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--cyan)' }}>
                {String(trainer.xp ?? '0')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total XP</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>
                {String(trainer.streak ?? '0')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements unlocked */}
      {unlocked.length > 0 && (
        <div
          className="rounded-lg p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--gold)' }}>
            Achievements Unlocked
          </div>
          <div className="space-y-2">
            {unlocked.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded" style={{ background: 'rgba(255,215,0,0.04)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold)' }}
                >
                  +{a.xp}
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {a.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {a.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile link */}
      <div className="text-center">
        <a
          href="/profile"
          className="inline-block px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider font-semibold no-underline transition-all"
          style={{
            background: 'rgba(0,255,200,0.1)',
            border: '1px solid rgba(0,255,200,0.3)',
            color: 'var(--cyan)',
          }}
        >
          View Full Profile
        </a>
      </div>
    </div>
  );
}

// ── Detail Panel ─────────────────────────────────────────────────────

function ChainDetail({
  chain,
  onRun,
  isRunning,
  runResult,
  runSteps,
  runProgress,
}: {
  chain: ChainMatch;
  onRun: () => void;
  isRunning: boolean;
  runResult: ChainRunResult | null;
  runSteps: StepResult[];
  runProgress: number;
}) {
  const color = getCategoryColor(chain.category);

  return (
    <div
      className="rounded-xl p-6 sticky top-24"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 0 30px rgba(0,255,200,0.04)',
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <span
          className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {chain.category}
        </span>
      </div>

      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {chain.chain_name.replace(/-/g, ' ')}
      </h2>

      <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--text-secondary)' }}>
        {chain.description}
      </p>

      {chain.match_reason && (
        <p className="text-xs mb-4 italic" style={{ color: 'var(--cyan)', opacity: 0.7 }}>
          {chain.match_reason}
        </p>
      )}

      {/* Pipeline visualization */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
          Skill Pipeline
        </div>
        <div className="space-y-2">
          {chain.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{
                  background: 'rgba(0,255,200,0.1)',
                  color: 'var(--cyan)',
                  border: '1px solid rgba(0,255,200,0.2)',
                  fontSize: '9px',
                }}
              >
                {i + 1}
              </div>
              <div
                className="flex-1 text-xs px-3 py-1.5 rounded"
                style={{
                  background: 'rgba(0,255,200,0.04)',
                  border: '1px solid rgba(0,255,200,0.08)',
                  color: 'var(--text-primary)',
                }}
              >
                {skill}
              </div>
              {i < chain.skills.length - 1 && (
                <div className="w-5 flex justify-center">
                  <div className="w-px h-4" style={{ background: 'rgba(0,255,200,0.2)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Run state */}
      {!isRunning && !runResult && (
        <button
          onClick={onRun}
          className="w-full py-3 rounded-lg text-sm font-semibold uppercase tracking-wider cursor-pointer transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,255,200,0.05))',
            border: '1px solid rgba(0,255,200,0.4)',
            color: 'var(--cyan)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,200,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Run Chain
        </button>
      )}

      {isRunning && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--cyan)' }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>
              Running...
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${runProgress}%`,
                background: 'var(--cyan)',
                boxShadow: '0 0 10px rgba(0,255,200,0.4)',
              }}
            />
          </div>

          {runSteps.length > 0 && <StepProgress steps={runSteps} currentIndex={runSteps.length - 1} />}
        </div>
      )}

      {runResult && <CompletionPanel result={runResult} />}
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
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No chains available.</p>
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
  const [runResult, setRunResult] = useState<ChainRunResult | null>(null);
  const [runSteps, setRunSteps] = useState<StepResult[]>([]);
  const [runProgress, setRunProgress] = useState(0);

  const { data: searchResults, isLoading: isSearching } = useSearchChains(debouncedQuery);
  const runChain = useRunChain();

  const isRunning = runChain.isPending;
  const hasSearch = debouncedQuery.length > 2;
  const results = searchResults || [];

  // Reset run state when chain changes
  useEffect(() => {
    setRunResult(null);
    setRunSteps([]);
    setRunProgress(0);
  }, [selected?.chain_name]);

  const handleRun = useCallback(() => {
    if (!selected) return;
    setRunResult(null);
    setRunSteps([]);
    setRunProgress(0);

    // Simulate step progress while mutation runs
    const fakeSteps = selected.skills.map((s) => ({
      skill_name: s,
      alias: s,
      status: 'pending',
      output: {},
      duration_ms: 0,
      error: '',
    }));
    setRunSteps(fakeSteps);

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      setRunSteps((prev) =>
        prev.map((step, i) =>
          i < stepIdx
            ? { ...step, status: 'completed', duration_ms: 800 + Math.random() * 2000 }
            : i === stepIdx
            ? { ...step, status: 'running' }
            : step
        )
      );
      setRunProgress(Math.min(95, (stepIdx / fakeSteps.length) * 100));
      if (stepIdx >= fakeSteps.length) clearInterval(interval);
    }, 1500);

    runChain.mutate(
      { name: selected.chain_name },
      {
        onSuccess: (data) => {
          clearInterval(interval);
          setRunProgress(100);
          setRunSteps(data.chain.steps);
          setRunResult(data);
        },
        onError: () => {
          clearInterval(interval);
          // Mark remaining steps as failed
          setRunSteps((prev) =>
            prev.map((step) =>
              step.status === 'pending' || step.status === 'running'
                ? { ...step, status: 'failed' }
                : step
            )
          );
        },
      }
    );
  }, [selected, runChain]);

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
          Skill Chains
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Multi-step AI pipelines that chain skills together. Describe what you need and
          let the system find the right sequence.
        </p>
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
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Searching chains...</span>
          </div>
        )}
      </div>

      {/* Results layout: grid + detail panel */}
      {hasSearch && results.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Results list */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              {results.length} chain{results.length !== 1 ? 's' : ''} found
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
                onRun={handleRun}
                isRunning={isRunning}
                runResult={runResult}
                runSteps={runSteps}
                runProgress={runProgress}
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
                  Select a chain to view details
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                  Click any result to see the skill pipeline and run it
                </div>
              </div>
            )}
          </div>
        </div>
      ) : hasSearch && !isSearching ? (
        <div className="text-center py-16">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            No chains match that query.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            Try a different description of what you need.
          </p>
        </div>
      ) : (
        /* Browse all chains when no search */
        <div>
          <div className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
            Browse All Chains
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <BrowseChains onSelect={handleSelect} selectedName={selected?.chain_name ?? null} />
            </div>
            <div className="lg:col-span-2" id="chain-detail">
              {selected ? (
                <ChainDetail
                  chain={selected}
                  onRun={handleRun}
                  isRunning={isRunning}
                  runResult={runResult}
                  runSteps={runSteps}
                  runProgress={runProgress}
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
                    Select a chain to view details
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                    Click any chain to see its skill pipeline and run it
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
