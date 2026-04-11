import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Data ──────────────────────────────────────────────────────────

interface Flow {
  name: string;
  slug: string;
  tagline: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  glow: string;
  prompt: string;
  flows: Flow[];
}

const CATEGORIES: Category[] = [
  {
    id: 'career',
    label: 'Career',
    icon: '🚀',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.15)',
    prompt: 'I need help with my career',
    flows: [
      { name: 'Resume Builder', slug: 'resume-builder', tagline: 'ATS-optimized, role-targeted' },
      { name: 'Salary Negotiator', slug: 'salary-negotiator', tagline: 'Counter-offers that work' },
      { name: 'Interview Coach', slug: 'interview-coach', tagline: 'STAR answers for any question' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: '⚡',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
    prompt: 'I want to start or grow a business',
    flows: [
      { name: 'Business in a Box', slug: 'business-in-a-box', tagline: 'Idea → launch plan in 5 phases' },
      { name: 'Competitor Teardown', slug: 'competitor-teardown', tagline: 'Know your competition cold' },
      { name: 'Pricing Strategy', slug: 'pricing-strategy', tagline: 'Value-based pricing playbook' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.15)',
    prompt: 'I want to fix my finances',
    flows: [
      { name: 'Budget Builder', slug: 'budget-builder', tagline: 'Zero-based, actually works' },
      { name: 'Debt Payoff Planner', slug: 'debt-payoff-planner', tagline: 'Avalanche vs snowball, optimized' },
      { name: 'Retirement Planner', slug: 'retirement-planner', tagline: 'Real projections, real numbers' },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: '⌨️',
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.15)',
    prompt: 'I need help with code or a project',
    flows: [
      { name: 'Bug Root Cause', slug: 'bug-root-cause', tagline: 'Find it fast, fix it right' },
      { name: 'Code Review', slug: 'code-review', tagline: 'Structured, not a roast' },
      { name: 'API Design', slug: 'api-design', tagline: 'RESTful, typed, documented' },
    ],
  },
  {
    id: 'life',
    label: 'Life',
    icon: '🧭',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.15)',
    prompt: 'I feel stuck or overwhelmed',
    flows: [
      { name: 'Weekly Review', slug: 'weekly-review', tagline: 'Reset and prioritize in 20 min' },
      { name: 'Decision Analyzer', slug: 'decision-analyzer', tagline: 'Big choices, clear framework' },
      { name: 'Habit Builder', slug: 'habit-builder', tagline: 'Anchored, tracked, sustained' },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    icon: '🌿',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.15)',
    prompt: 'I want to improve my health',
    flows: [
      { name: 'Meal Planner', slug: 'meal-planner', tagline: 'Macro-aware, actually tasty' },
      { name: 'Workout Planner', slug: 'workout-planner', tagline: 'Periodized, progressive' },
      { name: 'Sleep Protocol', slug: 'sleep-protocol-designer', tagline: 'Evidence-based sleep fix' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: '✦',
    color: '#f472b6',
    glow: 'rgba(244,114,182,0.15)',
    prompt: 'I need to create something',
    flows: [
      { name: 'Content Engine', slug: 'content-engine', tagline: '30 days of content in one run' },
      { name: 'Presentation Architect', slug: 'presentation-architect', tagline: 'Narrative-first slide decks' },
      { name: 'Email Writer', slug: 'email-writer', tagline: 'Gets opened. Gets replied to.' },
    ],
  },
  {
    id: 'education',
    label: 'Learning',
    icon: '📖',
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.15)',
    prompt: 'I want to learn something new',
    flows: [
      { name: 'Explain Anything', slug: 'explain-anything', tagline: 'First principles, your level' },
      { name: 'Study Planner', slug: 'study-planner', tagline: 'Spaced repetition, scheduled' },
      { name: 'Flashcard Generator', slug: 'flashcard-generator-spaced-repetition-optimizer', tagline: 'Active recall, auto-scheduled' },
    ],
  },
  {
    id: 'solopreneur',
    label: 'Freelance',
    icon: '🎯',
    color: '#fb7185',
    glow: 'rgba(251,113,133,0.15)',
    prompt: 'I freelance or run a solo business',
    flows: [
      { name: 'Solopreneur Engine', slug: 'solopreneur-engine', tagline: 'Ops, sales, delivery — all of it' },
      { name: 'Cold Outreach Optimizer', slug: 'cold-outreach-optimizer', tagline: 'Personalized, not spammy' },
      { name: 'Side Hustle Launcher', slug: 'side-hustle-launcher', tagline: 'From idea to first dollar' },
    ],
  },
];

// ── Flow card ─────────────────────────────────────────────────────

function FlowCard({ flow, color, glow }: { flow: Flow; color: string; glow: string }) {
  return (
    <Link
      to={`/flows/${flow.slug}`}
      className="no-underline block group"
      style={{ flex: '1 1 0', minWidth: 0 }}
    >
      <div
        className="h-full rounded-xl p-4 transition-all duration-200"
        style={{
          background: 'var(--bg-secondary)',
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = `${color}35`;
          el.style.background = glow;
          el.style.transform = 'translateY(-2px)';
          el.style.boxShadow = `0 8px 24px ${glow}`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'rgba(255,255,255,0.06)';
          el.style.background = 'var(--bg-secondary)';
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
        }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color }}>
          {flow.name}
        </div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
          {flow.tagline}
        </div>
      </div>
    </Link>
  );
}

// ── Category tile ─────────────────────────────────────────────────

function CategoryTile({
  cat,
  selected,
  onClick,
}: {
  cat: Category;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 border text-center cursor-pointer"
      style={{
        background: selected ? cat.glow : 'transparent',
        borderColor: selected ? `${cat.color}40` : 'rgba(255,255,255,0.06)',
        boxShadow: selected ? `0 0 20px ${cat.glow}` : 'none',
        minWidth: 0,
        flex: '1 1 0',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.icon}</span>
      <span
        className="text-xs font-semibold leading-tight"
        style={{ color: selected ? cat.color : 'var(--text-secondary)' }}
      >
        {cat.label}
      </span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function CategoryPicker() {
  const [selected, setSelected] = useState<string>(CATEGORIES[0].id);

  const activeCat = CATEGORIES.find(c => c.id === selected)!;

  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">

      {/* Heading */}
      <div className="text-center mb-12">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          What do you{' '}
          <span className="gradient-text">actually need?</span>
        </h2>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Pick a category. See what's ready to run.
        </p>
      </div>

      {/* Category tiles */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORIES.map(cat => (
          <CategoryTile
            key={cat.id}
            cat={cat}
            selected={selected === cat.id}
            onClick={() => setSelected(cat.id)}
          />
        ))}
      </div>

      {/* Flow panel — animates on change */}
      <div
        key={selected}
        className="glass-card p-6"
        style={{
          borderColor: `${activeCat.color}18`,
          animation: 'fadeInUp 0.25s cubic-bezier(0.4,0,0.2,1) both',
        }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: activeCat.color, opacity: 0.8 }}>
              {activeCat.label}
            </span>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              "{activeCat.prompt}"
            </p>
          </div>
          <Link
            to={`/flows?category=${activeCat.id}`}
            className="text-xs no-underline flex items-center gap-1"
            style={{ color: activeCat.color, opacity: 0.8 }}
          >
            See all {activeCat.label} flows →
          </Link>
        </div>

        {/* Flow cards */}
        <div className="flex gap-3 flex-col sm:flex-row">
          {activeCat.flows.map(flow => (
            <FlowCard key={flow.slug} flow={flow} color={activeCat.color} glow={activeCat.glow} />
          ))}
        </div>

        {/* Footer nudge */}
        <div
          className="mt-5 pt-4 flex items-center justify-between flex-wrap gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            Each flow asks for your inputs, runs step-by-step, and saves outputs to memory.
          </span>
          <Link
            to="/get-started"
            className="text-xs no-underline font-semibold"
            style={{ color: activeCat.color }}
          >
            Get started free →
          </Link>
        </div>
      </div>

    </section>
  );
}
