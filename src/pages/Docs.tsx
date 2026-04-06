import { useState, useEffect } from 'react';
import CodeBlock from '../components/CodeBlock';

// ── Section definitions per tab ─────────────────────────────────────

const quickStartSections = [
  { id: 'install', label: 'Install' },
  { id: 'first-run', label: 'First Run' },
  { id: 'browse-skills', label: 'Browse Skills' },
  { id: 'run-chain', label: 'Run a Chain' },
  { id: 'create-skill', label: 'Create a Skill' },
  { id: 'faq', label: 'FAQ' },
];

const web3Sections = [
  { id: 'w3-prerequisites', label: 'Prerequisites' },
  { id: 'w3-init', label: 'Initialize Node' },
  { id: 'w3-publishing', label: 'Publishing' },
  { id: 'w3-validating', label: 'Validating' },
  { id: 'w3-staking', label: 'Staking' },
  { id: 'w3-status', label: 'Status' },
  { id: 'w3-tiers', label: 'Tiers' },
  { id: 'w3-troubleshooting', label: 'Troubleshooting' },
];

// ── Styles ──────────────────────────────────────────────────────────

const headingStyle = { color: '#ffffff' };
const textStyle = { color: 'var(--text-secondary)' };

// ── Quick Start Content ─────────────────────────────────────────────

