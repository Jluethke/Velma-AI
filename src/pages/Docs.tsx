import { useState, useEffect } from 'react';
import CodeBlock from '../components/CodeBlock';

const quickStartSections = [
  { id: 'try-skill', label: 'Try a Skill' },
  { id: 'composer', label: 'Chain Composer' },
  { id: 'running', label: 'Running Chains' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'faq', label: 'FAQ' },
];

const standardSections = [
  { id: 'std-overview', label: 'Overview' },
  { id: 'std-skill-format', label: 'Skill Format' },
  { id: 'std-manifest', label: 'Manifest Schema' },
  { id: 'std-phases', label: 'Execution Phases' },
  { id: 'std-chain-format', label: 'Chain Format' },
  { id: 'std-validation', label: 'Validation' },
  { id: 'std-trust', label: 'Trust Scoring' },
];

const web3Sections = [
  { id: 'w3-wallet', label: 'Connect Wallet' },
  { id: 'w3-trust', label: 'TRUST Token' },
  { id: 'w3-publishing', label: 'On-Chain Publishing' },
  { id: 'w3-derivatives', label: 'Derivatives & Royalties' },
  { id: 'w3-contracts', label: 'Contracts' },
];

const headingStyle = { color: '#ffffff' };
const textStyle = { color: 'var(--text-secondary)' };

// ── Quick Start ────────────────────────────────────────────────────

