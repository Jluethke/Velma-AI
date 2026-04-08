import { useState, useEffect } from 'react';
import CodeBlock from '../components/CodeBlock';

const guideSections = [
  { id: 'try-skill', label: 'Try a Skill' },
  { id: 'composer', label: 'Composer' },
  { id: 'skill-format', label: 'Skill Format' },
  { id: 'chains', label: 'Chain Format' },
  { id: 'running', label: 'Running' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'trust', label: 'TRUST & Royalties' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'faq', label: 'FAQ' },
];

const h = { color: '#ffffff' };
const t = { color: 'var(--text-secondary)' };

export default function Docs() {
  const [activeSection, setActiveSection] = useState('try-skill');

  useEffect(() => {
    const handleScroll = () => {
      for (const section of guideSections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 120) setActiveSection(section.id);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex gap-12">
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <div className="text-xs font-semibold uppercase mb-3" style={t}>Documentation</div>
            {guideSections.map(s => (
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

        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={h}>Documentation</h1>
          <p className="text-sm mb-8" style={t}>Everything you need to try skills, compose chains, and publish on-chain.</p>

          {/* Try a Skill */}
          <section id="try-skill" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Try a Skill</h2>
            <p className="text-sm mb-4" style={t}>
              Every skill is free to try. No account, no wallet, no install.
            </p>
            <ol className="space-y-2 text-sm pl-5" style={t}>
              <li>Pick a skill from the <a href="/" style={{ color: 'var(--cyan)' }}>home page</a> (e.g., <a href="/skill/budget-builder" style={{ color: 'var(--cyan)' }}>budget-builder</a>)</li>
              <li>Click <strong style={{ color: '#00c8ff' }}>Run in Claude Code</strong></li>
              <li>A small launcher script downloads — double-click it</li>
              <li>Claude Code opens and executes the skill interactively</li>
            </ol>
            <p className="text-sm mt-4" style={t}>
              The launcher auto-installs Claude Code if you don't have it (requires Node.js). No SDK or pip install needed to try skills.
            </p>
          </section>

          {/* Composer */}
          <section id="composer" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Composer</h2>
            <p className="text-sm mb-4" style={t}>
              The <a href="/compose" style={{ color: 'var(--cyan)' }}>Composer</a> is a visual editor for building multi-skill chains. Requires a connected wallet with TRUST.
            </p>
            <div className="space-y-3 text-sm" style={t}>
              <p><strong style={h}>Add skills</strong> — Click from the palette (hundreds of skills across multiple domains) to place on the canvas.</p>
              <p><strong style={h}>Connect</strong> — Drag from the cyan dot (bottom) to the red dot (top) to create flow.</p>
              <p><strong style={h}>Customize</strong> — Click a node to expand. Edit inputs/outputs. Modified nodes get a "modified" badge for derivative tracking.</p>
              <p><strong style={h}>Create new skills</strong> — Click "+ Create Skill." Describe it in plain English. Claude builds it when the chain runs using <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>skill-from-workflow</code>.</p>
              <p><strong style={h}>Save / Load</strong> — Chains persist in your browser. Reload them anytime.</p>
              <p><strong style={h}>Validate</strong> — Checks for cycles and missing info before running.</p>
              <p><strong style={h}>Run</strong> — Downloads a launcher that opens Claude Code with your chain.</p>
              <p><strong style={h}>Publish On-Chain</strong> — Registers skills and chain on Base mainnet via your wallet.</p>
            </div>
          </section>

          {/* Skill Format */}
          <section id="skill-format" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Skill Format</h2>
            <p className="text-sm mb-4" style={t}>
              A skill is a directory with two files:
            </p>
            <CodeBlock
              code={`my-skill/\n  skill.md           # What the AI does (phases, quality gates)\n  manifest.json      # How it connects (inputs, outputs, domain)`}
              filename="skill package"
            />

            <h3 className="text-sm font-semibold mt-6 mb-3" style={h}>manifest.json</h3>
            <p className="text-sm mb-3" style={t}>This is how the Composer knows which skills can connect. Skill A's outputs feed into Skill B's inputs.</p>
            <CodeBlock
              code={`{\n  "name": "budget-builder",\n  "version": "1.0.0",\n  "domain": "finance",\n  "tags": ["budget", "money", "expenses"],\n  "description": "Build a comprehensive personal budget",\n  "inputs": ["income", "fixed_expenses", "variable_spending"],\n  "outputs": ["spending_snapshot", "bleed_points", "action_plan"],\n  "execution_pattern": "phase_pipeline",\n  "price": "0",\n  "license": "OPEN"\n}`}
              filename="manifest.json"
            />

            <h3 className="text-sm font-semibold mt-6 mb-3" style={h}>skill.md — Phases & Quality Gates</h3>
            <p className="text-sm mb-3" style={t}>Each skill defines execution phases. Every phase has entry criteria, actions, outputs, and a quality gate that must pass before the next phase starts.</p>
            <CodeBlock
              code={`## Phase 1: INTAKE\n### Entry Criteria\n- User has provided income and expenses\n### Actions\n- Categorize expenses: fixed, variable, discretionary\n- Identify recurring subscriptions\n### Outputs\n- Financial data organized by category\n### Quality Gate\n- All amounts are numeric\n- Categories cover 80%+ of spending`}
              filename="skill.md (phase example)"
            />
          </section>

          {/* Chain Format */}
          <section id="chains" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Chain Format</h2>
            <p className="text-sm mb-4" style={t}>
              Chains are what the Composer produces — a DAG of skills with dependency ordering:
            </p>
            <CodeBlock
              code={`{\n  "name": "startup-validation",\n  "description": "Validate a startup idea end-to-end",\n  "category": "business",\n  "steps": [\n    { "skill_name": "idea-validator", "alias": "validate", "depends_on": [] },\n    { "skill_name": "market-research", "alias": "research", "depends_on": ["validate"] },\n    { "skill_name": "pricing-strategy", "alias": "pricing", "depends_on": ["research"] }\n  ]\n}`}
              filename=".chain.json"
            />
            <p className="text-sm mt-4" style={t}>
              When you click Export in the Composer, this is what you get. When you click Run, Claude executes these steps in order with context bridging between them.
            </p>
          </section>

          {/* Running */}
          <section id="running" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Running</h2>
            <p className="text-sm mb-4" style={t}>
              Click <strong style={{ color: '#00c8ff' }}>Run</strong> in the Composer. A launcher script downloads that:
            </p>
            <ol className="space-y-2 text-sm pl-5" style={t}>
              <li>Creates a workspace at <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>~/SkillChain-Runs/chain-name-date/</code></li>
              <li>Writes a CLAUDE.md with chain instructions and context bridging rules</li>
              <li>Checks for Claude Code — installs it if missing</li>
              <li>Launches Claude, which reads the instructions and starts executing</li>
            </ol>
            <p className="text-sm mt-4" style={t}>
              For custom skills (ones you described in the palette), Claude builds the skill definition first using <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>skill-from-workflow</code>, then executes it.
            </p>
          </section>

          {/* Publishing */}
          <section id="publishing" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Publishing On-Chain</h2>
            <p className="text-sm mb-4" style={t}>
              Click <strong style={{ color: 'var(--gold)' }}>Publish On-Chain</strong> in the Composer. Your wallet signs transactions to register each skill and the chain on Base mainnet.
            </p>
            <p className="text-sm mb-4" style={t}>What gets recorded on-chain:</p>
            <ul className="space-y-1 text-sm list-none p-0" style={t}>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Skill name, domain, tags, inputs, outputs</li>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Content hash (integrity proof)</li>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Your wallet as the permanent creator</li>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Derivative links to original skills (if modified)</li>
            </ul>
          </section>

          {/* TRUST & Royalties */}
          <section id="trust" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>TRUST & Royalties</h2>
            <p className="text-sm mb-4" style={t}>
              TRUST is earned, not bought:
            </p>
            <ul className="space-y-2 text-sm list-none p-0" style={t}>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Publish skills that others use</li>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Validate skills for quality</li>
              <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Earn royalties from derivatives of your work</li>
            </ul>
            <p className="text-sm mt-4 mb-4" style={t}>
              When someone modifies your skill and publishes it:
            </p>
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <th className="text-left px-4 py-2" style={t}>Recipient</th>
                    <th className="text-left px-4 py-2" style={t}>Share</th>
                  </tr>
                </thead>
                <tbody style={t}>
                  <tr style={{ borderTop: '1px solid var(--border)' }}><td className="px-4 py-2" style={{ color: 'var(--gold)' }}>Derivative creator</td><td className="px-4 py-2">70%</td></tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}><td className="px-4 py-2" style={{ color: 'var(--green)' }}>Original author</td><td className="px-4 py-2">15%</td></tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}><td className="px-4 py-2" style={{ color: 'var(--purple)' }}>Validators</td><td className="px-4 py-2">15%</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-4" style={t}>
              All splits are enforced by the Marketplace smart contract. No middleman.
            </p>
          </section>

          {/* Contracts */}
          <section id="contracts" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>Contracts (Base Mainnet)</h2>
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ background: 'var(--bg-card)' }}><th className="text-left px-4 py-2" style={t}>Contract</th><th className="text-left px-4 py-2" style={t}>Address</th></tr></thead>
                <tbody style={t}>
                  {[
                    ['TRUST Token', '0xAd96F3d1d6F6622f35baAcF72134765Da3C562be'],
                    ['SkillRegistry', '0x3B400Abeb3385aB5401D0076488c74AA5550f09D'],
                    ['Marketplace', '0xaCFDBF10009Bad15840b7FfBf59B61D3A234aB6B'],
                    ['TrustOracle', '0x5e3b7016FE47eb6Dbdc276104494e55d540173e3'],
                    ['ValidationRegistry', '0x4794204ADedC2390e387d02df3906FC3C768f73A'],
                  ].map(([name, addr]) => (
                    <tr key={name} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-2 font-medium" style={h}>{name}</td>
                      <td className="px-4 py-2"><code className="text-xs" style={{ color: 'var(--cyan)' }}>{addr}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-14">
            <h2 className="text-xl font-semibold mb-4" style={h}>FAQ</h2>
            <div className="space-y-6">
              {[
                { q: 'Do I need to install anything?', a: 'No. The Composer runs in your browser. When you click Run, a small script downloads that opens Claude Code. If Claude Code isn\'t installed, it auto-installs.' },
                { q: 'Do I need crypto to try a skill?', a: 'No. Single skills are free, no wallet needed. You only need TRUST tokens to use the Composer (chaining skills together) and to publish on-chain.' },
                { q: 'How do I get TRUST?', a: 'Publish skills that others use, validate skill quality, or earn royalties from derivatives. TRUST is earned, not bought.' },
                { q: 'What if someone copies my skill?', a: 'They can\'t copy your on-chain provenance, trust score, validation history, or composition references. A raw copy has none of that.' },
                { q: 'What happens when I modify someone\'s skill?', a: 'It\'s tracked as a derivative. 15% of TRUST earned flows to the original author automatically via smart contract.' },
                { q: 'What wallet do I need?', a: 'MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet. MetaMask creates one in your browser in under a minute.' },
              ].map((item, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--cyan)' }}>{item.q}</h3>
                  <p className="text-sm" style={t}>{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
