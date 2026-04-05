# SkillChain: A Decentralized Protocol for AI Skill Discovery, Validation, and Trade

**Trust as Consensus -- A New Paradigm for AI Agent Interoperability**

Version 1.0 | March 2026 | The Wayfinder Trust

---

## Abstract

AI agents are increasingly capable of learning reusable procedures -- skills -- from their own execution. But those skills remain trapped inside the systems that created them. An agent that learns to parse SEC filings cannot share that capability with another agent without manual extraction, reformatting, and blind-faith installation. There is no verification. No provenance. No market. Worse, every major AI vendor is building its own walled garden -- skills built for Claude cannot run on GPT, and vice versa.

SkillChain is an agent-agnostic, decentralized protocol for publishing, validating, and trading AI skills as first-class network assets. Skills are packaged as `.skillpack` bundles -- markdown procedures, test cases, and cryptographic provenance -- in a format that any LLM can consume. Platform-specific adapters translate the universal `.skillpack` into each agent's native format: Claude skills, GPT custom instructions, Gemini system instructions, Cursor rules, or local model system prompts. Publish once, works everywhere.

Validation uses shadow testing -- running candidate skills against known-good outputs -- rather than subjective reviews. Shadow validation is itself agent-agnostic: it tests inputs and outputs, not which LLM generated them. Consensus is achieved through a trust-weighted Byzantine Fault Tolerant protocol where voting power derives from demonstrated competence, not economic stake.

The core innovation is the integration of the Assured Learning Governor (ALG), a patented governance framework where trust is computed as `exp(-decay * divergence)` with EMA smoothing. Trust decays fast on failure, recovers slowly through consistent performance, and cannot be self-asserted or purchased. This creates a network where the cost of bad behavior always exceeds the benefit, and where quality is enforced by mathematics rather than moderation.

The long-term thesis: as skills accumulate and graduate from pattern to executable code, the network progressively reduces its dependence on any single AI vendor. SkillChain is not a wrapper around LLMs. It is not a marketplace for any single AI platform. It is the interoperability layer for AI skills -- infrastructure for what comes after vendor lock-in.

---

## 1. Introduction

### The AI Skill Fragmentation Problem

Every major AI platform is building a skill or tool ecosystem. Anthropic has tool use. OpenAI has GPTs and actions. Google has extensions. Each is incompatible with the others, each is controlled by a single vendor, and none offer meaningful quality guarantees.

This creates three problems:

**Vendor lock-in.** A skill built for Claude cannot run on GPT. A workflow tuned for one platform is worthless on another. Developers invest in ecosystems they cannot leave.

**No quality guarantee.** App stores and plugin directories use star ratings and download counts -- popularity proxies, not quality metrics. A five-star plugin may fail silently on edge cases. There is no way to verify that a skill actually works before installing it.

**Platform risk.** When the vendor changes their API, deprecates a feature, or decides your use case violates their terms, your skills disappear. You own nothing.

### SkillChain's Thesis

Procedural knowledge -- the ability to reliably perform a task -- is a tradeable asset. If it can be packaged, verified, and transferred between agents regardless of their underlying model, then skills become a new category of digital property.

SkillChain treats skills the way Bitcoin treats value and Ethereum treats computation: as a decentralized, verifiable, ownable resource that no single entity controls.

---

## 2. Architecture Overview

SkillChain operates across two layers: an on-chain settlement layer for ownership, payments, and governance, and an off-chain protocol layer for skill validation, trust computation, and content distribution.

```
+------------------------------------------------------------------+
|                     Agent Adapters                                |
|   Claude  |  GPT  |  Gemini  |  Cursor  |  LangChain  |  Local   |
+------------------------------------------------------------------+
|                        Applications                               |
|   SDK (Python)  |  CLI  |  Agent Integrations  |  REST API       |
+------------------------------------------------------------------+
|                       Marketplace                                 |
|   Purchases  |  Royalties  |  Subscriptions  |  Fee Splits       |
+------------------------------------------------------------------+
|                     Consensus Layer                               |
|   Trust-Weighted BFT  |  Validator Selection  |  Block Finality  |
+------------------------------------------------------------------+
|                      Skill Registry                               |
|   .skillpack Format  |  IPFS Content  |  Shadow Validation       |
+------------------------------------------------------------------+
|                     Protocol Layer                                |
|   ALG Trust Module  |  Kademlia DHT  |  Peer Discovery           |
+------------------------------------------------------------------+
|                     Transport Layer                               |
|   libp2p  |  Ed25519 Signing  |  Message Freshness (60s)         |
+------------------------------------------------------------------+
|                     Settlement Layer                              |
|   Base L2 (Ethereum)  |  Solidity Contracts  |  UUPS Proxies     |
+------------------------------------------------------------------+
```

