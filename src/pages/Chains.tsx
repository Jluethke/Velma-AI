import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchChains, useChains, type ChainMatch } from '../hooks/useChains';
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
  const [launched, setLaunched] = useState(false);
  const color = getCategoryColor(chain.category);

  const prompt = `Run the ${chain.chain_name} chain`;
  const deepLink = `vscode://anthropic.claude-code/open?prompt=${encodeURIComponent(prompt)}`;

  const handleRun = () => {
    window.location.href = deepLink;
    setLaunched(true);
    setTimeout(() => setLaunched(false), 5000);
  };

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

      {/* Run Chain / Gate */}
      {locked ? (
        <div className="space-y-3">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-xs mb-3" style={{ color: 'var(--gold)' }}>
                Connect your wallet with TRUST tokens to unlock this chain
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div
              className="rounded-lg p-4 text-center"
              style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)', margin: '0 auto 8px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>TRUST tokens required</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                Your wallet is connected but has no TRUST balance. Earn tokens by publishing skills or validating.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={handleRun}
            className="w-full py-3 rounded-lg text-sm font-semibold uppercase tracking-wider cursor-pointer transition-all"
            style={{
              background: launched
                ? 'rgba(0,255,136,0.15)'
                : 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,255,200,0.05))',
              border: `1px solid ${launched ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,200,0.4)'}`,
              color: launched ? 'var(--green)' : 'var(--cyan)',
            }}
            onMouseEnter={(e) => { if (!launched) e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,200,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {launched ? 'Opening Claude Code...' : 'Run Chain'}
          </button>
          {launched && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
              Don't have SkillChain? <a href="/install.bat" download="SkillChain-Install.bat" style={{ color: 'var(--cyan)' }}>Download the installer</a> first.
            </p>
          )}
        </>
      )}
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
