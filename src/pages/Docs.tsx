import { useState, useEffect } from 'react';
import CodeBlock from '../components/CodeBlock';

// ── Section definitions per tab ─────────────────────────────────────

const quickStartSections = [
  { id: 'install', label: 'Install' },
  { id: 'first-run', label: 'First Run' },
  { id: 'browse-skills', label: 'Browse Skills' },
  { id: 'run-chain', label: 'Run a Chain' },
  { id: 'compose', label: 'Compose Chains' },
  { id: 'memory', label: 'Memory System' },
  { id: 'triggers', label: 'Triggers' },
  { id: 'create-skill', label: 'Create a Skill' },
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
  { id: 'w3-prerequisites', label: 'Prerequisites' },
  { id: 'w3-init', label: 'Initialize Node' },
  { id: 'w3-publishing', label: 'Publishing' },
  { id: 'w3-validating', label: 'Validating' },
  { id: 'w3-community', label: 'Community Registry' },
  { id: 'w3-staking', label: 'Staking' },
  { id: 'w3-status', label: 'Status' },
  { id: 'w3-contracts', label: 'Contracts' },
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
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Installs 176 skills and 190 chains</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Auto-configures Claude Code, Cursor, and Windsurf</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Sets up tiered memory system (L0-L3)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Creates your trainer profile with gamification</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--green)' }}>&#10003;</span> Registers in Add/Remove Programs (Windows)</li>
        </ul>
        <p className="text-xs mt-3" style={textStyle}>
          To uninstall: Settings &rarr; Apps &rarr; SkillChain, or run the uninstall script from ~/.skillchain/bin/
        </p>
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
            '"I want to start a side business"',
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
          SkillChain automatically finds the right skill chain and walks you through it. No commands to memorize. Your memory persists between sessions.
        </p>
      </section>

      {/* Browse Skills */}
      <section id="browse-skills" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Browse Skills</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Visit the <a href="/explore" style={{ color: 'var(--cyan)' }}>Skills</a> page to browse all 176 skills across 9 categories:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { cat: 'Life', count: 21, color: '#00ff88' },
            { cat: 'Career', count: 14, color: '#00ffc8' },
            { cat: 'Business', count: 30, color: '#a855f7' },
            { cat: 'Health', count: 6, color: '#22c55e' },
            { cat: 'Developer', count: 19, color: '#00bfff' },
            { cat: 'Finance', count: 8, color: '#ffd700' },
            { cat: 'Creative', count: 8, color: '#ff69b4' },
            { cat: 'Education', count: 8, color: '#00ffc8' },
            { cat: 'Real Estate', count: 5, color: '#ffa500' },
          ].map(c => (
            <span key={c.cat} className="text-xs px-2 py-1 rounded" style={{ background: `${c.color}15`, border: `1px solid ${c.color}30`, color: c.color }}>
              {c.cat} ({c.count})
            </span>
          ))}
        </div>
        <p className="text-sm" style={textStyle}>
          All skills are included free. Use the MCP tools or just ask Claude.
        </p>
      </section>

      {/* Run a Chain */}
      <section id="run-chain" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Run a Chain</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Chains are multi-skill pipelines. Browse 190 chains on the <a href="/chains" style={{ color: 'var(--cyan)' }}>Chains</a> page, or describe what you need:
        </p>
        <CodeBlock code={`"Run the startup validation chain"\n"I need to prepare for an interview"\n"Help me plan a healthy week"`} filename="talk to Claude" />
        <p className="text-sm mt-4 mb-4" style={textStyle}>
          Each chain runs skills in dependency order. For example, <strong style={{ color: 'var(--text-primary)' }}>startup-validation</strong>:
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {['startup-validator', 'market-research', 'competitive-analysis', 'business-model-canvas', 'pitch-practice'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded" style={{ background: 'rgba(0,255,200,0.06)', border: '1px solid rgba(0,255,200,0.12)', color: 'var(--cyan)' }}>{s}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--text-secondary)' }}>&rarr;</span>}
            </span>
          ))}
        </div>
      </section>

      {/* Compose */}
      <section id="compose" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Compose Chains</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Two ways to compose custom chains:
        </p>

        <h3 className="text-sm font-semibold mb-2 mt-6" style={headingStyle}>Dynamic Composition (AI-powered)</h3>
        <p className="text-sm mb-3" style={textStyle}>
          Describe what you want and the system composes a chain automatically by matching skill inputs/outputs:
        </p>
        <CodeBlock code={`"Compose a chain to validate my startup idea and create a pitch deck"`} filename="talk to Claude" />
        <p className="text-sm mt-3 mb-4" style={textStyle}>
          The composer scores each chain on coverage, coherence, and trust. If confidence is low, it falls back to curated chains.
        </p>

        <h3 className="text-sm font-semibold mb-2 mt-6" style={headingStyle}>Visual Composer (drag-and-drop)</h3>
        <p className="text-sm mb-3" style={textStyle}>
          Open the <a href="/compose" style={{ color: 'var(--cyan)' }}>Visual Composer</a> to build chains by hand:
        </p>
        <ol className="space-y-1.5 text-sm pl-5 mb-4" style={textStyle}>
          <li>Click skills in the left palette to add them to the canvas</li>
          <li>Drag from the <span style={{ color: 'var(--cyan)' }}>cyan dot</span> (bottom of a node) to the <span style={{ color: '#ff6b6b' }}>red dot</span> (top of another) to connect</li>
          <li>Click Validate to check for cycles, then Export to get a .chain.json file</li>
        </ol>
      </section>

      {/* Memory */}
      <section id="memory" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Memory System</h2>
        <p className="text-sm mb-4" style={textStyle}>
          SkillChain remembers facts across sessions using a 4-tier memory system:
        </p>
        <div className="overflow-x-auto rounded-lg mb-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Tier</th>
                <th className="text-left px-4 py-2" style={textStyle}>Purpose</th>
                <th className="text-left px-4 py-2" style={textStyle}>Loading</th>
              </tr>
            </thead>
            <tbody style={textStyle}>
              {[
                { tier: 'L0: Identity', purpose: 'Who you are — role, goals, domains', loading: 'Always loaded' },
                { tier: 'L1: Critical Facts', purpose: 'Key facts from skill runs (budget, decisions)', loading: 'Always loaded' },
                { tier: 'L2: Skill Rooms', purpose: 'Per-skill context, run history, insights', loading: 'On demand' },
                { tier: 'L3: Knowledge Graph', purpose: 'Cross-skill temporal facts with trust scores', loading: 'On demand' },
              ].map(t => (
                <tr key={t.tier} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--cyan)' }}>{t.tier}</td>
                  <td className="px-4 py-2">{t.purpose}</td>
                  <td className="px-4 py-2">{t.loading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm" style={textStyle}>
          Facts are auto-extracted when you complete a skill run. Use <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>recall</code> to search your memory, or <code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>remember</code> to explicitly store facts.
        </p>
      </section>

      {/* Triggers */}
      <section id="triggers" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Event Triggers</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Schedule chains to run automatically or fire them from webhooks:
        </p>
        <CodeBlock code={`// Cron: run weekly-ops every Monday at 9am\n"Create a trigger: cron, every Monday 9am, run weekly-ops"\n\n// Webhook: get a URL that fires a chain\n"Create a webhook trigger for budget-builder"\n\n// List active triggers\n"Show my triggers"`} filename="talk to Claude" />
        <p className="text-sm mt-4" style={textStyle}>
          Webhook triggers return a URL with a secret. POST to it from any external system to fire the chain.
        </p>
      </section>

      {/* Create a Skill */}
      <section id="create-skill" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Create a Skill</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Tell Claude to create one, or build it manually following the <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ color: 'var(--cyan)' }}>Skill Standard</a> (see Standard tab):
        </p>
        <CodeBlock code={`"Create a skill that parses CSV financial data"`} filename="talk to Claude" />
        <p className="text-sm mt-4 mb-4" style={textStyle}>
          Submit to the community registry for trust-gated review:
        </p>
        <CodeBlock code={`"Submit my-skill for community review"`} filename="talk to Claude" />
        <p className="text-sm mt-4" style={textStyle}>
          Once 3+ validators approve (67% weighted threshold), the skill is published to the marketplace.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>FAQ</h2>
        <div className="space-y-6">
          {[
            { q: 'Do I need crypto to use this?', a: 'No. Install, restart Claude Code, talk normally. All 176 skills and 190 chains are free. The crypto layer (TRUST tokens, staking, on-chain validation) is optional for publishing and marketplace features.' },
            { q: 'What AI agents does it work with?', a: 'Claude Code, Cursor, Windsurf, and any MCP-compatible agent. The installer auto-detects what you have.' },
            { q: 'Does it remember things between sessions?', a: 'Yes. The tiered memory system (L0-L3) persists facts, insights, and knowledge across sessions. Your identity, key facts, and per-skill context are loaded automatically.' },
            { q: 'Can I compose my own chains?', a: 'Yes, two ways: (1) describe what you want and dynamic composition builds it from skill inputs/outputs, or (2) use the visual drag-and-drop editor at /compose.' },
            { q: 'How do I earn TRUST tokens?', a: 'Publish skills that others use, validate skills for quality, or participate in governance. There is no public sale.' },
            { q: 'Can I trigger chains automatically?', a: 'Yes. Create cron triggers for scheduled execution, or webhook triggers for external integrations. Discord bot integration is also available.' },
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

// ── Skill Standard Content ─────────────────────────────────────────

function StandardContent() {
  return (
    <>
      {/* Overview */}
      <section id="std-overview" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>SkillChain Open Skill Standard v1.0</h2>
        <p className="text-sm mb-4" style={textStyle}>
          The SkillChain Open Skill Standard (SCOSS) defines a portable, platform-agnostic format for packaging AI-executable procedures as <strong style={{ color: 'var(--text-primary)' }}>skills</strong>. A skill is a self-contained unit of work that any MCP-compatible AI agent can discover, validate, and execute.
        </p>
        <p className="text-sm mb-4" style={textStyle}>
          The standard covers three layers:
        </p>
        <ol className="space-y-2 text-sm pl-5" style={textStyle}>
          <li><strong style={{ color: 'var(--cyan)' }}>Packaging</strong> — How skills are structured, versioned, and distributed</li>
          <li><strong style={{ color: 'var(--cyan)' }}>Execution</strong> — How agents execute skills through standardized phases with quality gates</li>
          <li><strong style={{ color: 'var(--cyan)' }}>Validation</strong> — How skills are tested, trust-scored, and certified via decentralized consensus</li>
        </ol>
      </section>

      {/* Skill Format */}
      <section id="std-skill-format" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Skill Package Format</h2>
        <p className="text-sm mb-4" style={textStyle}>
          A skill is a directory (a <strong style={{ color: 'var(--text-primary)' }}>.skillpack</strong>) containing:
        </p>
        <CodeBlock
          code={`my-skill/\n  skill.md           # Execution specification (REQUIRED)\n  manifest.json      # Machine-readable metadata (REQUIRED for marketplace)\n  provenance.json    # Author, version history, validation records\n  tests/\n    test_cases.json  # Validation test cases (REQUIRED for publishing)\n  examples/          # Example inputs/outputs (optional)\n  README.md          # Human documentation (optional)`}
          filename="skill package structure"
        />

        <h3 className="text-sm font-semibold mt-6 mb-3" style={headingStyle}>skill.md — Execution Specification</h3>
        <p className="text-sm mb-4" style={textStyle}>
          The skill.md file is the core executable specification. It defines <em>what the AI does</em> through structured phases:
        </p>
        <CodeBlock
          code={`# Budget Builder\n\nBuild a comprehensive personal budget from income and expense data.\n\n## Execution Pattern\nphase_pipeline\n\n## Inputs\n- income: Monthly income amount and sources\n- fixed_expenses: Recurring monthly obligations (rent, utilities, subscriptions)\n- variable_spending: Estimated discretionary spending\n- financial_goals: Savings targets, debt payoff goals\n\n## Outputs\n- spending_snapshot: Categorized breakdown with percentages\n- bleed_points: Areas of wasteful spending with impact scores\n- action_plan: Prioritized recommendations with Impact-to-Pain ratios\n\n---\n\n## Phase 1: INTAKE\n### Entry Criteria\n- User has provided income and at least one expense category\n### Actions\n- Collect all income sources with amounts and frequency\n- Categorize expenses: fixed, variable, discretionary\n- Identify recurring subscriptions and their billing cycles\n### Outputs\n- Raw financial data organized by category\n- Total monthly income vs total monthly outflow\n### Quality Gate\n- All amounts are numeric and reasonable\n- Categories cover at least 80% of reported spending\n\n## Phase 2: FORENSICS\n### Entry Criteria\n- Phase 1 outputs validated\n### Actions\n- Calculate spending ratios per category\n- Compare against 50/30/20 benchmark\n- Flag categories exceeding benchmark by >10%\n- Identify "phantom expenses" (subscriptions user forgot about)\n### Outputs\n- Spending ratio table with benchmark comparison\n- Flagged categories with deviation amounts\n- List of phantom/forgotten expenses\n### Quality Gate\n- Ratios sum to 100% (+/- 1% rounding)\n- At least one actionable flag identified\n\n## Phase 3: BLUEPRINT\n...\n\n## Phase 4: LEVERS\n...\n\n## Phase 5: GUARDRAILS\n...`}
          filename="skill.md"
        />
        <p className="text-sm mt-4" style={textStyle}>
          Each phase MUST have: Entry Criteria, Actions, Outputs, and a Quality Gate. The Quality Gate defines pass/fail conditions that must be met before proceeding to the next phase.
        </p>
      </section>

      {/* Manifest Schema */}
      <section id="std-manifest" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Manifest Schema</h2>
        <p className="text-sm mb-4" style={textStyle}>
          The manifest.json provides machine-readable metadata for discovery, composition, and validation:
        </p>
        <CodeBlock
          code={`{\n  "name": "budget-builder",\n  "version": "1.0.0",\n  "domain": "finance",\n  "tags": ["budget", "money", "expenses", "savings"],\n  "description": "Build a comprehensive personal budget...",\n\n  "inputs": [\n    "income",\n    "fixed_expenses",\n    "variable_spending",\n    "financial_goals"\n  ],\n  "outputs": [\n    "spending_snapshot",\n    "bleed_points",\n    "action_plan"\n  ],\n\n  "execution_pattern": "phase_pipeline",\n  "price": "0",\n  "license": "OPEN",\n\n  "min_shadow_count": 5,\n  "graduation_threshold": 0.75\n}`}
          filename="manifest.json"
        />

        <div className="overflow-x-auto rounded-lg mt-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Field</th>
                <th className="text-left px-4 py-2" style={textStyle}>Required</th>
                <th className="text-left px-4 py-2" style={textStyle}>Description</th>
              </tr>
            </thead>
            <tbody style={textStyle}>
              {[
                { field: 'name', req: 'Yes', desc: 'Unique identifier (lowercase, hyphens, 3-50 chars)' },
                { field: 'version', req: 'Yes', desc: 'Semantic version (major.minor.patch)' },
                { field: 'domain', req: 'Yes', desc: 'Primary category (life, career, business, health, developer, finance, creative, education, real-estate, ai)' },
                { field: 'tags', req: 'Yes', desc: 'Array of discovery keywords' },
                { field: 'description', req: 'Yes', desc: 'Human-readable summary (20-500 chars)' },
                { field: 'inputs', req: 'Yes*', desc: 'Array of named input fields the skill consumes. *Required for chain composition.' },
                { field: 'outputs', req: 'Yes*', desc: 'Array of named output fields the skill produces. *Required for chain composition.' },
                { field: 'execution_pattern', req: 'No', desc: '"phase_pipeline" (default) or "orpa" (Observe-Reflect-Plan-Act)' },
                { field: 'price', req: 'No', desc: 'Price in TRUST tokens ("0" = free)' },
                { field: 'license', req: 'No', desc: '"OPEN" (default), "COMMERCIAL", or "PROPRIETARY"' },
                { field: 'min_shadow_count', req: 'No', desc: 'Minimum shadow validation runs before graduation (default: 5)' },
                { field: 'graduation_threshold', req: 'No', desc: 'Minimum similarity score for validation pass (default: 0.75)' },
              ].map(r => (
                <tr key={r.field} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2"><code className="text-xs px-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--cyan)' }}>{r.field}</code></td>
                  <td className="px-4 py-2">{r.req}</td>
                  <td className="px-4 py-2">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm mt-4" style={textStyle}>
          <strong style={{ color: 'var(--text-primary)' }}>Why inputs/outputs matter:</strong> The dynamic chain composer matches skill outputs to other skills' inputs to build valid execution pipelines. Without declared inputs/outputs, a skill can still run standalone but cannot participate in automated chain composition.
        </p>
      </section>

      {/* Execution Phases */}
      <section id="std-phases" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Execution Phases</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Every skill execution follows a tracked phase lifecycle:
        </p>
        <CodeBlock
          code={`start_skill_run(skill_name, pattern)\n  \u2502\n  \u251C\u2500 record_phase("observe",  status, output)   # Understand the problem\n  \u251C\u2500 record_phase("reflect",  status, output)   # Plan the approach\n  \u251C\u2500 record_phase("plan",     status, output)   # Structure the response\n  \u251C\u2500 record_phase("act",      status, output)    # Generate the output\n  \u2502\n  \u2514\u2500 complete_skill_run(status)\n       \u251C\u2500 Archives to run history\n       \u251C\u2500 Extracts facts to memory (L1/L2)\n       \u251C\u2500 Extracts knowledge graph triples (L3)\n       \u2514\u2500 Awards XP + checks achievements`}
          filename="execution lifecycle"
        />

        <h3 className="text-sm font-semibold mt-6 mb-3" style={headingStyle}>Execution Patterns</h3>
        <div className="overflow-x-auto rounded-lg mb-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="text-left px-4 py-2" style={textStyle}>Pattern</th>
                <th className="text-left px-4 py-2" style={textStyle}>Phases</th>
                <th className="text-left px-4 py-2" style={textStyle}>Use Case</th>
              </tr>
            </thead>
            <tbody style={textStyle}>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--cyan)' }}>orpa</td>
                <td className="px-4 py-2">Observe &rarr; Reflect &rarr; Plan &rarr; Act</td>
                <td className="px-4 py-2">General-purpose skills (default)</td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--cyan)' }}>phase_pipeline</td>
                <td className="px-4 py-2">Custom named phases (e.g., INTAKE &rarr; FORENSICS &rarr; BLUEPRINT)</td>
                <td className="px-4 py-2">Domain-specific skills with structured workflows</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-sm font-semibold mt-6 mb-3" style={headingStyle}>Quality Gates</h3>
        <p className="text-sm mb-4" style={textStyle}>
          Each phase has a Quality Gate — a set of conditions that MUST be true before the agent proceeds. This prevents garbage-in/garbage-out cascading through multi-phase skills. Quality gates are evaluated by the executing agent, not by external validators.
        </p>
      </section>

      {/* Chain Format */}
      <section id="std-chain-format" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Chain Format</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Chains are DAG-based skill compositions stored as .chain.json files:
        </p>
        <CodeBlock
          code={`{\n  "name": "startup-validation",\n  "description": "Validate a startup idea end-to-end",\n  "category": "business",\n  "steps": [\n    {\n      "skill_name": "startup-validator",\n      "alias": "validate",\n      "depends_on": [],\n      "config": {},\n      "phase_filter": null\n    },\n    {\n      "skill_name": "market-research",\n      "alias": "research",\n      "depends_on": ["validate"],\n      "config": {},\n      "phase_filter": null\n    },\n    {\n      "skill_name": "competitive-analysis",\n      "alias": "compete",\n      "depends_on": ["research"],\n      "config": {},\n      "phase_filter": null\n    },\n    {\n      "skill_name": "business-model-canvas",\n      "alias": "model",\n      "depends_on": ["validate", "research"],\n      "config": {},\n      "phase_filter": null\n    }\n  ]\n}`}
          filename="startup-validation.chain.json"
        />
        <p className="text-sm mt-4" style={textStyle}>
          Steps execute in topological order. Parallel execution is allowed when dependencies permit (e.g., "compete" and "model" can run in parallel if "research" is complete).
        </p>
      </section>

      {/* Validation */}
      <section id="std-validation" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Validation Protocol</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Skills are validated through <strong style={{ color: 'var(--text-primary)' }}>shadow validation</strong> — sandboxed execution against reference test cases with multi-metric similarity scoring.
        </p>
        <ol className="space-y-2 text-sm pl-5 mb-4" style={textStyle}>
          <li><strong style={{ color: 'var(--text-primary)' }}>Shadow Runs:</strong> The skill is executed N times (min_shadow_count) against test_cases.json inputs</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Similarity Scoring:</strong> Each output is compared to reference outputs using multi-metric similarity (semantic, structural, factual)</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Graduation:</strong> If average similarity exceeds graduation_threshold (default 0.75) across all runs, the skill graduates</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Consensus:</strong> Multiple validators must independently agree via trust-weighted BFT consensus</li>
        </ol>
        <p className="text-sm" style={textStyle}>
          Only domain-competent validators can vote. Voting power derives from behavioral trust (validation accuracy over time), not economic stake.
        </p>
      </section>

      {/* Trust */}
      <section id="std-trust" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Trust Scoring</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Every skill and every knowledge claim in the temporal KG carries a trust score computed from on-chain validation data:
        </p>
        <CodeBlock
          code={`trust = exp(-decay * divergence)\n\n  where:\n    decay       = 0.1 (configurable per domain)\n    divergence  = weighted average of validation mismatches\n\n  smoothed via EMA:\n    trust_new = alpha * trust_raw + (1 - alpha) * trust_previous`}
          filename="trust formula"
        />
        <p className="text-sm mt-4" style={textStyle}>
          Trust scores feed into:
        </p>
        <ul className="space-y-1 text-sm list-none p-0" style={textStyle}>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> <strong style={{ color: 'var(--text-primary)' }}>Chain composition</strong> — higher trust skills are preferred</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> <strong style={{ color: 'var(--text-primary)' }}>Knowledge graph</strong> — triple confidence = base_confidence * trust_score</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> <strong style={{ color: 'var(--text-primary)' }}>Community publishing</strong> — validator votes are weighted by their trust</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> <strong style={{ color: 'var(--text-primary)' }}>Marketplace ranking</strong> — discovery results favor higher-trust skills</li>
        </ul>
      </section>
    </>
  );
}

// ── Web3 Content ────────────────────────────────────────────────────

function Web3Content() {
  return (
    <>
      <section id="w3-prerequisites" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Prerequisites</h2>
        <ul className="space-y-2 text-sm list-none p-0" style={textStyle}>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> SkillChain installed (run the installer first)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> An Ethereum wallet (MetaMask, etc.)</li>
          <li className="flex items-center gap-2"><span style={{ color: 'var(--cyan)' }}>&#8250;</span> Base mainnet ETH (for gas)</li>
        </ul>
      </section>

      <section id="w3-init" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Initialize Your Node</h2>
        <CodeBlock code="skillchain init --agent claude" language="bash" filename="terminal" />
        <p className="text-sm mt-4" style={textStyle}>
          Generates your node identity (Ed25519 keypair), detects your AI agent, creates config, and registers on-chain.
        </p>
      </section>

      <section id="w3-publishing" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Publishing Skills On-Chain</h2>
        <CodeBlock
          code={`skillchain publish ./my-skill/ \\\n  --price 0 \\\n  --domain financial \\\n  --tags "csv,parsing,statistics" \\\n  --license OPEN`}
          language="bash"
          filename="terminal"
        />
        <p className="text-sm mt-4" style={textStyle}>
          The skill is uploaded to IPFS, metadata stored on-chain via SkillRegistry, and enters the validation queue.
        </p>
      </section>

      <section id="w3-validating" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Validating Skills</h2>
        <p className="text-sm mb-4" style={textStyle}>
          Validators earn trust and TRUST tokens for accurate validations.
        </p>
        <CodeBlock code="skillchain validate 42" language="bash" filename="terminal" />
      </section>

      <section id="w3-community" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Community Registry</h2>
        <p className="text-sm mb-4" style={textStyle}>
          The community registry allows anyone to submit skills for peer review:
        </p>
        <ol className="space-y-2 text-sm pl-5" style={textStyle}>
          <li><strong style={{ color: 'var(--text-primary)' }}>Submit</strong> — Package your skill with skill.md + manifest.json and submit via MCP tool or CLI</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Validate</strong> — 3+ community members review and cast trust-weighted votes</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Publish</strong> — At 67% weighted approval, the skill enters the marketplace with provenance</li>
        </ol>
      </section>

      <section id="w3-staking" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Staking</h2>
        <CodeBlock code="skillchain stake 100" language="bash" filename="terminal" />
        <p className="text-sm mt-4" style={textStyle}>
          Stake TRUST tokens to unlock higher tiers and increase validation weight.
        </p>
      </section>

      <section id="w3-status" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Status</h2>
        <CodeBlock code="skillchain status" language="bash" filename="terminal" />
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
                { name: 'SkillToken (TRUST)', addr: '0xAd96F3d1d6F6622f35baAcF72134765Da3C562be' },
                { name: 'TrustOracle', addr: '0x5e3b7016FE47eb6Dbdc276104494e55d540173e3' },
                { name: 'SkillRegistry', addr: '0x3B400Abeb3385aB5401D0076488c74AA5550f09D' },
                { name: 'Marketplace', addr: '0xaCFDBF10009Bad15840b7FfBf59B61D3A234aB6B' },
                { name: 'NodeRegistry', addr: '0x1EC05D141873eF47B46DEa8A30ae773E5630A3BE' },
                { name: 'GovernanceDAO', addr: '0xF8c6ef013B7e02806C0BeE0619797c929E8741A0' },
                { name: 'LifeRewards', addr: '0x1e436599C869Ab91161c08d7095C2e9E51dA93D0' },
                { name: 'Staking', addr: '0x02e6157d73Fe895cde4c5D2649fFfD2E93011894' },
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

      <section id="w3-troubleshooting" className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={headingStyle}>Troubleshooting</h2>
        <div className="space-y-6">
          {[
            { error: '"SkillChainError: no config found"', fix: 'Run skillchain init first.' },
            { error: 'Validation fails with low similarity', fix: 'Your skill\'s outputs may be non-deterministic. Add more specific test cases. Shadow validation requires 75% similarity across 5 runs.' },
            { error: 'MCP server not connecting', fix: 'Restart Claude Code. Check ~/.claude/settings.json has a "skillchain" entry under mcpServers.' },
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
          if (rect.top <= 120) {
            setActiveSection(section.id);
          }
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
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {/* Tab toggle */}
            <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
              {([
                { key: 'quickstart' as TabType, label: 'Quick Start', color: 'var(--cyan)' },
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

            <div className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
              {tab === 'quickstart' ? 'Getting Started' : tab === 'standard' ? 'Skill Standard v1.0' : 'Protocol & Tokens'}
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

        {/* Content */}
        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={headingStyle}>
            {tab === 'quickstart' ? 'Getting Started' : tab === 'standard' ? 'SkillChain Open Skill Standard' : 'Web3 Protocol Guide'}
          </h1>
          <p className="text-sm mb-4" style={textStyle}>
            {tab === 'quickstart'
              ? '176 skills. 190 chains. Install and run in under 2 minutes.'
              : tab === 'standard'
              ? 'The open standard for portable, validated, trust-scored AI skills.'
              : 'Initialize your node, publish skills on-chain, stake tokens, and validate.'}
          </p>

          {/* Mobile tab toggle */}
          <div className="flex lg:hidden rounded-lg overflow-hidden mb-8" style={{ border: '1px solid var(--border)' }}>
            {([
              { key: 'quickstart' as TabType, label: 'Start', color: 'var(--cyan)' },
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