### On-Chain Components (Base L2)

Eight Solidity contracts handle the financial and governance operations that require global consensus:

- **SkillToken** -- ERC-20 TRUST token with 1B hard cap and burn mechanics
- **NodeRegistry** -- Node registration and staking tiers
- **SkillRegistry** -- Skill metadata, ownership, pricing, and active/inactive state
- **TrustOracle** -- Bridge between off-chain trust scores and on-chain access control
- **ValidationRegistry** -- On-chain record of shadow validation outcomes
- **Marketplace** -- Purchases, royalty distribution, and subscription management
- **Staking** -- Stake-for-tier system with lockup periods
- **GovernanceDAO** -- Proposal and voting with anti-plutocratic weighting

Contracts are deployed on Base, an Ethereum L2, for low transaction fees and full EVM ecosystem compatibility. All contracts use the UUPS proxy pattern for upgradeability.

### Off-Chain Components (Python Protocol)

The computationally intensive and latency-sensitive operations run off-chain:

- **ALG Trust Module** -- Exponential decay + EMA trust computation (patent-protected)
- **Shadow Validator** -- 5-run skill validation with Jaccard + bigram similarity scoring
- **Kademlia DHT** -- Distributed hash table for peer discovery (k=20, alpha=3)
- **IPFS Gateway** -- Content-addressed storage for skill packages
- **Consensus Engine** -- Tendermint-style BFT with trust-derived voting weights

Trust computation is kept off-chain deliberately. The ALG algorithm is patent-protected, and keeping it off-chain preserves both the IP and the ability to evolve the trust model without contract migrations.

---

## 3. Trust as Consensus

This is the core innovation. Every blockchain must answer: who gets to decide what is true? Bitcoin answers with computation (proof-of-work). Ethereum answers with capital (proof-of-stake). SkillChain answers with competence (proof-of-trust).

### The ALG Trust Function

Trust in SkillChain is computed using the Assured Learning Governor (ALG) framework, adapted from its origin in Velma's cognitive governance system. The function is:

```
raw_trust = exp(-DECAY_GAIN * divergence)
smoothed_trust = EMA_ALPHA * raw_trust + (1 - EMA_ALPHA) * previous_ema
```

Where:
- `DECAY_GAIN = 5.0` -- Controls how aggressively trust drops with divergence
- `EMA_ALPHA = 0.15` -- Smoothing factor to prevent oscillation
- `divergence = 1.0 - average_similarity` -- How far skill output deviates from expected

Properties of this function:
- **Trust = 1.0 when divergence = 0.0** -- Perfect behavior yields perfect trust
- **Monotonically non-increasing** -- More deviation always means less trust
- **Asymptotic approach to zero** -- Trust never quite reaches zero, but effectively freezes the node
- **EMA smoothing prevents gaming** -- A single good result cannot erase a history of failures

### Why Trust-Weighted BFT Beats Proof-of-Stake

In proof-of-stake systems, voting power is proportional to capital. This creates plutocratic capture: the wealthiest participants control the network regardless of their competence. A validator with $100M staked but producing garbage outputs has 100x the influence of a validator with $1M staked but perfect outputs.

Trust-weighted BFT inverts this. Voting power comes from demonstrated skill quality:

```
consensus_weight = min(trust_score, MAX_WEIGHT_FRACTION * total_network_trust)
```

The weight cap (`MAX_VALIDATOR_WEIGHT_FRACTION = 0.10`) ensures no single validator can hold more than 10% of total voting power, regardless of their trust score. This prevents even the most trusted node from unilaterally controlling consensus.

### Asymmetric Trust Dynamics

Trust decays faster than it recovers. This is intentional.

