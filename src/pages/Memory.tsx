export default function Memory() {
  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
  };

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

  const labelStyle = {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  };

  const factRowStyle = {
    display: 'flex' as const,
    gap: '8px',
    alignItems: 'flex-start' as const,
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border)',
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--cyan)',
    flexShrink: 0,
    marginTop: '6px',
  };

  const roomStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Your{' '}
            <span className="gradient-text">Memory</span>
          </h1>
          <p
            className="text-base"
            style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}
          >
            FlowFabric builds a private memory of who you are and what you've done — so every flow you run gets smarter over time.
          </p>
        </div>

        {/* L0 Identity Card */}
        <div className="mb-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Identity
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>always active</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span style={tagStyle}>L0</span>
              <span style={{ ...tagStyle, background: 'rgba(56, 189, 248, 0.06)', fontWeight: 400, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                50 tokens · always in context
              </span>
            </div>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              { label: 'Name', value: 'Alex Chen' },
              { label: 'Role', value: 'Software Engineer' },
              { label: 'Goal', value: 'Land a senior IC role at a growth-stage startup' },
              { label: 'Top Domains', value: 'career · finance · productivity' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <p style={labelStyle}>{item.label}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)', margin: '4px 0 0' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* L1 Critical Facts */}
        <div className="mb-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Critical Facts
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>always in context</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span style={tagStyle}>L1</span>
              <span style={{ ...tagStyle, background: 'rgba(56, 189, 248, 0.06)', fontWeight: 400, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                500 tokens · always in context
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              'Currently interviewing at 3 companies — highest priority is Meridian Systems.',
              'Target salary is $180K base. Current comp is $142K.',
              'Strongest skill: distributed systems. Weakness to address: system design communication.',
              'Prefers concise, action-focused outputs. No filler or hedging.',
              'Budget is tight — any spending suggestions should be under $50/month.',
            ].map((fact, i) => (
              <div key={i} style={{ ...factRowStyle, ...(i === 4 ? { borderBottom: 'none', paddingBottom: 0 } : {}) }}>
                <div style={dotStyle} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {fact}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* L2 Flow Rooms */}
        <div className="mb-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Flow Rooms
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>per-flow history and insights</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span style={tagStyle}>L2</span>
              <span style={{ ...tagStyle, background: 'rgba(56, 189, 248, 0.06)', fontWeight: 400, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                loaded on demand
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                flow: 'resume-builder',
                runs: 3,
                lastRun: '2 days ago',
                insight: 'Resume has been tailored for Meridian Systems. Strong on distributed systems bullets. Needs more quantified impact metrics in the final section.',
              },
              {
                flow: 'budget-builder',
                runs: 1,
                lastRun: '1 week ago',
                insight: 'Monthly surplus is $340. Identified $90/month in unused subscriptions. Flagged student loan payoff as highest-ROI move.',
              },
              {
                flow: 'career-pivot-advisor',
                runs: 2,
                lastRun: '3 weeks ago',
                insight: 'Evaluated 4 target companies. Meridian ranked highest on culture fit and comp ceiling. Staff IC path looks viable within 18 months.',
              },
            ].map((room) => (
              <div key={room.flow} style={roomStyle}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <code className="text-xs font-semibold" style={{ color: 'var(--cyan)' }}>
                    {room.flow}
                  </code>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {room.runs} run{room.runs !== 1 ? 's' : ''} · last {room.lastRun}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  {room.insight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Graph */}
        <div className="mb-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Knowledge Graph
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>temporal triple store · extracted automatically from flow outputs</p>
            </div>
            <span style={tagStyle}>KG</span>
          </div>

          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Every flow run extracts structured facts and stores them as time-stamped triples. Facts evolve — the graph knows what was true when.
          </p>

          <div className="rounded-xl p-4 font-mono text-xs" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {[
              ['user.role', 'software engineer'],
              ['user.salary_target', '$180K'],
              ['user.top_interview', 'Meridian Systems'],
              ['resume.last_version', '2026-04-08'],
              ['budget.monthly_surplus', '$340'],
              ['career.readiness_score', '0.74 (↑ from 0.61)'],
            ].map(([key, value]) => (
              <div key={key} className="flex gap-2 mb-1.5 last:mb-0 flex-wrap">
                <span style={{ color: 'var(--cyan)' }}>{key}</span>
                <span style={{ color: 'var(--text-secondary)' }}>→</span>
                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* L3 Semantic Index note */}
        <div className="mb-8" style={{ ...cardStyle, padding: '20px 28px' }}>
          <div className="flex items-start gap-3">
            <span style={tagStyle}>L3</span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Semantic Index
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Cross-flow knowledge recalled on demand. When you run a new flow, FlowFabric searches your full history for relevant context — even from unrelated flows — and surfaces it automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          Your memory is stored privately at{' '}
          <code className="text-xs" style={{ color: 'var(--cyan)' }}>~/.skillchain/</code>{' '}
          on your machine. It never leaves your device.
        </p>

      </div>
    </div>
  );
}
