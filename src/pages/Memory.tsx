import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTitle } from '../hooks/useVelmaCompanion';
import { useTKG } from '../hooks/useTKG';
import type { TKGAssertion } from '../hooks/useTKG';

interface SavedOutput {
  id: string;
  flowSlug: string;
  domain: string;
  content: string;
  savedAt: string;
}

interface VelmaState {
  level: number;
  xp: number;
  flows_run: number;
  flows_completed: string[];
  streak: number;
}

function formatSlug(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function loadSavedOutputs(): SavedOutput[] {
  try {
    return JSON.parse(localStorage.getItem('flowfabric-saved-outputs') || '[]');
  } catch { return []; }
}

function loadVelmaState(): VelmaState | null {
  try {
    const raw = localStorage.getItem('flowfabric-velma-v2');
    if (raw) return JSON.parse(raw);
    return null;
  } catch { return null; }
}

const tagStyle = {
  display: 'inline-block' as const,
  fontSize: '11px',
  padding: '2px 8px',
  borderRadius: '6px',
  background: 'rgba(56, 189, 248, 0.1)',
  border: '1px solid rgba(56, 189, 248, 0.2)',
  color: 'var(--cyan)',
  fontWeight: 600,
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '32px',
};

const labelStyle = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

// ── Saved output card ─────────────────────────────────────────────

function SavedOutputCard({ entry, onDelete }: { entry: SavedOutput; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const preview = entry.content.slice(0, 200).replace(/\n/g, ' ');

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
        <div>
          <code style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)' }}>
            {entry.flowSlug}
          </code>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
            {timeAgo(entry.savedAt)}
          </span>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '14px', padding: '0 4px',
            lineHeight: 1, flexShrink: 0,
          }}
          title="Delete"
        >
          ×
        </button>
      </div>

      <p style={{
        fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6,
        margin: '0 0 10px', whiteSpace: 'pre-wrap',
      }}>
        {expanded ? entry.content : `${preview}${entry.content.length > 200 ? '…' : ''}`}
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        {entry.content.length > 200 && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--cyan)', fontSize: '11px', padding: 0,
            }}
          >
            {expanded ? 'Show less' : 'Show full output'}
          </button>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(entry.content)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '11px', padding: 0, marginLeft: 'auto',
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

// ── XP bar ────────────────────────────────────────────────────────

function XpBar({ xp, level }: { xp: number; level: number }) {
  const thresholds = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250, 2750, 3300];
  const current = thresholds[level - 1] ?? 0;
  const next = thresholds[level] ?? xp;
  const pct = next > current ? Math.min(100, ((xp - current) / (next - current)) * 100) : 100;

  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{xp} XP</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>next level at {next} XP</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, rgba(0,255,200,0.6), rgba(0,255,200,1))',
          borderRadius: '2px', transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

// ── TKG Panel ─────────────────────────────────────────────────────