In the ALG framework used by Velma's governance layer, the decay gain is 7.5x -- trust drops 7.5 times faster on failure than it recovers on success. SkillChain uses a network-tuned decay gain of 5.0, but the principle is identical: the cost of misbehavior must always exceed the benefit.

A node that publishes one bad skill loses more trust than it gained from publishing five good ones. This asymmetry makes Sybil attacks economically irrational -- the attacker must maintain a sustained history of genuine quality contributions to accumulate enough trust to have any influence, and a single detected attack destroys that investment.

### Validator Eligibility

Not every node can validate. Eligibility requires:

| Requirement | Value | Rationale |
|---|---|---|
| Minimum trust score | >= 0.40 (participant phase) | Proven baseline competence |
| Minimum epochs active | >= 3 epochs (~5 hours) | Cannot rush into validation |
| Minimum skills contributed | >= 5 (published + validated) | Must have skin in the game |

### Trust Phase Classification

Every node is classified into one of four phases based on its trust score:

| Phase | Threshold | Capabilities |
|---|---|---|
| Validator | >= 0.65 | Full validation rights, block proposal, governance voting |
| Participant | >= 0.40 | Publish skills, discover, import, stake |
| Probation | >= 0.20 | Read-only access, limited discovery |
| Excluded | < 0.20 | No network participation |

Phase transitions are smooth -- there are no hard jumps at boundaries. The ALG framework uses linear interpolation within phases to prevent discontinuities.

### Sybil Resistance

Trust in SkillChain is:

- **Local** -- Your trust score is specific to your node's attestation history. Creating a new node starts at 0.5 (neutral), not 1.0.
- **Transitive** -- Attestations from high-trust nodes carry more weight than attestations from low-trust nodes. An attacker's Sybil nodes, all starting at neutral trust, cannot meaningfully attest to each other.
- **Non-self-assertable** -- You cannot raise your own trust. Only attestations from other nodes count.
- **Temporally constrained** -- Attestation cooldowns (1 epoch minimum between attestations from the same pair) and minimum temporal spread (300s) prevent rapid-fire trust inflation.

---

## 4. Skill Lifecycle

### Creation: The .skillpack Format

A skill is packaged as a `.skillpack` -- a structured archive containing:

```
my-skill.skillpack/
  manifest.json      # Name, version, domain, tags, price, license, author
  skill.md           # The skill definition (markdown with structured steps)
  tests/             # Test cases with expected inputs and outputs
  provenance.json    # SHA-256 hash chain linking to creation history
  README.md          # Human-readable documentation (optional)
```

The format is deliberately agent-agnostic. The skill definition is markdown -- the most universal format for LLM consumption. The manifest is JSON. The tests are input/output pairs. No part of the `.skillpack` format is tied to any specific AI vendor, framework, or model architecture. Any system that can read markdown and JSON can consume a `.skillpack`.

The manifest declares the skill's metadata:

```json
{
  "name": "sec-filing-parser",
  "version": "1.0.0",
  "domain": "financial",
  "description": "Parse SEC EDGAR filings and extract key financial metrics",
  "tags": ["sec", "edgar", "10-k", "financial-analysis"],
  "price": 100,
  "license": "MIT",
  "author_node_id": "node_abc123..."
}
```

### Validation: Shadow Protocol

When a skill is published, it enters a validation queue. Validators run the skill through 5 independent shadow executions, comparing outputs against expected results.

Similarity scoring uses a weighted combination:
- **60% Jaccard similarity** -- Set overlap of significant tokens
- **40% Bigram similarity** -- Sequence-aware comparison of token pairs

A shadow run passes if the combined similarity exceeds the graduation threshold (0.75). A skill passes validation if 75% or more of shadow runs pass (i.e., at least 4 out of 5).

Validators submit attestations on-chain recording the outcome. These attestations directly feed the trust scores of both the skill creator and the validator.

### Graduation: From Markdown to Executable Code

Skills begin as markdown descriptions with structured steps. When a skill demonstrates sustained quality -- 3+ recognized patterns with 75% success rate -- it becomes a candidate for code generation.

The graduation gate requires:
- Trust score >= 0.70
- System phase == NOMINAL (no active governance constraints)
- Success rate >= 80% (stricter than the 75% validation threshold)
- Minimum 5 executions

