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
          Seamless collaboration, sustained by an open earners network
        </p>
        <p className="text-sm mb-8" style={t}>
          How a shared alignment layer and a contributor economy grow together
        </p>
        <p className="text-xs" style={t}>
          Version 2.0 &middot; April 2026 &middot; The Wayfinder Trust
        </p>
      </div>

      {/* Abstract */}
      <Section title="Abstract">
        <P>FlowFabric is a collaboration network. On the surface, it gives any two people a structured, private way to align — on a contract, a co-founding split, a hire, a renovation scope, a business partnership. Both sides answer privately. Claude mediates. Neither party sees the other's raw inputs. Both receive the same neutral synthesis: what you agree on, where the gaps are, and a concrete path forward.</P>
        <P>Behind that surface is an earners ecosystem. The flows that power every session — the structured procedures Claude follows — are built, validated, and maintained by contributors who earn for their work. Every time a flow runs, the people who made it worth running get paid. The better the contributors, the better the collaboration. The better the collaboration, the more sessions run. The more sessions run, the more contributors earn.</P>
        <P>This document explains both layers: how the collaboration works, and how the economy that sustains it is designed.</P>
      </Section>

      {/* Three pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { label: 'Free to use', desc: 'Fabric sessions cost nothing to start. No account needed. Works across any industry, any counterpart.', color: 'cyan' },
          { label: 'Earners behind it', desc: 'Every flow was built by someone who gets paid when it runs. Contributors, validators, and authors earn on-chain.', color: 'green' },
          { label: 'Self-sustaining', desc: 'The more people collaborate, the more contributors earn. The more contributors earn, the better the flows get.', color: 'gold' },
        ].map((item) => (
          <div key={item.label} className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-bold mb-1" style={accent(item.color)}>{item.label}</div>
            <div className="text-xs leading-relaxed" style={t}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* 1. The Problem */}
      <Section title="1. The Problem">
        <P>Getting two parties aligned is one of the most friction-heavy interactions in professional life. The co-founder conversation that drags on for weeks. The freelance brief that collapses because neither side surfaced their real constraints early enough. The salary negotiation where one side anchors and the other spends the rest of the conversation reacting to it. The contractor bid where the client's budget and the contractor's floor are $10K apart — and nobody found out until two hours into a scoping call.</P>
        <P>The problem isn't that people can't communicate. It's that the format of most professional conversations rewards strategic ambiguity over honest disclosure. You don't show your hand first. You anchor high and negotiate down. You wait to see what the other side says before committing. Everyone does this, everyone knows everyone does this, and it still costs everyone time, money, and bad deals.</P>
        <P>Separately: finding the right counterpart in the first place is slow and expensive. Job boards, marketplaces, LinkedIn, referrals — all require cold outreach, which means one party reaches out, the other decides whether to respond, and weeks pass before both parties are in the same conversation with enough context to know whether they're even a fit.</P>
      </Section>

      {/* 2. The Collaboration Layer */}
      <Section title="2. The Collaboration Layer">
        <P>FlowFabric's answer to the alignment problem is Fabric — a structured session format where both parties answer privately and Claude synthesises both sides into a neutral analysis. The session runs in three steps.</P>

        <H3>How a Fabric session works</H3>
        <P>The host picks a use case — freelance brief, co-founder alignment, salary negotiation, renovation scope, or any other structured interaction — and sends a private link to the other party. Both sides answer the same set of questions independently, through the same interface, with no knowledge of what the other side is writing. Once both sides submit, Claude reads each set of answers in complete isolation, extracts the key positions from each party independently, and then synthesises those positions into a neutral report: where the parties agree, where the gaps are, and a concrete suggestion for bridging each one.</P>
        <P>The raw answers from either party are never shared with the other. The synthesis is the only output either party sees. This eliminates anchoring, posturing, and strategic sequencing — neither party can game the result because neither party sees the other's inputs until the synthesis is already done.</P>

        <H3>Fabric Discovery</H3>
        <P>Discovery solves the counterpart problem. Any user can post a plain-English listing — what they need, what they offer, who they are looking for. Claude reads every listing on the board, scores the best counterparts using a multi-factor alignment model, and surfaces ranked matches with AI-written introductions explaining the fit. Accepting a match creates a Fabric session immediately. No cold outreach. No back-and-forth scheduling. No wasted calls to find out you weren't a fit.</P>
        <P>The board is industry-agnostic by design. A homeowner looking for a kitchen contractor. A founder looking for a co-founder. A freelancer advertising their services to inbound clients. A buyer and a seller negotiating terms. The format is identical across every use case — only the flow changes.</P>

        <H3>Privacy model</H3>
        <P>Discovery listings are intentionally public — users post what they are comfortable advertising. Fabric sessions are private and ephemeral. Each party's answers are visible only to the synthesis layer; the other party never sees raw inputs. Sessions expire after seven days. No persistent profile is required. Wallet address is the only identity anchor, and even that is optional for guests.</P>
      </Section>

      {/* 3. The Earners Ecosystem */}
      <Section title="3. The Earners Ecosystem">
        <P>Every Fabric session runs on a flow — a structured procedure that defines the questions, the synthesis format, and the quality of the output. Those flows were built by contributors. When a flow runs, the contributor who built it earns. When someone improves an existing flow and publishes a derivative, the original author earns a royalty on every run of the derivative, automatically, enforced by smart contract, forever.</P>
        <P>This is not a subsidy or a platform incentive. It is the economic structure of the network. Collaboration is the use case. The earners ecosystem is what makes it self-sustaining.</P>

        <H3>Who earns</H3>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-4 py-2" style={t}>Role</th>
              <th className="text-left px-4 py-2" style={t}>What they do</th>
              <th className="text-left px-4 py-2" style={t}>What they earn</th>
            </tr></thead>
            <tbody style={t}>
              {[
                ['Flow Creator', 'Builds and publishes a flow used in sessions', '70% of TRUST generated on their flows'],
                ['Original Author', 'Published a flow that others fork and improve', '15% royalty on all derivative earnings, forever'],
                ['Validator', 'Shadow-tests flows to prove they produce consistent results', '15% of TRUST on flows they validated'],
                ['Chain Builder', 'Connects flows into multi-step pipelines', 'TRUST on every chain run'],
              ].map(([role, what, earns]) => (
                <tr key={role} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{role}</td>
                  <td className="px-4 py-2">{what}</td>
                  <td className="px-4 py-2" style={accent('green')}>{earns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H3>TRUST token</H3>
        <P>TRUST is the native token of the FlowFabric network, deployed on Base mainnet (ERC-20). TRUST is both earned and purchasable, but earned TRUST carries more weight — it boosts validator influence and governance voting power in ways purchased TRUST does not. This means the people with the most say over the network are those who have contributed to it, not just bought into it.</P>
        <P>TRUST balance also determines what you can do on the network. Higher tiers unlock the ability to build chains, publish flows on-chain, and participate in validation — which are also the activities that generate more earnings. Access and earnings scale together.</P>

        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-4 py-2" style={t}>Tier</th>
              <th className="text-left px-4 py-2" style={t}>TRUST Required</th>
              <th className="text-left px-4 py-2" style={t}>What unlocks</th>
            </tr></thead>
            <tbody style={t}>
              {[
                ['Explorer', '0', 'Browse flows, run individual flows, start Fabric sessions'],
                ['Builder', '500', 'Build chains, save and export pipelines'],
                ['Creator', '2,500', 'Publish flows and chains on-chain, earn on every run'],
                ['Pro Creator', '10,000', 'Advanced scheduling, detailed analytics, API access'],
                ['Validator', '25,000 staked', 'Validate flow quality, earn 15% on validated flows'],
                ['Governor', '100,000 staked', 'DAO voting on protocol parameters'],
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

        <H3>Derivative royalties</H3>
        <P>When a contributor improves an existing flow and publishes a derivative, the original author automatically receives 15% of all TRUST earned on that derivative — enforced by smart contract, with no platform intermediary, forever. This creates a direct financial incentive to build flows worth improving, and to improve flows worth using. The quality of the network compounds through every fork.</P>

        <H3>Tokenomics</H3>
        <P>TRUST has a hard cap of one billion tokens. That ceiling is enforced by the contract — no governance vote or admin action can exceed it. Of the 1B supply: 20% was allocated to the DAO treasury at launch, 15% is vested to the founding team over four years with a one-year cliff, and the remaining 65% enters circulation through network activity — flow runs, validation rewards, and onboarding incentives.</P>

        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-4 py-2" style={t}>Allocation</th>
              <th className="text-left px-4 py-2" style={t}>Amount</th>
              <th className="text-left px-4 py-2" style={t}>Vesting</th>
            </tr></thead>
            <tbody style={t}>
              {[
                ['DAO Treasury', '200M (20%)', 'Immediate — governed by DAO'],
                ['Founding Team', '150M (15%)', '4-year linear, 1-year cliff'],
                ['Ecosystem / Activity', '650M (65%)', 'Emitted via flow runs, validation, onboarding rewards'],
              ].map(([alloc, amount, vest]) => (
                <tr key={alloc} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{alloc}</td>
                  <td className="px-4 py-2">{amount}</td>
                  <td className="px-4 py-2">{vest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>Subscription prices are denominated in USD and converted to TRUST at the current market rate at the moment of payment — $5/mo for Builder, $20/mo for Professional, $100/mo for Enterprise. As TRUST appreciates, subscribers pay fewer tokens for the same access. This makes holding TRUST economically meaningful: the longer you hold, the cheaper the platform becomes in token terms.</P>
        <P>A deflationary pressure is built in: 2% of every premium flow purchase is permanently burned. Staking slashes also burn tokens — 50% of any slashed validator stake is destroyed. Neither mechanism is dramatic in isolation, but both compound steadily as network activity scales.</P>
      </Section>

      {/* 4. Flows — the building blocks */}
      <Section title="4. Flows — The Building Blocks">
        <P>A flow is a structured AI procedure with defined phases, entry criteria, quality gates, and typed inputs and outputs. Flows follow the FlowFabric Open Skill Standard (FOSS), making them portable across any MCP-compatible AI agent. There are currently 165+ flows on the network covering career decisions, contract negotiation, health planning, financial analysis, business strategy, and dozens of other use cases.</P>
        <P>Individual flows are free to run. The value isn't in charging for access to procedures — it's in the trust scores that prove they work, the compositions that connect them into chains, and the earnings that flow to the people who made them.</P>

        <H3>Chain composition</H3>
        <P>Individual flows are building blocks. Chains are where value compounds — multi-flow pipelines where the output of one flow feeds into the next, producing outcomes no single flow can achieve alone. The visual Composer allows anyone to drag flows onto a canvas, connect them by matching inputs to outputs, and execute the entire chain interactively via Claude Code.</P>

        <H3>Flow evolution</H3>
        <P>Flows are not static. They evolve as validators prove their consistency:</P>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-4 py-2" style={t}>Stage</th>
              <th className="text-left px-4 py-2" style={t}>Description</th>
              <th className="text-left px-4 py-2" style={t}>Requirement</th>
            </tr></thead>
            <tbody style={t}>
              {[
                ['Prompt', 'Natural language instruction', 'None'],
                ['Flow', 'Structured phases with quality gates', 'Follows FOSS standard'],
                ['Validated', 'Shadow-tested, trust-scored on-chain', '5+ validator attestations'],
                ['Graduated', 'Proven consistent across many runs', '100+ validations, 95%+ similarity'],
                ['Compiled', 'Executable code — zero AI cost, instant execution', 'Automatic on graduation'],
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
        <P>A compiled flow runs as deterministic code with zero token cost and instant execution. It started as a plain-English instruction and became software through use and consensus. The people who validated it along the way earned for every step of that journey.</P>
      </Section>

      {/* 5. How validation works */}
      <Section title="5. How Validation Works">
        <P>Validation uses shadow testing — running candidate flows against reference test cases with multi-metric similarity scoring. Multiple validators run independently and must converge on the result via trust-weighted consensus before a flow's score updates. No single validator can move a trust score alone.</P>
        <P>Trust is computed as:</P>
        <div className="p-4 rounded-lg my-4 font-mono text-xs sm:text-sm overflow-x-auto"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
          trust = exp(-decay &times; divergence)<br />
          smoothed via EMA: trust_new = &alpha; &times; trust_raw + (1 - &alpha;) &times; trust_previous
        </div>
        <P>Key properties: trust decays fast on failure and recovers slowly through consistent performance. It cannot be purchased or self-asserted. Only domain-competent validators can vote, and voting power derives from behavioral accuracy over time — not economic stake. This is fundamentally different from proof-of-stake systems, where capital buys influence regardless of competence.</P>
      </Section>

      {/* 6. Smart Contracts */}
      <Section title="6. Smart Contract Architecture">
        <P>Ten contracts deployed on Base mainnet handle the full lifecycle — from token issuance to validation consensus to royalty distribution:</P>
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-4 py-2" style={t}>Contract</th>
              <th className="text-left px-4 py-2" style={t}>Purpose</th>
            </tr></thead>
            <tbody style={t}>
              {[
                ['TRUST Token', 'ERC-20 token — earned and purchased; earned TRUST boosts validator and governance weight'],
                ['SkillRegistry', 'On-chain flow registration with creator attribution and derivative lineage'],
                ['ValidationRegistry', 'Shadow validation results and consensus tracking'],
                ['TrustOracle', 'Computes trust scores from full validation history'],
                ['Marketplace', 'Listings, purchases, and automatic royalty distribution'],
                ['NodeRegistry', 'Validator identity, domain competence, and stake tracking'],
                ['Staking', 'Stake TRUST to unlock validator and governor privileges'],
                ['GovernanceDAO', 'Protocol parameter changes via trust-weighted voting'],
                ['LifeRewards', 'Proof-of-living contribution rewards'],
                ['CommunityPool', 'Yield pool funded by network activity, distributed to contributors'],
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

      {/* 7. Competitive Position */}
      <Section title="7. Competitive Position">
        <div className="overflow-x-auto rounded-lg my-4" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'var(--bg-card)' }}>
              <th className="text-left px-4 py-2" style={t}>Platform</th>
              <th className="text-left px-4 py-2" style={t}>What they do</th>
              <th className="text-left px-4 py-2" style={t}>What they miss</th>
            </tr></thead>
            <tbody style={t}>
              {[
                ['LinkedIn / marketplaces', 'Profiles, search, cold outreach', 'No AI matching into structured sessions. Finding someone is step one — aligning is the hard part, and nothing helps with that.'],
                ['AutoGPT / agent platforms', 'Visual block graphs, agent marketplaces', 'No two-party session model, no validation, no trust scores, no earnings for builders.'],
                ['Prompt libraries', 'Shared text prompts', 'Unvalidated, no earnings model, no composition, no counterpart matching.'],
                ['MemPalace', 'Tiered memory, spatial knowledge graphs', 'Memory without execution. FlowFabric adds validation, a creator economy, and a Discovery network on top.'],
                ['Calendly / Notion forms', 'Scheduling and intake forms', 'One-sided data collection. No synthesis, no mediation, no private dual-submission.'],
              ].map(([platform, what, miss]) => (
                <tr key={platform} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-medium" style={h}>{platform}</td>
                  <td className="px-4 py-2">{what}</td>
                  <td className="px-4 py-2">{miss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>No other platform combines AI-mediated two-party alignment with an open earners network. The collaboration layer and the contributor economy are not separate products — they are the same product, viewed from two different angles.</P>
      </Section>

      {/* 8. IP */}
      <Section title="8. Intellectual Property">
        <P>Patent Family F (provisional filed) covers the core innovations: trust-weighted BFT consensus where voting power derives from behavioral trust rather than economic stake, shadow validation with multi-metric similarity scoring, domain competence gating for validators, and the universal flow format with cross-platform adapters.</P>
        <P>Additional innovations under consideration for continuation filings include validated dynamic flow composition with confidence-gated fallback, and the autonomous compilation of validated AI procedures into executable code through trust-weighted consensus.</P>
        <P>Blockchain deployment provides complementary protection — provenance, transparency, and immutability — but does not replace patent protection against architectural copying.</P>
      </Section>

      {/* 9. The Thesis */}
      <Section title="9. The Thesis">
        <P>The hardest part of most professional interactions is not the work itself. It is the conversation before the work starts — finding the right person, disclosing enough without exposing too much, and reaching agreement without either side gaming the process. FlowFabric eliminates that friction at the protocol level.</P>
        <P>Behind that protocol is an economy designed to sustain itself. The people who build the flows that power every session earn when those flows run. The validators who prove those flows work earn for the proof. The original authors earn forever on every improvement others make to their work. The network gets better as more people use it, and every improvement compounds through derivative royalties and a richer Discovery board.</P>
        <P>The collaboration is the product. The earners ecosystem is what makes it permanent.</P>
      </Section>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
        <Link
          to="/start"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{ background: 'var(--cyan)', color: 'var(--bg-primary)' }}
        >
          Start a session
        </Link>
        <Link
          to="/discover/new"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{ border: '1px solid rgba(167,139,250,0.3)', color: 'var(--purple)' }}
        >
          Post to Discovery
        </Link>
        <Link
          to="/docs"
          className="px-8 py-3 rounded-lg text-sm font-semibold no-underline transition-all"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