function TKGPanel() {
  const { assertions, stats, query } = useTKG();
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const results = search.trim()
    ? query({ queryText: search, topK: 20 })
    : assertions.slice(0, showAll ? 200 : 12);

  if (stats.total === 0) return null;

  const derivationColor = (kind: TKGAssertion['derivation_kind']) => {
    if (kind === 'consensus_validated') return 'var(--cyan)';
    if (kind === 'inferred') return 'var(--purple)';
    return 'var(--text-secondary)';
  };

  return (
    <div style={{ ...cardStyle, marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, margin: 0 }}>Knowledge Graph</h2>
          <p style={{ ...labelStyle, margin: '2px 0 0' }}>temporal assertions from your flows</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={tagStyle}>{stats.active} active</span>
          <span style={{ ...tagStyle, background: 'rgba(167,139,250,0.08)', color: 'var(--purple)', border: '1px solid rgba(167,139,250,0.2)' }}>
            {stats.subjects} subjects
          </span>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search assertions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)',
          fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {results.map(a => (
          <div key={a.id} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '10px 12px',
            display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start',
          }}>
            <div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                <code style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 600 }}>{a.subject}</code>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>·</span>
                <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{a.predicate}</code>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {a.object}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', color: derivationColor(a.derivation_kind), fontWeight: 600 }}>
                {a.derivation_kind}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {Math.round(a.confidence * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {!search && assertions.length > 12 && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            marginTop: '10px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--cyan)', fontSize: '12px', padding: 0,
          }}
        >
          {showAll ? 'Show fewer' : `Show all ${assertions.length} assertions`}
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function Memory() {
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [velma, setVelma] = useState<VelmaState | null>(null);

  useEffect(() => {
    setSavedOutputs(loadSavedOutputs());
    setVelma(loadVelmaState());
  }, []);

  const handleDelete = (id: string) => {
    const updated = savedOutputs.filter(o => o.id !== id);
    setSavedOutputs(updated);
    localStorage.setItem('flowfabric-saved-outputs', JSON.stringify(updated));
  };

  const hasActivity = (velma && velma.flows_run > 0) || savedOutputs.length > 0;

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Your <span className="gradient-text">Memory</span>
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
            FlowFabric builds a private memory of who you are and what you've done — so every flow you run gets smarter over time.
          </p>
        </div>

        {/* No activity yet */}
        {!hasActivity && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 32px', marginBottom: '24px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(0,255,200,0.06)', border: '1px solid rgba(0,255,200,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '22px',
            }}>
              ◈
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700, margin: '0 0 10px' }}>
              Your memory is empty
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 24px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
              Run a flow and save the output. Your memory grows as you use FlowFabric — every saved output lives here.
            </p>
            <Link
              to="/flows"
              style={{
                display: 'inline-block',
                background: 'rgba(0,255,200,0.1)', border: '1px solid rgba(0,255,200,0.3)',
                borderRadius: '10px', padding: '10px 24px',
                color: 'var(--cyan)', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Browse flows →
            </Link>
          </div>
        )}

        {/* Progress */}
        {velma && velma.flows_run > 0 && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, margin: 0 }}>Progress</h2>
                <p style={{ ...labelStyle, margin: '2px 0 0' }}>tracked locally</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={tagStyle}>{getTitle(velma.level)}</span>
                <span style={{ ...tagStyle, background: 'rgba(167,139,250,0.08)', color: 'var(--purple)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  Lvl {velma.level}
                </span>
              </div>
            </div>

            <XpBar xp={velma.xp} level={velma.level} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
              {[
                { label: 'Flows Run', value: velma.flows_run },
                { label: 'Unique Flows', value: velma.flows_completed.length },
                { label: 'Day Streak', value: velma.streak },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '14px',
                }}>
                  <p style={labelStyle}>{stat.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyan)', margin: '4px 0 0', fontFamily: '"JetBrains Mono", monospace' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {velma.flows_completed.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ ...labelStyle, marginBottom: '10px' }}>Flows completed</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {velma.flows_completed.map(slug => (
                    <Link
                      key={slug}
                      to={`/flow/${slug}`}
                      style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                        background: 'rgba(0,255,200,0.05)', border: '1px solid rgba(0,255,200,0.15)',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      {formatSlug(slug)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved outputs */}
        {savedOutputs.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, margin: 0 }}>Saved Outputs</h2>
                <p style={{ ...labelStyle, margin: '2px 0 0' }}>from flow runs</p>
              </div>
              <span style={{ ...tagStyle, background: 'rgba(56,189,248,0.06)', fontWeight: 400, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {savedOutputs.length} saved
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savedOutputs.map(entry => (
                <SavedOutputCard key={entry.id} entry={entry} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* TKG assertions */}
        <TKGPanel />

        {/* Architecture explainer */}
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={tagStyle}>L0–L3</span>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, margin: 0 }}>Memory Tiers</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { tier: 'L0', label: 'Identity', desc: 'Who you are — always in context. 50 tokens.' },
              { tier: 'L1', label: 'Critical Facts', desc: 'Key facts about your situation — always in context. 500 tokens.' },
              { tier: 'L2', label: 'Flow Rooms', desc: 'Per-flow history and insights — loaded on demand.' },
              { tier: 'L3', label: 'Semantic Index', desc: 'Cross-flow knowledge recalled on demand. Full history searchable.' },
            ].map((row, i, arr) => (
              <div key={row.tier} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ ...tagStyle, flexShrink: 0 }}>{row.tier}</span>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{row.label}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>{row.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          Your memory is stored privately in your browser.{' '}
          <span style={{ color: 'var(--cyan)' }}>Run flows and save outputs to build it up.</span>
        </p>

      </div>
    </div>
  );
}