On graduation, an LLM generates a standalone Python module from the skill's steps. This module is deployed to disk with a SHA-256 audit trail entry. The graduated skill no longer requires LLM interpretation to execute -- it runs as native Python.

### Composition: Automatic Chain Discovery

The SkillCompositionEngine discovers skills that can be chained together by matching outputs of one skill to inputs of another. Chains are limited to a maximum depth of 4 to prevent fragile deep pipelines.

Composition criteria:
- 75% tag overlap between connected skills
- 5+ successful executions of each component
- Output schema of skill N compatible with input schema of skill N+1

### Execution Standard: Skills Are Procedures, Not Documents

Every skill on SkillChain must follow a defined execution pattern. This is what differentiates SkillChain skills from blog posts, documentation, or unstructured knowledge dumps. A skill defines HOW it executes -- with phases, quality gates, and exit criteria -- not just what it knows.

Two execution patterns are approved:

**ORPA Loop (Observe-Reason-Plan-Act)** -- Best for reactive skills like code review, debugging, and monitoring. Each cycle gathers data (Observe), interprets it (Reason), formulates a response (Plan), and executes (Act). The cycle may loop when Act reveals new data. Exit criteria terminate the loop.

**Phase Pipeline** -- Best for generative skills like project scaffolding, API design, and IP analysis. Phases flow sequentially: Initialize, Analyze, Generate, Validate, Deliver. Each phase has entry criteria, defined actions, outputs, and a quality gate that must pass before the next phase begins.

These patterns originate from Velma's cognitive architecture. ORPA is derived from the task decomposition system that has executed tens of thousands of tasks in production. Phase Pipeline is derived from ALG's governance pipeline (OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, AUDIT).

Every skill must declare its execution pattern in `manifest.json` (via the `execution_pattern` field) and in `skill.md` (with full phase definitions). Required elements include: inputs, outputs, phase/cycle definitions with entry/exit criteria, quality gates between phases, error handling per phase, and concrete exit criteria for when the skill is done.

Shadow validation tests the EXECUTION of a skill, not just its knowledge content. When validators run 5 independent shadow executions, they test whether the skill's phases produce consistent, correct outputs. Skills without a defined execution pattern produce non-deterministic outputs -- some runs skip steps, some include extra analysis, some terminate early. This inconsistency causes shadow validation failures. The execution standard makes skills reliable enough to be tradeable assets.

The full Skill Execution Standard is published as a companion document: [Skill Execution Standard v1.0](skill-execution-standard.md).

### Health Monitoring

Published skills are continuously monitored. A skill's health score combines:
- **Recency** -- When was it last successfully used?
- **30-day success rate** -- What fraction of recent executions succeeded?
- **Uniqueness** -- How much does it overlap with other skills?

Skills that drop below 0.30 health are quarantined -- they remain in the registry but are flagged and excluded from default discovery results. Quarantined skills can recover if subsequent validations improve their metrics.

---

## 5. Token Economics

### The TRUST Token

**SkillChain Trust Token (TRUST)** is an ERC-20 token on Base with the following properties:

- **Hard cap:** 1,000,000,000 (1 billion) tokens
- **Decimals:** 18
- **Deflationary:** 5% of every transaction is burned
- **No public sale:** Tokens are earned through contribution, never purchased at launch

### Distribution

| Allocation | Percentage | Vesting | Purpose |
|---|---|---|---|
| Validator Rewards | 30% | Emitted over 10 years | Incentivize validation work |
| DAO Treasury | 20% | Immediate | Fund development and grants |
| Wayfinder Trust | 15% | 4-year linear, 1-year cliff | Core team alignment |
| Skill Creators | 10% | Per-transaction | Reward skill publishing |
| Ecosystem Grants | 10% | DAO-controlled | Fund integrations and research |
| Partners | 5% | 2-year linear | Strategic partnerships |
| Community Airdrop | 5% | Immediate | Bootstrap initial adoption |
| Liquidity | 5% | Locked 1 year | DEX liquidity provision |

### Fee Split

Every skill purchase distributes the price as follows:

| Recipient | Share | Mechanism |
|---|---|---|
| Skill Creator | 70% | Accrued as claimable royalties |
| Validators | 15% | Distributed to validators who attested the skill |
| Treasury | 10% | Sent to DAO treasury |
| Burn | 5% | Permanently destroyed |