function QuickStartContent() {
  return (
    <>
      {/* Install */}
      <section id="install" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Install</h2>
        <p className="text-sm mb-4" style={textStyle}>
          One download. Double-click. Done.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            href="/install.bat"
            download="SkillChain-Install.bat"
            className="flex items-center gap-3 rounded-lg px-5 py-4 no-underline transition-all"
            style={{
              background: 'rgba(170,136,255,0.08)',
              border: '1px solid rgba(170,136,255,0.25)',
            }}
          >
            <span className="text-xl">&#x1F5A5;</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Windows</div>
              <div className="text-xs" style={textStyle}>Download .bat</div>
            </div>
          </a>
          <a
            href="/install.sh"
            download="SkillChain-Install.sh"
            className="flex items-center gap-3 rounded-lg px-5 py-4 no-underline transition-all"
            style={{
              background: 'rgba(0,255,200,0.08)',
              border: '1px solid rgba(0,255,200,0.25)',
            }}
          >
            <span className="text-xl">&#x1F34E;</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mac / Linux</div>
              <div className="text-xs" style={textStyle}>Download .sh</div>
            </div>
          </a>
        </div>

        <p className="text-sm mb-2" style={textStyle}>The installer handles everything:</p>
        <ul className="space-y-1.5 text-sm list-none p-0" style={textStyle}>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Installs Python if you don't have it</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Installs SkillChain SDK + 120 skills + 65 chains</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Auto-configures Claude Code (or your AI agent)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Creates your trainer profile</li>
        </ul>
      </section>

      {/* First Run */}
      <section id="first-run" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>First Run</h2>
        <p className="text-sm mb-4" style={textStyle}>
          After installing, restart Claude Code. That's it. Just talk normally:
        </p>
        <div className="space-y-3 mb-4">
          {[
            '"Help me budget for this month"',
            '"Review this pull request"',
            '"I feel stuck in my career"',
            '"Prepare me for a job interview"',
          ].map((prompt, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: 'rgba(0,255,200,0.03)', border: '1px solid rgba(0,255,200,0.1)' }}
            >
              <span className="text-xs" style={{ color: 'var(--cyan)' }}>&#9656;</span>
              <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{prompt}</span>
            </div>
          ))}
        </div>
        <p className="text-sm" style={textStyle}>
          SkillChain automatically finds the right skill chain for what you need and walks you through it. No commands to memorize.
        </p>
      </section>

      {/* Browse Skills */}
      <section id="browse-skills" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Browse Skills</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Visit the <a href="/skills" style={{ color: 'var(--cyan)' }}>Skills</a> page to browse all available skills, or ask Claude directly:
        </p>
        <CodeBlock code={`"What skills do I have?"\n"Show me skills for budgeting"\n"Find a skill for code review"`} filename="talk to Claude" />
        <p className="text-sm mt-4" style={textStyle}>
          4 sample skills are free. Connect a wallet with TRUST tokens to unlock all 120+.
        </p>
      </section>

      {/* Run a Chain */}
      <section id="run-chain" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Run a Chain</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Skill chains are multi-step pipelines that combine skills automatically. Browse them on the <a href="/chains" style={{ color: 'var(--cyan)' }}>Chains</a> page, or just describe what you need:
        </p>
        <CodeBlock code={`"Run the code review chain"\n"I need to prepare for an interview"\n"Help me write and optimize my resume"`} filename="talk to Claude" />
        <p className="text-sm mt-4 mb-4" style={textStyle}>
          Each chain runs a sequence of skills in order. For example, the <strong style={{ color: 'var(--text-primary)' }}>code-review</strong> chain runs:
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {['repo-health', 'code-review', 'security-hardening'].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded" style={{ background: 'rgba(0,255,200,0.06)', border: '1px solid rgba(0,255,200,0.12)', color: 'var(--cyan)' }}>{s}</span>
              {i < 2 && <span style={{ color: 'var(--text-secondary)' }}>&rarr;</span>}
            </span>
          ))}
        </div>
        <p className="text-sm" style={textStyle}>
          You earn XP and can unlock achievements as you run chains.
        </p>
      </section>

      {/* Create a Skill */}
      <section id="create-skill" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Create a Skill</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Want to create your own skill? Just tell Claude:
        </p>
        <CodeBlock code={`"Create a skill that parses CSV financial data"`} filename="talk to Claude" />
        <p className="text-sm mt-4 mb-4" style={textStyle}>
          Or do it manually. A skill is a directory with a <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>skill.md</code> file:
        </p>
        <CodeBlock
          code={`my-skill/\n  skill.md           # The procedure (required)\n  tests/             # Test cases (recommended)\n    test_basic.json\n  README.md          # Documentation (optional)`}
          filename="structure"
        />
        <CodeBlock
          code={`# Parse CSV Financial Data\n\n## Steps\n1. Read the CSV file and detect the delimiter\n2. Identify columns containing numeric data\n3. Compute summary statistics\n4. Flag outliers beyond 3 standard deviations\n5. Return a structured JSON summary\n\n## Domain\nfinancial\n\n## Tags\ncsv, parsing, statistics`}
          filename="skill.md"
        />
        <p className="text-sm mt-4" style={textStyle}>
          Publish it to the marketplace and other users can discover and use your skill.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>FAQ</h2>
        <div className="space-y-6">
          {[
            { q: 'Do I need to know crypto to use this?', a: 'No. Install, restart Claude Code, talk normally. The crypto layer (TRUST tokens, staking, on-chain validation) is optional and only matters if you want to publish skills or unlock the full marketplace.' },
            { q: 'What AI agents does it work with?', a: 'Claude Code, GPT, Gemini, Cursor, and any MCP-compatible agent. The installer auto-detects what you have.' },
            { q: 'Is it free?', a: 'Yes. 4 sample skills and the code-review chain are completely free. Connect a wallet with TRUST tokens to unlock all 120+ skills and 65+ chains.' },
            { q: 'How do I earn TRUST tokens?', a: 'Publish skills that others use, validate skills for quality, or participate in governance. There is no public sale — you earn them by contributing.' },
            { q: 'Where do skills get installed?', a: 'Depends on your agent. Claude: ~/.claude/skills/. Cursor: .cursor/rules/. GPT: ~/.openai/skills/. The installer handles this automatically.' },
          ].map((item, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--cyan)' }}>{item.q}</h3>
              <p className="text-sm" style={textStyle}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ── Web3 Content ────────────────────────────────────────────────────

function Web3Content() {
  return (
    <>
      {/* Prerequisites */}
      <section id="w3-prerequisites" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Prerequisites</h2>
        <ul className="space-y-2 text-sm list-none p-0" style={textStyle}>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Python 3.10 or higher</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> pip (any recent version)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> An Ethereum wallet (MetaMask, etc.)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Base mainnet ETH (for gas)</li>
        </ul>
      </section>

      {/* Init Node */}
      <section id="w3-init" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Initialize Your Node</h2>
        <CodeBlock code="skillchain init --agent claude" language="bash" filename="terminal" />
        <p className="text-sm mt-4 mb-4" style={textStyle}>
          This encrypts your node's Ed25519 signing key and configures skill installation paths. Do not lose the passphrase — there is no recovery mechanism.
        </p>
        <p className="text-sm mb-4" style={textStyle}>The command does four things:</p>
        <ol className="space-y-2 text-sm pl-5 mb-6" style={textStyle}>
          <li><strong style={{ color: 'var(--text-primary)' }}>Generates your node identity</strong> — Ed25519 keypair stored in ~/.skillchain/</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Detects your AI agent</strong> — Configures skill format and install paths</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Creates your config</strong> — Network settings, wallet address, domain preferences</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Registers on-chain</strong> — Node ID recorded in the NodeRegistry contract</li>
        </ol>
        <CodeBlock
          code={`SkillChain initialised!\n  Node ID:    node_a1b2c3d4...\n  Agent:      claude\n  Skills dir: ~/.claude/skills/\n  Config:     ~/.skillchain/\n  Network:    base\n  Wallet:     0x1234...abcd`}
          filename="output"
        />

        <h3 className="text-lg font-semibold mt-8 mb-3" style={headingStyle}>Skill Install Paths by Platform</h3>
        <div className="overflow-x-auto rounded-lg mb-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Agent</th>
                <th className="text-left px-4 py-2" style={textStyle}>Format</th>
                <th className="text-left px-4 py-2" style={textStyle}>Install Path</th>
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
      </section>

      {/* Publishing */}
      <section id="w3-publishing" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Publishing Skills On-Chain</h2>
        <CodeBlock
          code={`skillchain publish ./my-skill/ --price 100 --domain financial --tags "csv,parsing,statistics"`}
          language="bash"
          filename="terminal"
        />
        <div className="mt-4 overflow-x-auto" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Flag</th>
                <th className="text-left px-4 py-2" style={textStyle}>Default</th>
                <th className="text-left px-4 py-2" style={textStyle}>Description</th>
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

      {/* Validating */}
      <section id="w3-validating" className="mb-12">
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
      <section id="w3-staking" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Staking</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Stake TRUST tokens to unlock higher subscription tiers and increase your network standing:
        </p>
        <CodeBlock code="skillchain stake 100" language="bash" filename="terminal" />
        <p className="text-sm mt-4 mb-4" style={textStyle}>To unstake:</p>
        <CodeBlock code="skillchain stake 100 --unstake" language="bash" filename="terminal" />
      </section>

      {/* Status */}
      <section id="w3-status" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Checking Your Status</h2>
        <CodeBlock code="skillchain status" language="bash" filename="terminal" />
        <CodeBlock
          code={`SkillChain Node Status\n  Node ID:       node_a1b2c3d4...\n  Wallet:        0x1234...abcd\n  Network:       sepolia\n  Balance:       0.450000 ETH\n  Trust Score:   0.6821\n  Staking Tier:  1\n  Config Dir:    ~/.skillchain/\n  Domains:       financial, automation`}
          filename="output"
        />
      </section>

      {/* Tiers */}
      <section id="w3-tiers" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Subscription Tiers</h2>
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Tier</th>
                <th className="text-left px-4 py-2" style={textStyle}>Cost</th>
                <th className="text-left px-4 py-2" style={textStyle}>Daily Limit</th>
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
      <section id="w3-troubleshooting" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Troubleshooting</h2>
        <div className="space-y-6">
          {[
            { error: '"SkillChainError: no config found"', fix: 'Run skillchain init first.' },
            { error: '"Marketplace: daily limit"', fix: 'You have hit your subscription tier\'s daily skill limit. Upgrade your tier or wait until tomorrow (UTC midnight reset).' },
            { error: '"Marketplace: subscription expired"', fix: 'Renew your subscription through the Marketplace contract. Explorer tier never expires.' },
            { error: 'Validation fails with low similarity', fix: 'Your skill\'s outputs may be non-deterministic. Add more specific test cases. Shadow validation requires 75% similarity across 5 runs.' },
          ].map(item => (
            <div key={item.error}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--red)' }}>{item.error}</h3>
              <p className="text-sm" style={textStyle}>{item.fix}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ── Main Docs Page ──────────────────────────────────────────────────

export default function Docs() {
  const [tab, setTab] = useState<'quickstart' | 'web3'>('quickstart');
  const [activeSection, setActiveSection] = useState('');

  const sections = tab === 'quickstart' ? quickStartSections : web3Sections;

  useEffect(() => {
    if (sections.length > 0) setActiveSection(sections[0].id);
  }, [tab]);

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
  }, [sections]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {/* Tab toggle */}
            <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
              <button
                onClick={() => setTab('quickstart')}
                className="flex-1 text-xs py-2 cursor-pointer font-semibold"
                style={{
                  background: tab === 'quickstart' ? 'rgba(0,255,200,0.1)' : 'transparent',
                  color: tab === 'quickstart' ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: 'none',
                }}
              >
                Quick Start
              </button>
              <button
                onClick={() => setTab('web3')}
                className="flex-1 text-xs py-2 cursor-pointer font-semibold"
                style={{
                  background: tab === 'web3' ? 'rgba(170,136,255,0.1)' : 'transparent',
                  color: tab === 'web3' ? 'var(--purple)' : 'var(--text-secondary)',
                  border: 'none',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                Web3
              </button>
            </div>

            <div className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
              {tab === 'quickstart' ? 'Getting Started' : 'Protocol & Tokens'}
            </div>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-xs py-1.5 no-underline transition-colors"
                style={{
                  color: activeSection === s.id ? (tab === 'quickstart' ? 'var(--cyan)' : 'var(--purple)') : 'var(--text-secondary)',
                  borderLeft: activeSection === s.id
                    ? `2px solid ${tab === 'quickstart' ? 'var(--cyan)' : 'var(--purple)'}`
                    : '2px solid transparent',
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
            {tab === 'quickstart' ? 'Getting Started' : 'Web3 Protocol Guide'}
          </h1>
          <p className="text-sm mb-4" style={textStyle}>
            {tab === 'quickstart'
              ? 'Install SkillChain and run your first skill chain in under 2 minutes.'
              : 'Initialize your node, publish skills on-chain, stake tokens, and validate.'}
          </p>

          {/* Mobile tab toggle */}
          <div className="flex lg:hidden rounded-lg overflow-hidden mb-8" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => setTab('quickstart')}
              className="flex-1 text-xs py-2.5 cursor-pointer font-semibold"
              style={{
                background: tab === 'quickstart' ? 'rgba(0,255,200,0.1)' : 'transparent',
                color: tab === 'quickstart' ? 'var(--cyan)' : 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Quick Start
            </button>
            <button
              onClick={() => setTab('web3')}
              className="flex-1 text-xs py-2.5 cursor-pointer font-semibold"
              style={{
                background: tab === 'web3' ? 'rgba(170,136,255,0.1)' : 'transparent',
                color: tab === 'web3' ? 'var(--purple)' : 'var(--text-secondary)',
                border: 'none',
                borderLeft: '1px solid var(--border)',
              }}
            >
              Web3 / Advanced
            </button>
          </div>

          {tab === 'quickstart' ? <QuickStartContent /> : <Web3Content />}
        </main>
      </div>
    </div>
  );
}
