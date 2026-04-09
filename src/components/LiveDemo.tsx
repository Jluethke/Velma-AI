import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchChains } from '../hooks/useChains';
import type { ChainMatch } from '../hooks/useChains';

// ── Constants ────────────────────────────────────────────────────────

const PLACEHOLDER_EXAMPLES = [
  'I need help budgeting and saving money',
  'Fix my failing tests',
  'Prepare me for a job interview',
  'Help me start a side business',
  'Review and refactor my code',
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
  content: 'var(--purple)',
  default: 'var(--text-secondary)',
};

function getCategoryColor(category: string): string {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_COLORS.default;
}

// ── Fallback client-side search ─────────────────────────────────────

const FALLBACK_CHAINS: ChainMatch[] = [
  { chain_name: 'get-your-life-together', description: 'Budget your money, plan your week, and meal prep — all in one shot. The chain everyone needs.', category: 'life', score: 1, match_reason: '', skills: ['budget-builder', 'daily-planner', 'meal-planner'], step_count: 3, free: true },
  { chain_name: 'career-launchpad', description: 'Build your resume, prep for interviews, and plan salary negotiation — full job search pipeline', category: 'career', score: 1, match_reason: '', skills: ['resume-builder', 'interview-coach', 'daily-planner'], step_count: 3, free: true },
  { chain_name: 'money-makeover', description: 'Audit expenses, build a budget, and create a retirement projection — take control of your finances', category: 'money', score: 1, match_reason: '', skills: ['expense-optimizer', 'budget-builder', 'retirement-planner'], step_count: 3, free: true },
  { chain_name: 'code-review', description: 'Full code review pipeline: lint, security scan, style check, and actionable summary', category: 'developer', score: 1, match_reason: '', skills: ['code-review', 'complaint-letter-writer'], step_count: 3, free: true },
  { chain_name: 'content-machine', description: 'Turn one piece of content into 25 platform-optimized variations with scheduling', category: 'content', score: 1, match_reason: '', skills: ['content-engine', 'daily-planner'], step_count: 3, free: true },
  { chain_name: 'healthy-week', description: 'Plan your meals, schedule workouts, and organize your week for maximum energy', category: 'health', score: 1, match_reason: '', skills: ['meal-planner', 'workout-planner', 'daily-planner'], step_count: 3, free: true },
  { chain_name: 'trip-ready', description: 'Plan your trip, budget it, and get a daily itinerary — from idea to packed bag', category: 'life', score: 1, match_reason: '', skills: ['travel-planner', 'budget-builder', 'daily-planner'], step_count: 3, free: true },
  { chain_name: 'home-savings', description: 'Energy audit your home and optimize recurring expenses — find hidden savings', category: 'home', score: 1, match_reason: '', skills: ['energy-audit', 'expense-optimizer'], step_count: 2, free: true },
];

function clientSearch(query: string): ChainMatch[] {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  const scored = FALLBACK_CHAINS.map((chain) => {
    const text = `${chain.chain_name} ${chain.description} ${chain.category} ${chain.skills.join(' ')}`.toLowerCase();
    let hits = 0;
    for (const word of words) {
      if (text.includes(word)) hits++;
    }
    const score = words.length > 0 ? hits / words.length : 0;
    return { ...chain, score };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored;
}

// ── Cycling placeholder ──────────────────────────────────────────────

function useCyclingPlaceholder(paused: boolean) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (paused) return;
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
  }, [display, typing, index, paused]);

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

function PipelineViz({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {skills.map((skill, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(0,255,200,0.06)',
              border: '1px solid rgba(0,255,200,0.15)',
              color: 'var(--cyan)',
            }}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(0,255,200,0.12)',
                fontSize: '9px',
                color: 'var(--cyan)',
              }}
            >
              {i + 1}
            </span>
            {skill}
          </span>
          {i < skills.length - 1 && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: 'rgba(0,255,200,0.4)', flexShrink: 0 }}
            >
              <path
                d="M4 8h8M9.5 5L12 8l-2.5 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}

