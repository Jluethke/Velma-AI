import CodeBlock from './CodeBlock';

const steps = [
  {
    number: '01',
    title: 'Install',
    description: 'Generate your node identity, select your AI agent (Claude, GPT, Gemini, Cursor, or other), and register on-chain. One command to join the network.',
    code: 'flowfabric init --agent claude',
  },
  {
    number: '02',
    title: 'Discover',
    description: 'Search thousands of validated skills. Filter by domain, tags, trust score, and success rate. See validation history before you import.',
    code: 'flowfabric discover --domain financial --min-trust 0.6',
  },
  {
    number: '03',
    title: 'Import',
    description: 'Download, validate locally, and install to the right location for your AI agent. Skills are automatically adapted to your platform -- Claude .md, GPT actions, Cursor rules, or raw procedures.',
    code: 'flowfabric import 42  # installs to your agent\'s skill directory',
  },
  {
    number: '04',
    title: 'Earn',
    description: 'Package your skill, set a price, and publish. Validators test it. Buyers pay in TRUST tokens. You earn 70% of every sale.',
    code: 'flowfabric publish ./my-skill/ --price 100',
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#ffffff' }}>
        How It Works
      </h2>
      <p className="text-center mb-16 text-sm" style={{ color: 'var(--text-secondary)' }}>
        From install to earning in four commands.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col gap-4">
            {/* Step number */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: 'rgba(0, 255, 200, 0.1)',
                  color: 'var(--cyan)',
                  border: '1px solid rgba(0, 255, 200, 0.3)',
                }}
              >
                {step.number}
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>
                {step.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {step.description}
            </p>

            {/* Code block */}
            <CodeBlock code={step.code} language="bash" />
          </div>
        ))}
      </div>
    </section>
  );
}