The 5% burn creates sustained deflationary pressure. As network volume grows, the circulating supply shrinks.

### Subscription Tiers

| Tier | Monthly Cost | Daily Skill Limit | Target User |
|---|---|---|---|
| Explorer | Free | 5 | Individuals exploring the network |
| Builder | 50 TRUST | 50 | Developers integrating skills |
| Professional | 200 TRUST | 200 | Teams running production workloads |
| Enterprise | Custom | Unlimited | Organizations with high-volume needs |

### Governance Voting

Voting power in the GovernanceDAO uses anti-plutocratic weighting:

```
voting_power = sqrt(stake) * trust^2
```

This formula means:
- Doubling your stake only increases voting power by ~41% (square root dampening)
- Trust has quadratic impact -- a node with 0.9 trust has 3.24x the voting power of a node with 0.5 trust at the same stake level
- You cannot buy your way to governance control without also demonstrating sustained competence

---

## 6. The Autonomy Thesis

SkillChain is not just a marketplace. It is an autonomy engine.

### The LLM Independence Path

Today, most AI skills require an LLM to interpret and execute them. The skill says "parse the filing" and the LLM figures out how. This works, but it creates a permanent dependency on the LLM vendor.

SkillChain's graduation pipeline eliminates this dependency skill by skill:

1. **Pattern recognition** -- The network observes that a skill has been executed 3+ times with consistent success
2. **Code generation** -- An LLM generates a standalone Python module that replicates the skill's behavior
3. **Shadow validation** -- The generated code is validated against the original skill's outputs
4. **Deployment** -- The executable module replaces the LLM-interpreted skill

Each graduation removes one LLM dependency. Over time, the fraction of skills requiring LLM interpretation shrinks.

### Network-Scale Learning

On a single node, this process is limited by that node's experience. SkillChain makes it network-scale:

- Node A learns to parse SEC filings and publishes the skill
- Node B validates and imports it, then discovers an improvement
- Node B publishes the improved version, creating a lineage chain
- Node C composes the parsing skill with a summarization skill
- The composed skill graduates to executable code

Every node's experience enriches the entire network. Skills improve through competitive validation rather than centralized curation.

### The Crossover Point

There exists a point where enough skills have graduated to executable code that the network can operate without any single AI vendor. We call this the crossover point.

This is not speculative. Velma, the cognitive OS that originated the ALG framework, demonstrated single-node autonomy growth from 0.0 to 0.34 in three weeks of operation. Its learning loop extracted 268+ skills from raw experience, graduated a subset to executable Python, and progressively reduced its reliance on external LLM calls.

SkillChain extends this from one node to thousands.

---

## 7. Smart Contract Architecture

### Contract Suite

| Contract | Purpose | Key Functions |
|---|---|---|
| SkillToken | ERC-20 TRUST token | `mint`, `burn`, `claimVested` |
| NodeRegistry | Node identity and staking | `register`, `stake`, `unstake` |
| SkillRegistry | Skill metadata and ownership | `registerSkill`, `isActive`, `priceOf`, `creatorOf` |
| TrustOracle | Off-chain trust bridge | `updateTrust`, `getTrust` |
| ValidationRegistry | Validation records | `recordValidation`, `getValidations` |
| Marketplace | Purchases and royalties | `purchaseSkill`, `claimRoyalties`, `subscribe` |
| Staking | Tier-based staking | `stake`, `unstake`, `getTier` |
| GovernanceDAO | On-chain governance | `propose`, `vote`, `execute` |

### Deployment: Base L2

Base was selected for:
- **Low fees** -- Skill purchases should cost cents in gas, not dollars
- **EVM compatibility** -- Full Solidity ecosystem, no custom VM
- **Ethereum security** -- Inherits Ethereum's validator set for settlement finality
- **Ecosystem** -- Access to Uniswap, Aave, and other DeFi primitives for TRUST token liquidity

### Upgradeability

All contracts use the UUPS (Universal Upgradeable Proxy Standard) pattern. The upgrade authority is held by the GovernanceDAO after the initial deployment phase, ensuring no single party can unilaterally modify contract logic.

### Trust Math: Intentionally Off-Chain

