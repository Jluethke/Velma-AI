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
    name: 'code-review',
    domain: 'developer',
    trustScore: 93,
    input: `function getUser(id) {\n  let data = fetch("/api/users/" + id)\n  return data.json()\n}`,
    output: `async function getUser(id: string) {\n  const res = await fetch(\`/api/users/\${id}\`)\n  if (!res.ok) throw new Error(res.statusText)\n  return res.json()\n}`,
  },
  {
    name: 'budget-builder',
    domain: 'money',
    trustScore: 94,
    input: 'I make $5,000/month, rent is $1,500',
    output: `Rent:       $1,500  (30%)\nSavings:    $1,000  (20%)\nFood:         $400  (8%)\nTransport:    $300  (6%)\nUtilities:    $250  (5%)\nFlexible:   $1,550  (31%)`,
  },
  {
    name: 'resume-builder',
    domain: 'career',
    trustScore: 91,
    input: 'Software engineer, 3 years experience, React & Node',
    output: `• Led migration of legacy jQuery app to React 18, reducing load time by 40% and improving Core Web Vitals\n• Designed and shipped RESTful API serving 2M+ requests/day with 99.9% uptime using Node.js and PostgreSQL\n• Mentored 2 junior engineers through code reviews, reducing PR cycle time by 30%`,
  },
  {
    name: 'daily-planner',
    domain: 'life',
    trustScore: 92,
    input: 'I have 3 meetings and a deadline tomorrow',
    output: `08:00  Deep work — deadline task (high energy)\n10:00  Meeting 1 — standup (15 min)\n10:30  Deep work — deadline sprint\n12:00  Lunch + walk\n13:00  Meeting 2 — project sync\n14:00  Meeting 3 — 1:1\n15:00  Buffer — wrap up deadline\n16:00  Admin & tomorrow's prep`,
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
        <Link
          to={`/skill/${item.name}`}
          className="text-xs no-underline font-medium"
          style={{
            color: 'var(--cyan)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.textShadow = '0 0 12px rgba(56, 189, 248, 0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.textShadow = 'none';
          }}
        >
          Try this skill &rarr;
        </Link>
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
            See what skills can do
          </h2>
          <p className="text-sm md:text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Every skill is validated. Every output has a trust score.
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
