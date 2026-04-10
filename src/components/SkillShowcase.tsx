import { Link } from 'react-router-dom';
import Badge from './Badge';

interface ShowcaseItem {
  name: string;
  domain: string;
  trustScore: number;
  input: string;
  output: string;
}

const showcaseItems: ShowcaseItem[] = [
  {
    name: 'Career Launchpad',
    domain: 'career',
    trustScore: 94,
    input: 'I want to switch from marketing to product management',
    output: `Flow: career-pivot → resume-builder → interview-prep\n\n✓ Gap analysis: need PM certification + SQL basics\n✓ Resume rewritten: 3 PM-targeted bullet points\n✓ Interview prep: 12 behavioral questions with STAR answers\n✓ Salary range: $95K-$125K based on market data\n\nTimeline: 8-12 weeks to job-ready`,
  },
  {
    name: 'Startup Validation',
    domain: 'business',
    trustScore: 93,
    input: 'AI tool that helps restaurants manage food waste',
    output: `Flow: idea-validator → market-research → pricing-strategy\n\n✓ Market size: $2.1B by 2028 (12% CAGR)\n✓ Competitors: 3 direct, none using predictive AI\n✓ Validation score: 78/100 — strong unit economics\n✓ Pricing: $299/mo SaaS, break-even at 40 restaurants\n✓ Risk: integration with existing POS systems`,
  },
  {
    name: 'Money Makeover',
    domain: 'finance',
    trustScore: 95,
    input: 'I make $5,000/month, rent is $1,500, $8K credit card debt',
    output: `Flow: budget-builder → debt-payoff → savings-goal\n\n✓ Budget: $1,550 flexible → $800 to debt, $250 emergency\n✓ Debt-free in 11 months (avalanche method)\n✓ 3 subscriptions cancelled: save $47/mo\n✓ Emergency fund hits $3K by month 14\n✓ Then redirect $800/mo → investment account`,
  },
  {
    name: 'Weekly Ops',
    domain: 'life',
    trustScore: 92,
    input: 'Overwhelmed. 3 deadlines, kid has soccer, house is a mess.',
    output: `Flow: weekly-review → daily-planner → habit-builder\n\n✓ Priority stack: deadline A (Tue) > B (Thu) > C (Fri)\n✓ Mon: deep work AM, soccer pickup 4pm, batch cook PM\n✓ Tue: deliver A, start B, 20min declutter\n✓ Wed: B sprint, kid homework, laundry\n✓ Thu: deliver B, start C, soccer practice\n✓ Habit: 20min daily declutter → house reset by Sunday`,
  },
];

function TrustBadge({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full animate-trust-pulse"
      style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        color: 'var(--cyan)',
        fontWeight: 500,
      }}
    >
      &#10003; {score}% trust
    </span>
  );
}

function ShowcaseCard({ item, index }: { item: ShowcaseItem; index: number }) {
  return (
    <div
      className={`glass-card p-5 animate-fade-in-up stagger-${index + 1}`}
      style={{ cursor: 'default' }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-semibold text-sm" style={{ color: 'var(--cyan)' }}>{item.name}</span>
        <Badge variant="domain" label={item.domain} />
        <TrustBadge score={item.trustScore} />
      </div>

      {/* Input */}
      <div
        className="rounded-lg p-3 mb-2"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid transparent',
          transition: 'border-color 0.3s',
        }}
      >
        <div className="text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Input
        </div>
        <pre
          className="text-xs m-0"
          style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {item.input}
        </pre>
      </div>

      {/* Animated Arrow */}
      <div
        className="text-center my-2"
        style={{
          color: 'var(--cyan)',
          fontSize: '16px',
          animation: 'arrow-bounce 2s ease-in-out infinite',
        }}
      >
        &#x2193;
      </div>

      {/* Output */}
      <div
        className="rounded-lg p-3 mb-3"
        style={{
          background: 'rgba(56, 189, 248, 0.03)',
          border: '1px solid rgba(56, 189, 248, 0.08)',
          transition: 'all 0.3s',
        }}
      >
        <div className="text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: 'var(--cyan)' }}>
          Output
        </div>
        <pre
          className="text-xs m-0"
          style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {item.output}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>FREE</span>
          <span>&middot;</span>
          <span>OPEN license</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px', alignItems: 'flex-end' }}>
          <Link
            to="/get-started"
            className="text-xs no-underline font-medium"
            style={{ color: 'var(--cyan)', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textShadow = '0 0 12px rgba(56, 189, 248, 0.3)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textShadow = 'none'; }}
          >
            Use this flow &rarr;
          </Link>
          <Link
            to="/compose"
            className="text-xs no-underline"
            style={{ color: 'var(--text-secondary)', transition: 'all 0.3s', opacity: 0.6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; }}
          >
            Develop new flow &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SkillShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            See what flows can do
          </h2>
          <p className="text-sm md:text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Every flow is validated. Every output has a trust score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showcaseItems.map((item, i) => (
            <ShowcaseCard key={item.name} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