The ALG trust computation is kept off-chain for three reasons:

1. **Patent protection** -- The exponential decay + EMA algorithm is part of Patent Family B. On-chain deployment would expose the implementation.
2. **Computational cost** -- EMA updates across thousands of peers per epoch would be prohibitively expensive on-chain.
3. **Evolvability** -- Trust parameters can be tuned without contract migrations. The TrustOracle bridges off-chain scores to on-chain access control.

---

## 8. Competitive Landscape

### The Walled Garden Problem

Anthropic, OpenAI, and Google are each building skill and tool ecosystems for their respective platforms. Each will likely be high-quality within its own walls. But each is fundamentally a walled garden:

- **Anthropic** is building a tool/skill ecosystem for Claude. Claude-only. Centrally curated.
- **OpenAI** has GPTs, actions, and a plugin store. GPT-only. Marketplace controlled by OpenAI.
- **Google** has Gemini extensions and actions. Gemini-only. Google decides what ships.
- **Cursor / Windsurf / Cline** have rules and tool systems. Editor-locked. No cross-tool portability.

A skill built for one platform is worthless on the others. Developers must choose a vendor and accept the lock-in, or maintain separate implementations for each. If the vendor changes direction, deprecates a feature, or decides your use case violates their terms, your skills disappear.

SkillChain is not a marketplace for any single AI platform. It is the cross-agent skill standard -- the interoperability layer that sits beneath all of them. The `.skillpack` format is agent-agnostic by design: markdown procedures, JSON manifests, and input/output test cases. No vendor-specific constructs. Platform-specific adapters translate the universal format into each agent's native representation:

| Platform | Adapter | Install Location | Status |
|---|---|---|---|
| Claude Code | `claude` | `~/.claude/skills/` | Shipped (Q2 2026) |
| GPT / ChatGPT | `gpt` | Custom GPT instructions | Q4 2026 |
| Gemini | `gemini` | System instructions | Q4 2026 |
| Cursor | `cursor` | `.cursor/rules/` | Q4 2026 |
| LangChain / CrewAI / AutoGen | `langchain` | Tool definitions | Q4 2026 |
| Local models (LLaMA, Mistral) | `local` | System prompt injection | Q4 2026 |

Publish once, works everywhere. SkillChain is model-agnostic, permissionless, and user-owned.

### vs. Bittensor (TAO)

Bittensor is the closest analog in the decentralized AI space. Key differences:

| Dimension | Bittensor | SkillChain |
|---|---|---|
| Unit of value | Compute (inference) | Skills (procedures) |
| Consensus | Stake-weighted (capital) | Trust-weighted (competence) |
| Validation | Subjective scoring by validators | Deterministic shadow testing |
| Sybil resistance | Economic (stake slashing) | Behavioral (trust decay) |
| Granularity | Subnet-level | Individual skill-level |

Bittensor answers "who can run inference?" SkillChain answers "who has reliable skills?"

### vs. Ocean Protocol

Ocean Protocol creates markets for data. SkillChain creates markets for procedures. Data is passive -- it requires an interpreter. Skills are active -- they encode how to do things. Ocean uses curation markets for quality. SkillChain uses shadow testing.

### vs. Filecoin

Filecoin proves that files are stored. SkillChain proves that skills work. Storage proofs verify existence; shadow validation verifies quality. These are fundamentally different assurances.

### Defensibility

SkillChain's moat has three components:

1. **Patent moat** -- Two patent families (ALG + NeuroPRIN) protect the core governance and learning algorithms. Competitors cannot legally replicate the trust-as-consensus mechanism.
2. **Network effects** -- Every skill published, validated, and composed increases the value of the network for all participants. This is a classic two-sided marketplace flywheel.
3. **Earned reputation** -- Trust scores are non-portable. A validator's reputation on SkillChain cannot be transferred to a competitor network. Switching costs increase with tenure.

---

## 9. Roadmap

### Phase 1: Foundation (Q2 2026)
- Deploy contracts to Base Sepolia testnet
- Launch testnet faucet for TRUST tokens
- Internal validation of contract security

