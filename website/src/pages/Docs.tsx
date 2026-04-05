import { useState, useEffect } from 'react';
import CodeBlock from '../components/CodeBlock';

const sections = [
  { id: 'prerequisites', label: 'Prerequisites' },
  { id: 'installation', label: 'Installation' },
  { id: 'init', label: 'Initialize Your Node' },
  { id: 'publishing', label: 'Publishing a Skill' },
  { id: 'discovering', label: 'Discovering Skills' },
  { id: 'importing', label: 'Importing Skills' },
  { id: 'validating', label: 'Validating Skills' },
  { id: 'staking', label: 'Staking' },
  { id: 'status', label: 'Checking Status' },
  { id: 'tiers', label: 'Subscription Tiers' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('prerequisites');

  useEffect(() => {
    const handleScroll = () => {
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(section.id);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headingStyle = { color: '#ffffff' };
  const textStyle = { color: 'var(--text-secondary)' };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <div className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
              Getting Started
            </div>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-xs py-1.5 no-underline transition-colors"
                style={{
                  color: activeSection === s.id ? 'var(--cyan)' : 'var(--text-secondary)',
                  borderLeft: activeSection === s.id ? '2px solid var(--cyan)' : '2px solid transparent',
                  paddingLeft: '12px',
                }}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={headingStyle}>
            Getting Started
          </h1>
          <p className="text-sm mb-12" style={textStyle}>
            Set up your node, publish a skill, and start earning in under 10 minutes.
          </p>

          {/* Prerequisites */}
          <section id="prerequisites" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Prerequisites</h2>
            <ul className="space-y-2 text-sm list-none p-0" style={textStyle}>
              <li className="flex items-center gap-2">
                <span style={{ color: 'var(--cyan)' }}>&#8250;</span> Python 3.10 or higher
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: 'var(--cyan)' }}>&#8250;</span> pip (any recent version)
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: 'var(--cyan)' }}>&#8250;</span> An Ethereum wallet (for mainnet; testnet generates one for you)
              </li>
            </ul>
          </section>

          {/* Installation */}
          <section id="installation" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Installation</h2>
            <p className="text-sm mb-4" style={textStyle}>
              This installs the <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>skillchain</code> CLI and Python SDK.
            </p>
            <CodeBlock code="pip install skillchain" language="bash" filename="terminal" />
            <p className="text-sm mt-4 mb-4" style={textStyle}>Verify the installation:</p>
            <CodeBlock code="skillchain --version" language="bash" filename="terminal" />
          </section>

          {/* Init */}
          <section id="init" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Initialize Your Node</h2>
            <CodeBlock code="skillchain init --agent claude" language="bash" filename="terminal" />
            <p className="text-sm mt-4 mb-4" style={textStyle}>
              You will be prompted for a passphrase and your preferred AI agent. This encrypts your node's Ed25519 signing key and configures skill installation paths for your platform. Do not lose the passphrase -- there is no recovery mechanism.
            </p>
            <p className="text-sm mb-4" style={textStyle}>
              Supported <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>--agent</code> values: <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>claude</code>, <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>gpt</code>, <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>gemini</code>, <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>cursor</code>, <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>auto</code> (detects installed agents)
            </p>
            <p className="text-sm mb-4" style={textStyle}>The command does four things:</p>
            <ol className="space-y-2 text-sm pl-5 mb-6" style={textStyle}>
              <li><strong style={{ color: 'var(--text-primary)' }}>Generates your node identity</strong> -- An Ed25519 keypair stored in ~/.skillchain/</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Detects your AI agent</strong> -- Configures skill format and install paths for your platform</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Creates your config</strong> -- Network settings, wallet address, domain preferences</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Registers on-chain</strong> -- Your node ID is recorded in the NodeRegistry contract</li>
            </ol>
            <CodeBlock
              code={`SkillChain initialised!\n  Node ID:    node_a1b2c3d4...\n  Agent:      claude\n  Skills dir: ~/.claude/skills/\n  Config:     ~/.skillchain/\n  Network:    sepolia\n  Wallet:     0x1234...abcd`}
              filename="output"
            />
            <h3 className="text-lg font-semibold mt-8 mb-3" style={headingStyle}>Skill Install Paths by Platform</h3>
            <div className="overflow-x-auto rounded-lg mb-4" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Agent</th>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Format</th>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Install Path</th>
                  </tr>
                </thead>
                <tbody style={textStyle}>
                  {[
                    { agent: 'Claude', format: '.md procedures', path: '~/.claude/skills/' },
                    { agent: 'GPT', format: 'Action schemas', path: '~/.openai/skills/' },
                    { agent: 'Gemini', format: 'Structured prompts', path: '~/.gemini/skills/' },
                    { agent: 'Cursor', format: 'Rule files', path: '.cursor/rules/' },
                    { agent: 'Generic', format: 'Raw procedures', path: '~/.skillchain/skills/' },
                  ].map(row => (
                    <tr key={row.agent} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{row.agent}</td>
                      <td className="px-4 py-2">{row.format}</td>
                      <td className="px-4 py-2"><code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>{row.path}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-lg font-semibold mt-8 mb-3" style={headingStyle}>Network Selection</h3>
            <p className="text-sm mb-4" style={textStyle}>
              By default, init connects to the Sepolia testnet. To use mainnet:
            </p>
            <CodeBlock code="skillchain init --network mainnet" language="bash" filename="terminal" />
          </section>

          {/* Publishing */}
          <section id="publishing" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Publishing Your First Skill</h2>

            <h3 className="text-base font-semibold mt-6 mb-3" style={headingStyle}>1. Create the skill directory</h3>
            <p className="text-sm mb-4" style={textStyle}>
              A skill is a directory with at minimum a skill.md file:
            </p>
            <CodeBlock
              code={`my-skill/\n  skill.md           # The procedure (required)\n  tests/             # Test cases (recommended)\n    test_basic.json   # Input/output pairs\n  README.md          # Documentation (optional)`}
              filename="structure"
            />

            <h3 className="text-base font-semibold mt-6 mb-3" style={headingStyle}>2. Write the skill</h3>
            <p className="text-sm mb-4" style={textStyle}>
              skill.md contains structured steps that describe the procedure:
            </p>
            <CodeBlock
              code={`# Parse CSV Financial Data\n\n## Description\nParse a CSV file containing financial data.\n\n## Steps\n1. Read the CSV file and detect the delimiter\n2. Identify columns containing numeric data\n3. Compute summary statistics\n4. Flag outliers beyond 3 standard deviations\n5. Return a structured JSON summary\n\n## Domain\nfinancial\n\n## Tags\ncsv, parsing, statistics`}
              filename="skill.md"
            />

            <h3 className="text-base font-semibold mt-6 mb-3" style={headingStyle}>3. Add test cases</h3>
            <p className="text-sm mb-4" style={textStyle}>
              Test cases are used during shadow validation. Validators run your skill against these inputs and compare outputs using similarity scoring.
            </p>

            <h3 className="text-base font-semibold mt-6 mb-3" style={headingStyle}>4. Publish</h3>
            <CodeBlock
              code={`skillchain publish ./my-skill/ --price 100 --domain financial --tags "csv,parsing,statistics"`}
              language="bash"
              filename="terminal"
            />
            <div className="mt-4 overflow-x-auto" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Flag</th>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Default</th>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Description</th>
                  </tr>
                </thead>
                <tbody style={textStyle}>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-2"><code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>--price</code></td>
                    <td className="px-4 py-2">0</td>
                    <td className="px-4 py-2">Price in TRUST tokens (0 = free)</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-2"><code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>--domain</code></td>
                    <td className="px-4 py-2">general</td>
                    <td className="px-4 py-2">Skill domain for discovery</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-2"><code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>--tags</code></td>
                    <td className="px-4 py-2">(none)</td>
                    <td className="px-4 py-2">Comma-separated tags</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-2"><code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>--license</code></td>
                    <td className="px-4 py-2">MIT</td>
                    <td className="px-4 py-2">License identifier</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Discovering */}
          <section id="discovering" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Discovering Skills</h2>
            <p className="text-sm mb-4" style={textStyle}>Basic search returns the top 20 skills sorted by trust and validation count:</p>
            <CodeBlock code="skillchain discover" language="bash" filename="terminal" />
            <p className="text-sm mt-4 mb-4" style={textStyle}>Filtered search:</p>
            <CodeBlock
              code={`skillchain discover --domain financial --min-trust 0.6 --max-results 10\nskillchain discover --tags "parsing,csv" -q "financial data"`}
              language="bash"
              filename="terminal"
            />
          </section>

          {/* Importing */}
          <section id="importing" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Importing Skills</h2>
            <p className="text-sm mb-4" style={textStyle}>
              This downloads the .skillpack, runs a local shadow validation, and installs the skill.
            </p>
            <CodeBlock code="skillchain import 42" language="bash" filename="terminal" />
            <p className="text-sm mt-4 mb-4" style={textStyle}>Custom install directory:</p>
            <CodeBlock code="skillchain import 42 --target-dir ./my-project/skills/" language="bash" filename="terminal" />
          </section>

          {/* Validating */}
          <section id="validating" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Validating Skills</h2>
            <p className="text-sm mb-4" style={textStyle}>
              Validators earn 15% of every future purchase of skills they validate.
            </p>
            <CodeBlock code="skillchain validate 42" language="bash" filename="terminal" />
            <CodeBlock
              code={`Validation: PASSED\n\n Run  Similarity  Time (s)  Error\n   1       0.872      1.24  -\n   2       0.891      1.18  -\n   3       0.856      1.31  -\n   4       0.903      1.15  -\n   5       0.845      1.27  -\n\nMatch rate: 100% (5/5)\nAvg similarity: 0.873`}
              filename="output"
            />
          </section>

          {/* Staking */}
          <section id="staking" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Staking</h2>
            <p className="text-sm mb-4" style={textStyle}>
              Stake TRUST tokens to unlock higher subscription tiers and increase your network standing:
            </p>
            <CodeBlock code="skillchain stake 100" language="bash" filename="terminal" />
            <p className="text-sm mt-4 mb-4" style={textStyle}>To unstake:</p>
            <CodeBlock code="skillchain stake 100 --unstake" language="bash" filename="terminal" />
          </section>

          {/* Status */}
          <section id="status" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Checking Your Status</h2>
            <CodeBlock code="skillchain status" language="bash" filename="terminal" />
            <CodeBlock
              code={`SkillChain Node Status\n  Node ID:       node_a1b2c3d4...\n  Wallet:        0x1234...abcd\n  Network:       sepolia\n  Balance:       0.450000 ETH\n  Trust Score:   0.6821\n  Staking Tier:  1\n  Config Dir:    ~/.skillchain/\n  Domains:       financial, automation`}
              filename="output"
            />
          </section>

          {/* Tiers */}
          <section id="tiers" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Subscription Tiers</h2>
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Tier</th>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Cost</th>
                    <th className="text-left px-4 py-2" style={{ color: 'var(--text-secondary)' }}>Daily Limit</th>
                  </tr>
                </thead>
                <tbody style={textStyle}>
                  {[
                    { tier: 'Explorer', cost: 'Free', limit: '5 skills/day' },
                    { tier: 'Builder', cost: '50 TRUST/mo', limit: '50 skills/day' },
                    { tier: 'Professional', cost: '200 TRUST/mo', limit: '200 skills/day' },
                    { tier: 'Enterprise', cost: 'Custom', limit: 'Unlimited' },
                  ].map(t => (
                    <tr key={t.tier} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{t.tier}</td>
                      <td className="px-4 py-2" style={{ color: t.cost === 'Free' ? 'var(--green)' : 'var(--gold)' }}>{t.cost}</td>
                      <td className="px-4 py-2">{t.limit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Troubleshooting</h2>
            <div className="space-y-6">
              {[
                { error: '"SkillChainError: no config found"', fix: 'Run skillchain init first.' },
                { error: '"Marketplace: daily limit"', fix: 'You have hit your subscription tier\'s daily skill limit. Upgrade your tier or wait until tomorrow (UTC midnight reset).' },
                { error: '"Marketplace: subscription expired"', fix: 'Renew your subscription through the Marketplace contract. Explorer tier never expires.' },
                { error: 'Validation fails with low similarity', fix: 'Your skill\'s outputs may be non-deterministic. Add more specific test cases with tighter expected outputs. Shadow validation requires 75% similarity across 5 runs.' },
              ].map(item => (
                <div key={item.error}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--red)' }}>{item.error}</h3>
                  <p className="text-sm" style={textStyle}>{item.fix}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
