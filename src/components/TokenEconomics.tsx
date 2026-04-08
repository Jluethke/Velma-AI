export default function TokenEconomics() {
  const feeSegments = [
    { label: 'Creators', percent: 70, color: 'var(--cyan)' },
    { label: 'Validators', percent: 15, color: 'var(--green)' },
    { label: 'Treasury', percent: 10, color: 'var(--purple)' },
    { label: 'Burn', percent: 5, color: 'var(--red)' },
  ];

  const tiers = [
    { tier: 'Explorer', price: 'Free', limit: '5 skills/day' },
    { tier: 'Builder', price: '50 TRUST/mo', limit: '50 skills/day' },
    { tier: 'Professional', price: '200 TRUST/mo', limit: '200 skills/day' },
    { tier: 'Enterprise', price: 'Custom', limit: 'Unlimited' },
  ];

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#ffffff' }}>
        Token Economics
      </h2>
      <p className="text-center mb-16 text-sm" style={{ color: 'var(--text-secondary)' }}>
        TRUST -- earned through contribution, not purchased.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token stats card */}
        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--cyan)' }}>
            TRUST Token
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Name', value: 'FlowFabric Trust Token' },
              { label: 'Symbol', value: 'TRUST' },
              { label: 'Supply', value: '1,000,000,000 (hard cap)' },
              { label: 'Chain', value: 'Base (Ethereum L2)' },
              { label: 'Deflationary', value: '5% burned on every transaction' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee split */}
        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--cyan)' }}>
            Fee Distribution
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            No public sale. Tokens are earned through contribution -- publishing skills, validating quality, and participating in governance. The only way to get TRUST is to create value.
          </p>

          {/* Bar */}
          <div className="flex rounded-lg overflow-hidden h-8 mb-4">
            {feeSegments.map((seg) => (
              <div
                key={seg.label}
                className="flex items-center justify-center text-xs font-bold"
                style={{
                  width: `${seg.percent}%`,
                  background: seg.color,
                  color: '#0a0a0f',
                }}
              >
                {seg.percent}%
              </div>
            ))}
          </div>

          {/* Labels */}
          <div className="flex gap-4 flex-wrap">
            {feeSegments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: seg.color }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription tiers */}
      <div
        className="mt-8 rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-6 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Tier</th>
              <th className="text-left px-6 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Price</th>
              <th className="text-left px-6 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Daily Skills</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr
                key={tier.tier}
                style={{
                  background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <td className="px-6 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{tier.tier}</td>
                <td className="px-6 py-3" style={{ color: tier.price === 'Free' ? 'var(--green)' : 'var(--gold)' }}>{tier.price}</td>
                <td className="px-6 py-3" style={{ color: 'var(--text-secondary)' }}>{tier.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