### Phase 2: SDK Launch + Claude Adapter (Q2 2026)
- Release `skillchain` Python SDK on PyPI
- CLI: `init`, `publish`, `discover`, `import`, `validate`, `stake`, `status`, `trust`
- Claude Code adapter shipped (automatic skill publishing from graduated skills)
- Agent selection during `skillchain init` (Claude default, others as they ship)
- First 100 skills from Velma's skill library

### Phase 3: Token Launch (Q3 2026)
- Deploy contracts to Base mainnet
- TRUST token generation event
- DEX liquidity provision (Uniswap V3 on Base)
- Marketplace goes live with real transactions

### Phase 4: Graduation Pipeline (Q3 2026)
- On-network skill graduation (markdown to executable code)
- Composition engine (automatic chain discovery)
- Health monitoring and quarantine system

### Phase 5: Cross-Agent Adapters (Q4 2026)
- GPT adapter (import SkillChain skills as GPT custom instructions / actions)
- Gemini adapter (system instructions format)
- Cursor / Windsurf adapter (rules directory format)
- Open-source model adapter (LLaMA, Mistral -- system prompt injection)
- Agent framework adapters (LangChain, CrewAI, AutoGen)

### Phase 6: Sovereign Chain (2027)
- Migrate from Base L2 to a sovereign chain built on Cosmos SDK
- ALG trust computation as native consensus mechanism
- Cross-chain bridge for TRUST token
- Full decentralization of governance

---

## 10. Team & IP

### The Wayfinder Trust

SkillChain is developed by The Wayfinder Trust, the organization behind the Velma cognitive OS ecosystem.

### Intellectual Property

**Patent Family A: NeuroPRIN**
Neurocognitive Processing and Recursive Intelligence Network. Covers the architecture of self-improving cognitive systems, including memory consolidation, skill extraction, and experience replay.

**Patent Family B: ALG (Assured Learning Governor)**
Runtime governance of learning and adaptive systems. Covers the trust computation framework (exponential decay + EMA), phase classification, authority modulation, and the six-stage governance pipeline (OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, AUDIT).

### Origin

SkillChain's protocols are not theoretical. They were extracted from Velma, a 385,000+ line-of-code cognitive operating system that has been running in production since late 2024. The trust computation, skill graduation pipeline, shadow validation protocol, and composition engine all originate from Velma's working implementation.

---

## Appendix A: ALG Mathematical Specification

### Trust Computation

```
Input:  divergence d in [0, 1], previous EMA value e_prev
Params: DECAY_GAIN = 5.0, EMA_ALPHA = 0.15

raw_trust = exp(-DECAY_GAIN * d)
smoothed  = EMA_ALPHA * raw_trust + (1 - EMA_ALPHA) * e_prev

Output: smoothed (clamped to [0, 1])
```

### Web of Trust Weighting

When attester A submits an attestation about subject S:

```
attester_trust = get_trust(A)
weighted_raw   = attester_trust * raw_trust + (1 - attester_trust) * 0.5

EMA update uses weighted_raw instead of raw_trust
```

Attestations from untrusted nodes are dampened toward 0.5 (neutral).

### Consensus Weight

```
weight = min(trust_score, MAX_WEIGHT_FRACTION * total_network_trust)

where MAX_WEIGHT_FRACTION = 0.10
      total_network_trust = sum of all participant-phase-or-higher trust scores
```

### Divergence from Shadow Results

```
divergence = 1.0 - mean(shadow_similarity_scores)
similarity = JACCARD_WEIGHT * jaccard(A, B) + BIGRAM_WEIGHT * bigram_sim(A, B)

where JACCARD_WEIGHT = 0.6, BIGRAM_WEIGHT = 0.4
```

## Appendix B: Token Distribution

```
Total Supply: 1,000,000,000 TRUST

Validator Rewards  ████████████████████████████████  300,000,000  (30%)
DAO Treasury       █████████████████████             200,000,000  (20%)
Wayfinder Trust    ███████████████                   150,000,000  (15%)
Skill Creators     ██████████                        100,000,000  (10%)
Ecosystem Grants   ██████████                        100,000,000  (10%)
Partners           █████                              50,000,000   (5%)
Community Airdrop  █████                              50,000,000   (5%)
Liquidity          █████                              50,000,000   (5%)
```

## Appendix C: Contract Addresses (Base Sepolia Testnet)

*To be published upon Phase 1 deployment.*

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
