const cards = [
  {
    title: 'Publish',
    description: 'Package any reusable AI procedure as a .skillpack -- parsing, analysis, generation, automation. Publish once, and it works across Claude, GPT, Gemini, Cursor, or any AI agent. Earn 70% of every purchase, paid in TRUST tokens.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    accent: 'var(--cyan)',
    accentBg: 'rgba(0, 255, 200, 0.08)',
  },
  {
    title: 'Discover',
    description: 'Find validated flows that work with Claude, GPT, Gemini, Cursor, or any AI agent. Every result has been shadow-tested against real outputs. Filter by trust score, success rate, and validation count. Import with one command.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    accent: 'var(--green)',
    accentBg: 'rgba(0, 255, 136, 0.08)',
  },
  {
    title: 'Trust',
    description: 'Every published flow runs through 5 independent shadow validations. Validators compare outputs against known-good results using Jaccard + bigram similarity scoring. Flows that pass earn trust. Flows that fail get quarantined. No star ratings. No fake reviews. Math.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    accent: 'var(--purple)',
    accentBg: 'rgba(170, 136, 255, 0.08)',
  },
];

export default function ValueCards() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="group p-6 rounded-xl transition-all duration-300"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = card.accent;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${card.accentBg}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ background: card.accentBg, color: card.accent }}
            >
              {card.icon}
            </div>

            <h3 className="text-xl font-semibold mb-3" style={{ color: card.accent }}>
              {card.title}
            </h3>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