function MatchScore({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--cyan)' : 'var(--gold)';
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 rounded-full flex-1"
        style={{ background: 'rgba(255,255,255,0.06)', maxWidth: '80px' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function ResultCard({ chain, index }: { chain: ChainMatch; index: number }) {
  const [copied, setCopied] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const color = getCategoryColor(chain.category);

  // Natural language prompt — user pastes into Claude Code, MCP runtime handles the rest
  const prompt = chain.description.length > 60
    ? `${chain.chain_name.replace(/-/g, ' ')}`
    : chain.description;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      className="rounded-xl p-5 animate-fade-in-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {chain.chain_name.replace(/-/g, ' ')}
        </h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider font-semibold"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {chain.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
        {chain.description}
      </p>

      {/* Match score + steps */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>{chain.step_count} steps</span>
        </div>
        <MatchScore score={chain.score} />
      </div>

      {/* Pipeline */}
      <PipelineViz skills={chain.skills} />

      {/* Action buttons */}
      <div className="mt-4 space-y-2">
        {/* Copy prompt — paste into Claude Code and MCP runtime handles it */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
          style={{
            background: copied
              ? 'rgba(0,255,136,0.15)'
              : 'linear-gradient(135deg, rgba(0,255,200,0.12), rgba(0,255,200,0.04))',
            border: `1px solid ${copied ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,200,0.3)'}`,
            color: copied ? 'var(--green)' : 'var(--cyan)',
          }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,200,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {copied ? 'Copied — paste into Claude Code' : 'Copy prompt to clipboard'}
        </button>

        {/* Install hint */}
        <div className="text-center">
          <button
            onClick={() => setShowInstall(!showInstall)}
            className="text-[10px] cursor-pointer bg-transparent border-0 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {showInstall ? 'Hide setup instructions' : "Don't have FlowFabric yet?"}
          </button>
          {showInstall && (
            <div
              className="mt-2 p-3 rounded-lg text-left text-xs space-y-1.5"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)' }}
            >
              <p style={{ color: 'var(--text-primary)' }}>One-time setup (30 seconds):</p>
              <p>1. <a href="/install.bat" download="FlowFabric-Install.bat" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Download installer</a> (Windows) or <a href="/install.sh" download="FlowFabric-Install.sh" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Mac/Linux</a></p>
              <p>2. Run it — installs FlowFabric + configures Claude Code</p>
              <p>3. Paste your prompt into Claude Code — flows run automatically</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function LiveDemo() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const debouncedSubmitted = useDebounce(submitted, 150);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = useCyclingPlaceholder(query.length > 0);

  // API search — fires when submitted query is long enough
  const { data: apiResults, isLoading } = useSearchChains(debouncedSubmitted);

  // Merge: use API results if available, fall back to client search
  const [results, setResults] = useState<ChainMatch[]>([]);

  useEffect(() => {
    if (!debouncedSubmitted || debouncedSubmitted.length < 3) {
      setResults([]);
      return;
    }
    if (apiResults && apiResults.length > 0) {
      setResults(apiResults.slice(0, 3));
    } else if (!isLoading) {
      // API unavailable or no results — use client fallback
      setResults(clientSearch(debouncedSubmitted));
    }
  }, [apiResults, isLoading, debouncedSubmitted]);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length > 2) {
      setSubmitted(trimmed);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setSubmitted('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  return (
    <section id="live-demo" className="px-6 py-20 max-w-4xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
          Try it{' '}
          <span style={{ color: 'var(--cyan)' }}>right now.</span>
        </h2>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Describe what you need. FlowFabric finds the right flow chain and runs it inside Claude Code.
        </p>
      </div>

      {/* Search input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div
          className="relative rounded-xl overflow-hidden transition-shadow duration-300"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: query ? '0 0 30px rgba(0,255,200,0.08)' : 'none',
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
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'What do you need help with?'}
              className="flex-1 py-3 text-sm outline-none"
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            {query ? (
              <button
                onClick={handleClear}
                className="text-xs px-2 py-1 rounded cursor-pointer mr-2"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                }}
              >
                clear
              </button>
            ) : null}
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,255,200,0.05))',
                border: '1px solid rgba(0,255,200,0.3)',
                color: 'var(--cyan)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,200,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && submitted.length > 2 && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--cyan)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Finding matching chains...
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            className="text-xs uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {results.length} chain{results.length !== 1 ? 's' : ''} matched
          </div>
          {results.map((chain, i) => (
            <ResultCard key={chain.chain_name} chain={chain} index={i} />
          ))}
        </div>
      )}

      {/* No results state */}
      {submitted.length > 2 && !isLoading && results.length === 0 && (
        <div className="text-center py-8 max-w-2xl mx-auto animate-fade-in-up">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            No chains match that query yet.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            Try describing what you need differently, or{' '}
            <a href="/chains" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
              browse all chains
            </a>
            .
          </p>
        </div>
      )}

      {/* Hint when idle */}
      {results.length === 0 && submitted.length === 0 && (
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            Type a problem and press Enter or click Search. No account needed.
          </p>
        </div>
      )}
    </section>
  );
}
