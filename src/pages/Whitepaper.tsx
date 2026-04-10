import { Link } from 'react-router-dom';

const h = { color: 'var(--text-primary)' };
const t = { color: 'var(--text-secondary)' };
const accent = (c: string) => ({ color: `var(--${c})` });

export default function Whitepaper() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={h}>
          FlowFabric Whitepaper
        </h1>
        <p className="text-lg mb-2" style={accent('cyan')}>
          AI Flows That Evolve From Language to Code Through Consensus
        </p>
        <p className="text-sm mb-8" style={t}>
          Open infrastructure for composable, validated, trust-scored AI procedures
        </p>
        <p className="text-xs" style={t}>
          Version 2.0 | April 2026 | The Wayfinder Trust
        </p>
      </div>

      {/* Abstract */}
      <Section title="Abstract">
        <P>FlowFabric is a protocol for creating, validating, composing, and trading AI-executable procedures (flows) as network assets. Flows start as natural language instructions, gain trust through decentralized shadow validation, and can eventually compile into deterministic code — software born from conversation, proven by consensus.</P>
        <P>The platform consists of three layers: an open flow marketplace with hundreds of validated flows, a visual Composer for building multi-flow chains, and an on-chain trust economy (TRUST token on Base mainnet) where creators earn royalties and validators earn rewards.</P>
        <P>Individual flows are free to run. Connecting flows into chains, creating new flows, and publishing on-chain require TRUST tokens — earned through contribution, not purchase.</P>
      </Section>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { label: 'Free to Run', desc: 'Every flow is free. No account needed.', color: 'cyan' },
          { label: 'Proven by Consensus', desc: 'Shadow validation. Math, not reviews.', color: 'purple' },
          { label: 'Language → Code', desc: 'Flows evolve from prompts to compiled software.', color: 'gold' },
        ].map((item) => (
          <div key={item.label} className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-bold mb-1" style={accent(item.color)}>{item.label}</div>
            <div className="text-xs leading-relaxed" style={t}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 1. The Problem */}
      <Section title="1. The Problem">
        <P>AI agents can follow complex procedures — budgeting, code review, market research, career planning. But every time you close the conversation, that capability vanishes. There is no way to package a working AI procedure, prove it produces consistent results, share it with others, or earn from its use.</P>
        <P>Existing solutions fail in different ways. Prompt libraries are unvalidated text. Agent marketplaces (AutoGPT) trade complete agents, not composable procedures. Memory systems (MemPalace) remember context but don't standardize execution. None of them create an economy around quality.</P>
      </Section>

      {/* 2. The Solution */}
      <Section title="2. Flows as Open Infrastructure">
        <P>A flow is a structured AI procedure with defined phases, entry criteria, quality gates, and typed inputs/outputs. Flows follow the FlowFabric Open Skill Standard (FOSS), making them portable across any MCP-compatible AI agent.</P>
        <P>Individual flows are free to run — they are open infrastructure, like open-source libraries. The value isn't in hiding flows behind a paywall. It's in the trust scores that prove they work, the compositions that connect them into chains, and the economy that rewards quality.</P>
        <H3>Flow Package Format</H3>
        <P>Every flow is a directory containing a skill.md (execution specification with phases and quality gates) and a manifest.json (machine-readable metadata including typed inputs and outputs). The manifest enables automated chain composition — the system matches one flow's outputs to another flow's inputs.</P>
      </Section>

      {/* 3. Flow Evolution */}
      <Section title="3. Flow Evolution: From Language to Code">
        <P>Flows are not static. They evolve through validation:</P>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}><th className="text-left px-4 py-2" style={t}>Stage</th><th className="text-left px-4 py-2" style={t}>Description</th><th className="text-left px-4 py-2" style={t}>Requirement</th></tr></thead>
            <tbody style={t}>
              {[
                ['Prompt', 'Natural language instruction', 'None'],
                ['Flow', 'Structured phases with quality gates', 'Follows FOSS standard'],
                ['Validated', 'Shadow-tested, trust-scored on-chain', '5+ validator attestations'],
                ['Graduated', 'Proven consistent across many runs', '100+ validations, 95%+ similarity'],
                ['Compiled', 'Executable code, no AI needed', 'Automatic on graduation'],
              ].map(([stage, desc, req]) => (
                <tr key={stage} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{stage}</td>
                  <td className="px-4 py-2">{desc}</td>
                  <td className="px-4 py-2">{req}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>A compiled flow runs as deterministic code — zero token cost, instant execution, AI-independent. This is software born from natural language and proven through decentralized consensus. It has never existed before.</P>
      </Section>

      {/* 4. Chain Composition */}
      <Section title="4. Chain Composition">
        <P>Individual flows are building blocks. Chains are where value compounds — multi-flow pipelines that produce outcomes no single flow can achieve alone.</P>
        <P>The visual Composer allows users to drag flows onto a canvas, connect them by matching inputs to outputs, customize individual flows, and execute the entire chain interactively via Claude Code. Custom flows can be described in natural language and built on-the-fly during chain execution.</P>
        <H3>Access Model</H3>
        <P>Free users can browse all flows, run individual flows, and load chain templates onto the canvas to see how chains work. Connecting flows into chains, creating custom flows, scheduling recurring runs, and publishing on-chain all require TRUST tokens. This ensures creators are invested in the ecosystem before they can publish to it.</P>
      </Section>

      {/* 5. Trust-Weighted Consensus */}
      <Section title="5. Trust-Weighted Consensus">
        <P>Validation uses shadow testing — running candidate flows against reference test cases with multi-metric similarity scoring. Multiple validators must independently agree via trust-weighted BFT consensus.</P>
        <P>Trust is computed as:</P>
        <div className="p-4 rounded-lg my-4 font-mono text-xs sm:text-sm overflow-x-auto" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
          trust = exp(-decay * divergence)<br />
          smoothed via EMA: trust_new = α * trust_raw + (1 - α) * trust_previous
        </div>
        <P>Key properties: trust decays fast on failure, recovers slowly through consistent performance, cannot be self-asserted or purchased. Only domain-competent validators can vote. Voting power derives from behavioral accuracy over time, not economic stake. This is fundamentally different from proof-of-stake systems.</P>
      </Section>

      {/* 6. TRUST Token Economy */}
      <Section title="6. TRUST Token Economy">
        <P>TRUST is the native token of the FlowFabric network, deployed on Base mainnet (ERC-20). TRUST is earned AND bought, but earned TRUST boosts influence (validator weight, governance power).</P>
        <H3>Revenue Split (enforced by smart contract)</H3>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}><th className="text-left px-4 py-2" style={t}>Recipient</th><th className="text-left px-4 py-2" style={t}>Share</th><th className="text-left px-4 py-2" style={t}>Why</th></tr></thead>
            <tbody style={t}>
              <tr style={{ borderTop: '1px solid var(--border)' }}><td className="px-4 py-2 font-medium" style={accent('gold')}>Creator</td><td className="px-4 py-2">70%</td><td className="px-4 py-2">Built or published the skill/flow</td></tr>
              <tr style={{ borderTop: '1px solid var(--border)' }}><td className="px-4 py-2 font-medium" style={accent('green')}>Original Author</td><td className="px-4 py-2">15%</td><td className="px-4 py-2">If derivative — royalties flow to the original</td></tr>
              <tr style={{ borderTop: '1px solid var(--border)' }}><td className="px-4 py-2 font-medium" style={accent('purple')}>Validators</td><td className="px-4 py-2">15%</td><td className="px-4 py-2">Proved the flow works via shadow validation</td></tr>
            </tbody>
          </table>
        </div>
        <P>When someone modifies an existing flow and publishes it as a derivative, the original author receives 15% of all TRUST earned on that derivative — automatically, via smart contract, forever. This incentivizes creating flows worth forking.</P>
        <H3>Ways to Earn</H3>
        <P>Publish flows that others use. Validate flows for quality. Create chains that compose multiple flows. Fork and improve existing flows (derivatives). All earnings are on-chain and verifiable.</P>
        <H3>Token Tiers</H3>
        <P>TRUST balance determines access tier. TRUST can be earned through contribution or purchased, but earned TRUST boosts influence in validation and governance.</P>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}><th className="text-left px-4 py-2" style={t}>Tier</th><th className="text-left px-4 py-2" style={t}>TRUST Balance</th><th className="text-left px-4 py-2" style={t}>Access</th></tr></thead>
            <tbody style={t}>
              {[
                ['Explorer', '0', 'Browse and run individual flows (free)'],
                ['Builder', '500', 'Build chains, save/load/export chains'],
                ['Creator', '2,500', 'Publish flows and chains on-chain'],
                ['Pro Creator', '10,000', 'Advanced scheduling and analytics'],
                ['Validator', '25,000 (staked)', 'Validate flow quality, earn validation rewards'],
                ['Governor', '100,000 (staked)', 'DAO voting on protocol parameters'],
              ].map(([tier, balance, access]) => (
                <tr key={tier} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{tier}</td>
                  <td className="px-4 py-2">{balance}</td>
                  <td className="px-4 py-2">{access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 7. Smart Contracts */}
      <Section title="7. Smart Contract Architecture">
        <P>Nine contracts deployed on Base mainnet handle the full lifecycle:</P>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}><th className="text-left px-4 py-2" style={t}>Contract</th><th className="text-left px-4 py-2" style={t}>Purpose</th></tr></thead>
            <tbody style={t}>
              {[
                ['TRUST Token', 'ERC-20 token — earned and bought, earned TRUST boosts influence'],
                ['SkillRegistry', 'On-chain flow registration with creator attribution'],
                ['ValidationRegistry', 'Shadow validation results, consensus tracking'],
                ['TrustOracle', 'Computes trust scores from validation history'],
                ['Marketplace', 'Listings, purchases, royalty distribution'],
                ['NodeRegistry', 'Validator identity and domain competence'],
                ['Staking', 'Stake TRUST to unlock validator privileges'],
                ['GovernanceDAO', 'Protocol parameter changes via weighted voting'],
                ['LifeRewards', 'Proof-of-living rewards (future)'],
              ].map(([name, purpose]) => (
                <tr key={name} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{name}</td>
                  <td className="px-4 py-2">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 8. Competitive Position */}
      <Section title="8. Competitive Position">
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}><th className="text-left px-4 py-2" style={t}>Platform</th><th className="text-left px-4 py-2" style={t}>Approach</th><th className="text-left px-4 py-2" style={t}>FlowFabric Advantage</th></tr></thead>
            <tbody style={t}>
              {[
                ['OpenClaw', 'Runtime flow composition, messaging-first', 'No validation, no trust scores, no on-chain provenance'],
                ['MemPalace', 'Tiered memory, spatial knowledge', 'L0–L3 tiered memory + temporal knowledge graph built into every flow run. MemPalace stops at memory; FlowFabric adds execution, validation, and a creator economy on top.'],
                ['AutoGPT', 'Visual block graph, agent marketplace', 'Low-level blocks, no flow standard, no validation'],
                ['Prompt Libraries', 'Shared text prompts', 'Unvalidated, no composition, no evolution path'],
              ].map(([platform, approach, advantage]) => (
                <tr key={platform} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{platform}</td>
                  <td className="px-4 py-2">{approach}</td>
                  <td className="px-4 py-2">{advantage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>FlowFabric is the only platform where flows evolve from natural language to compiled code through decentralized consensus, with derivative royalties enforced by smart contract.</P>
      </Section>

      {/* 9. Intellectual Property */}
      <Section title="9. Intellectual Property">
        <P>Patent Family F (provisional filed) covers the core innovations: trust-weighted BFT consensus where voting power derives from behavioral trust, shadow validation with multi-metric similarity scoring, domain competence gating, and the universal flow format with adapters.</P>
        <P>Additional innovations under consideration for continuation filings: validated dynamic flow composition with confidence-gated fallback, and the autonomous compilation of validated AI procedures into executable code through trust-weighted consensus.</P>
        <P>The blockchain provides complementary protection — provenance, transparency, and immutability — but does not replace patent protection against architectural copying.</P>
      </Section>

      {/* 10. The Thesis */}
      <Section title="10. The Thesis">
        <P>AI capabilities will commoditize. Every model will be able to follow instructions. The scarce resource is not intelligence — it's proven, validated, composable procedures with known trust scores and verifiable provenance.</P>
        <P>FlowFabric captures this value at the procedure layer. Flows are open infrastructure. Trust is the product. Composition is the premium feature. Evolution to code is the endgame.</P>
        <P>The cost of bad behavior always exceeds the benefit. The cost of good behavior always decreases over time. The network gets better the more people use it. And every improvement compounds through derivative royalties.</P>
      </Section>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
        <Link
          to="/compose"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{ background: 'var(--cyan)', color: 'var(--bg-primary)' }}
        >
          Open the Composer
        </Link>
        <Link
          to="/docs"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{ border: '1px solid var(--border)', color: 'var(--cyan)' }}
        >
          Read Documentation
        </Link>
      </div>
    </div>
  );
}

// Reusable components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{children}</p>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>{children}</h3>;
}