function QuickStartContent() {
  return (
    <>
      <section id="try-skill" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Try a Skill</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Every skill on SkillChain is free to try. No account, no wallet, no install.
        </p>
        <ol className="space-y-2 text-sm pl-5" style={textStyle}>
          <li>Browse skills on the <a href="/" style={{ color: 'var(--cyan)' }}>home page</a> or go directly to one (e.g., <a href="/skill/budget-builder" style={{ color: 'var(--cyan)' }}>budget-builder</a>)</li>
          <li>Click <strong style={{ color: '#00c8ff' }}>Run in Claude Code — Free</strong></li>
          <li>A small launcher script downloads. Double-click it.</li>
          <li>Claude Code opens, reads the skill, and walks you through it interactively.</li>
        </ol>
        <p className="text-sm mt-4" style={textStyle}>
          If you don't have Claude Code installed, the launcher installs it automatically (requires Node.js).
        </p>
      </section>

      <section id="composer" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Chain Composer</h2>
        <p className="text-sm mb-4" style={textStyle}>
          The <a href="/compose" style={{ color: 'var(--cyan)' }}>Composer</a> is a visual editor for building multi-skill chains. Requires a connected wallet with TRUST tokens.
        </p>
        <div className="space-y-3 text-sm" style={textStyle}>
          <p><strong style={{ color: 'var(--text-primary)' }}>Add skills</strong> — Click any skill in the left palette to place it on the canvas. Search across all 176 skills.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Connect them</strong> — Drag from the cyan dot (bottom of one node) to the red dot (top of another) to create a flow.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Customize</strong> — Click a node to expand it. Edit inputs and outputs to fit your chain. Modified nodes get a "modified" badge.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Create new skills</strong> — Click "+ Create Skill" in the palette. Describe what you want in plain English. Claude builds it when the chain runs.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Save / Load</strong> — Save your chains locally and reload them later.</p>
        </div>
      </section>

      <section id="running" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Running Chains</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Two buttons in the composer:
        </p>
        <div className="space-y-3 text-sm" style={textStyle}>
          <p><strong style={{ color: '#00c8ff' }}>Run</strong> — Downloads a launcher script that creates a workspace, writes chain instructions, and opens Claude Code interactively. Claude executes each skill in order, passing context between steps.</p>
          <p><strong style={{ color: 'var(--cyan)' }}>Export .chain.json</strong> — Downloads the chain definition as a JSON file you can share or use programmatically.</p>
        </div>
        <p className="text-sm mt-4" style={textStyle}>
          For custom skills (ones you created in the palette), Claude uses <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>skill-from-workflow</code> to build the skill definition on the fly before executing it.
        </p>
      </section>

      <section id="publishing" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Publishing On-Chain</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Click <strong style={{ color: 'var(--gold)' }}>Publish On-Chain</strong> in the composer to register your chain and custom skills on Base mainnet.
        </p>
        <ol className="space-y-2 text-sm pl-5" style={textStyle}>
          <li>Each custom or modified skill is registered individually via SkillRegistry</li>
          <li>Your wallet signs each transaction (MetaMask or other wallet)</li>
          <li>The chain itself is registered as a meta-skill linking all steps</li>
          <li>Your wallet address is permanently recorded as the creator</li>
          <li>Modified skills are tracked as derivatives with royalty links to the original author</li>
        </ol>
      </section>

      <section id="faq" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>FAQ</h2>
        <div className="space-y-6">
          {[
            { q: 'Do I need crypto to try a skill?', a: 'No. Click "Run in Claude Code" on any skill page. Completely free, no wallet needed.' },
            { q: 'What do I need TRUST for?', a: 'The chain Composer. Chaining multiple skills together, creating custom skills, and publishing on-chain all require TRUST tokens in your wallet.' },
            { q: 'How do I get TRUST?', a: 'Publish skills that others use, validate skill quality, or earn from derivatives of your work. TRUST is earned, not bought.' },
            { q: 'What happens when I modify someone\'s skill?', a: 'It\'s tracked as a derivative. When you publish it, 15% of TRUST earned goes to the original author automatically via smart contract.' },
            { q: 'Do I need to install anything?', a: 'The composer runs entirely in your browser. When you click Run, it downloads a small script that opens Claude Code. If you don\'t have Claude Code, it installs automatically.' },
            { q: 'Can people steal my skills?', a: 'Skills are instructions — they can\'t be DRM\'d. But your version has on-chain provenance, trust scores, validation history, and composition references. A copy has none of that.' },
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

// ── Skill Standard ─────────────────────────────────────────────────

function StandardContent() {
  return (
    <>
      <section id="std-overview" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>SkillChain Open Skill Standard v1.0</h2>
        <p className="text-sm mb-4" style={textStyle}>
          A portable format for packaging AI-executable procedures as skills. Any MCP-compatible AI agent can discover, validate, and execute skills that follow this standard.
        </p>
      </section>

      <section id="std-skill-format" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Skill Package Format</h2>
        <CodeBlock
          code={`my-skill/\n  skill.md           # Execution specification (REQUIRED)\n  manifest.json      # Machine-readable metadata (REQUIRED)\n  provenance.json    # Author, version history, validation records\n  tests/\n    test_cases.json  # Validation test cases`}
          filename="skill package"
        />
      </section>

      <section id="std-manifest" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Manifest Schema</h2>
        <CodeBlock
          code={`{\n  "name": "budget-builder",\n  "version": "1.0.0",\n  "domain": "finance",\n  "tags": ["budget", "money", "expenses"],\n  "description": "Build a comprehensive personal budget",\n  "inputs": ["income", "fixed_expenses", "variable_spending"],\n  "outputs": ["spending_snapshot", "bleed_points", "action_plan"],\n  "execution_pattern": "phase_pipeline",\n  "price": "0",\n  "license": "OPEN"\n}`}
          filename="manifest.json"
        />
        <p className="text-sm mt-4" style={textStyle}>
          <strong style={{ color: 'var(--text-primary)' }}>inputs/outputs</strong> are how the composer knows which skills can connect. Skill A's outputs feed into Skill B's inputs.
        </p>
      </section>

      <section id="std-phases" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Execution Phases</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Each skill defines phases with entry criteria, actions, outputs, and a quality gate that must pass before proceeding.
        </p>
        <CodeBlock
          code={`## Phase 1: INTAKE\n### Entry Criteria\n- User has provided income and expenses\n### Actions\n- Categorize expenses: fixed, variable, discretionary\n- Identify recurring subscriptions\n### Outputs\n- Raw financial data organized by category\n### Quality Gate\n- All amounts are numeric and reasonable\n- Categories cover at least 80% of spending`}
          filename="skill.md (phase example)"
        />
      </section>

      <section id="std-chain-format" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Chain Format</h2>
        <CodeBlock
          code={`{\n  "name": "startup-validation",\n  "description": "Validate a startup idea end-to-end",\n  "category": "business",\n  "steps": [\n    { "skill_name": "idea-validator", "alias": "validate", "depends_on": [] },\n    { "skill_name": "market-research", "alias": "research", "depends_on": ["validate"] },\n    { "skill_name": "pricing-strategy", "alias": "pricing", "depends_on": ["research"] }\n  ]\n}`}
          filename=".chain.json"
        />
        <p className="text-sm mt-4" style={textStyle}>
          Steps execute in dependency order. Skills with no shared dependencies can run in parallel.
        </p>
      </section>

      <section id="std-validation" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Validation</h2>
        <p className="text-sm" style={textStyle}>
          Skills are validated through shadow runs — sandboxed execution against test cases with similarity scoring. Multiple validators must agree via trust-weighted consensus. Only domain-competent validators can vote.
        </p>
      </section>

      <section id="std-trust" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Trust Scoring</h2>
        <p className="text-sm" style={textStyle}>
          Every skill carries a trust score computed from on-chain validation data. Higher trust means better ranking in discovery, higher confidence in chain composition, and more weight in community voting. Trust is earned through validation accuracy over time — not economic stake.
        </p>
      </section>
    </>
  );
}

// ── Web3 ───────────────────────────────────────────────────────────

function Web3Content() {
  return (
    <>
      <section id="w3-wallet" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Connect Wallet</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Click "Connect Wallet" in the top right. Works with MetaMask, Coinbase Wallet, WalletConnect, and others. If you don't have a wallet, MetaMask creates one in your browser in under a minute.
        </p>
        <p className="text-sm" style={textStyle}>
          Your wallet is your identity in SkillChain. It's where TRUST tokens accumulate and how you're credited as a skill author on-chain.
        </p>
      </section>

      <section id="w3-trust" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>TRUST Token</h2>
        <p className="text-sm mb-4" style={textStyle}>
          TRUST is earned, not bought. Ways to earn:
        </p>
        <ul className="space-y-2 text-sm list-none p-0" style={textStyle}>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Publish skills that others use</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Validate skills for quality</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Earn royalties from derivatives of your work</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Participate in governance</li>
        </ul>
        <p className="text-sm mt-4" style={textStyle}>
          TRUST unlocks the chain Composer. With TRUST in your wallet, you can chain skills together, create custom skills, and publish on-chain.
        </p>
      </section>

      <section id="w3-publishing" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>On-Chain Publishing</h2>
        <p className="text-sm mb-4" style={textStyle}>
          When you click "Publish On-Chain" in the composer, each custom or modified skill is registered on Base mainnet via the SkillRegistry contract. Your wallet signs the transaction and is permanently recorded as the creator.
        </p>
        <p className="text-sm" style={textStyle}>
          Published data: skill name, domain, tags, inputs, outputs, content hash, license type, creator address.
        </p>
      </section>

      <section id="w3-derivatives" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Derivatives & Royalties</h2>
        <p className="text-sm mb-4" style={textStyle}>
          When you modify an existing skill (change its inputs/outputs in the composer), it's tracked as a derivative. On publish:
        </p>
        <ul className="space-y-2 text-sm list-none p-0" style={textStyle}>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--gold)' }}>&#9679;</span> 70% of TRUST earned goes to you (the derivative creator)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--gold)' }}>&#9679;</span> 15% goes to the original skill author</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--gold)' }}>&#9679;</span> 15% goes to validators who verified quality</li>
        </ul>
        <p className="text-sm mt-4" style={textStyle}>
          All royalty splits are enforced by the Marketplace smart contract. No middleman. No manual payments.
        </p>
      </section>

      <section id="w3-contracts" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Deployed Contracts (Base Mainnet)</h2>
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Contract</th>
                <th className="text-left px-4 py-2" style={textStyle}>Address</th>
              </tr>
            </thead>
            <tbody style={textStyle}>
              {[
                { name: 'TRUST Token', addr: '0xAd96F3d1d6F6622f35baAcF72134765Da3C562be' },
                { name: 'TrustOracle', addr: '0x5e3b7016FE47eb6Dbdc276104494e55d540173e3' },
                { name: 'SkillRegistry', addr: '0x3B400Abeb3385aB5401D0076488c74AA5550f09D' },
                { name: 'Marketplace', addr: '0xaCFDBF10009Bad15840b7FfBf59B61D3A234aB6B' },
                { name: 'ValidationRegistry', addr: '0x4794204ADedC2390e387d02df3906FC3C768f73A' },
              ].map(c => (
                <tr key={c.name} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                  <td className="px-4 py-2"><code className="text-xs" style={{ color: 'var(--cyan)' }}>{c.addr}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

type TabType = 'quickstart' | 'standard' | 'web3';

export default function Docs() {
  const [tab, setTab] = useState<TabType>('quickstart');
  const [activeSection, setActiveSection] = useState('');

  const sections = tab === 'quickstart' ? quickStartSections : tab === 'standard' ? standardSections : web3Sections;

  useEffect(() => {
    if (sections.length > 0) setActiveSection(sections[0].id);
  }, [tab]);

  useEffect(() => {
    const handleScroll = () => {
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) setActiveSection(section.id);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const tabColor = tab === 'quickstart' ? 'var(--cyan)' : tab === 'standard' ? 'var(--gold)' : 'var(--purple)';

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex gap-12">
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
              {([
                { key: 'quickstart' as TabType, label: 'Guide', color: 'var(--cyan)' },
                { key: 'standard' as TabType, label: 'Standard', color: 'var(--gold)' },
                { key: 'web3' as TabType, label: 'Web3', color: 'var(--purple)' },
              ] as const).map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex-1 text-xs py-2 cursor-pointer font-semibold"
                  style={{
                    background: tab === t.key ? `${t.color}18` : 'transparent',
                    color: tab === t.key ? t.color : 'var(--text-secondary)',
                    border: 'none',
                    borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-xs py-1.5 no-underline transition-colors"
                style={{
                  color: activeSection === s.id ? tabColor : 'var(--text-secondary)',
                  borderLeft: activeSection === s.id ? `2px solid ${tabColor}` : '2px solid transparent',
                  paddingLeft: '12px',
                }}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={headingStyle}>
            {tab === 'quickstart' ? 'How It Works' : tab === 'standard' ? 'Skill Standard' : 'Web3 & TRUST'}
          </h1>
          <p className="text-sm mb-8" style={textStyle}>
            {tab === 'quickstart'
              ? 'Try skills for free. Chain them together in the Composer. Publish and earn.'
              : tab === 'standard'
              ? 'The open standard for portable, validated AI skills.'
              : 'Wallets, TRUST tokens, on-chain publishing, and derivative royalties.'}
          </p>

          {/* Mobile tabs */}
          <div className="flex lg:hidden rounded-lg overflow-hidden mb-8" style={{ border: '1px solid var(--border)' }}>
            {([
              { key: 'quickstart' as TabType, label: 'Guide', color: 'var(--cyan)' },
              { key: 'standard' as TabType, label: 'Standard', color: 'var(--gold)' },
              { key: 'web3' as TabType, label: 'Web3', color: 'var(--purple)' },
            ] as const).map((t, i) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 text-xs py-2.5 cursor-pointer font-semibold"
                style={{
                  background: tab === t.key ? `${t.color}18` : 'transparent',
                  color: tab === t.key ? t.color : 'var(--text-secondary)',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'quickstart' ? <QuickStartContent /> : tab === 'standard' ? <StandardContent /> : <Web3Content />}
        </main>
      </div>
    </div>
  );
}
