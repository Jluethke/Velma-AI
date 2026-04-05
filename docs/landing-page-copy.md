# SkillChain Landing Page Copy

---

## Hero Section

### Headline
**AI Skills That Work With Any Agent**

### Subheadline
The cross-agent skill standard. Publish once, works everywhere -- Claude, GPT, Gemini, Cursor, or your own models. Validated by shadow testing, owned by creators, trusted by mathematics. Not a Claude marketplace. The interoperability layer.

### CTA
```
pip install skillchain
```

### Secondary CTA
Read the whitepaper | View on GitHub

---

## Value Propositions (3 Cards)

### Publish
**Earn from your AI skills.**

Package any reusable AI procedure as a `.skillpack` -- parsing, analysis, generation, automation. Set your price. Earn 70% of every purchase, paid in TRUST tokens. Your skill, your revenue, no platform cut beyond protocol fees.

### Discover
**Find validated skills instantly.**

Search by domain, tags, or free text. Every result has been shadow-tested against real outputs -- not reviewed by strangers on the internet. Filter by trust score, success rate, and validation count. Import with one command.

### Trust
**Quality proven by testing, not reviews.**

Every published skill runs through 5 independent shadow validations. Validators compare outputs against known-good results using Jaccard + bigram similarity scoring. Skills that pass earn trust. Skills that fail get quarantined. No star ratings. No fake reviews. Math.

---

## How It Works (4 Steps)

### 1. Install
```bash
pip install skillchain
skillchain init
```
Generate your node identity, create your config, and register on-chain. One command to join the network.

### 2. Discover
```bash
skillchain discover --domain financial --min-trust 0.6
```
Search thousands of validated skills. Filter by domain, tags, trust score, and success rate. See validation history before you import.

### 3. Import
```bash
skillchain import 42 --target-dir ./skills/
```
Download, validate locally, and install. Skills come with tests, provenance, and a cryptographic audit trail. You know exactly where every skill came from.

### 4. Earn
```bash
skillchain publish ./my-skill/ --price 100 --domain automation
```
Package your skill, set a price, and publish. Validators test it. Buyers pay in TRUST tokens. You earn 70% of every sale. The remaining 30% goes to validators (15%), treasury (10%), and is burned (5%).

---

## For Creators

### Your skills have value. Capture it.

You have built AI workflows that save hours of work. Right now, they live in a local directory or a private repo. Nobody benefits except you.

With SkillChain:

- **Publish once, earn from every AI platform.** Wrap your skill as a `.skillpack` with manifest, tests, and provenance. Publish it to the network. Platform adapters deliver it to Claude, GPT, Gemini, Cursor, and local models. Every purchase from any platform sends 70% of the price directly to your wallet.

- **Provenance is permanent.** Every skill is hash-chained to its creation history. Forks and improvements link back to the original. Your contribution is recorded on-chain.

- **Reputation compounds.** Your trust score grows with every successful validation. Higher trust means your skills rank higher in discovery, and you become eligible for validator rewards.

- **No gatekeepers.** There is no review board. There is no approval process. If your skill passes shadow validation, it ships. Quality is enforced by math, not by committees.

---

## For Validators

### Earn by proving quality.

Validators are the backbone of SkillChain. You run shadow tests on published skills, submit attestations, and earn rewards for every validation.

**How validation works:**

1. A new skill enters the validation queue
2. You run `skillchain validate <skill_id>`
3. The SDK executes 5 shadow runs, comparing outputs to expected results
4. Results are scored (60% Jaccard + 40% bigram similarity)
5. Your attestation is recorded on-chain
6. You earn 15% of every future purchase of skills you validated

**Eligibility requirements:**
- Active for 3+ epochs (~5 hours of network participation)
- Published or validated 5+ skills
- Trust score >= 0.40 (participant phase)

**Earning potential scales with trust.** Validators with higher trust scores receive more weight in consensus and are selected more frequently as block proposers. Your competence directly determines your earning power -- not your wallet size.

---

## Token Economics

### TRUST -- The SkillChain Token

| Property | Value |
|---|---|
| Name | SkillChain Trust Token |
| Symbol | TRUST |
| Supply | 1,000,000,000 (hard cap) |
| Chain | Base (Ethereum L2) |
| Deflationary | 5% burned on every transaction |

### Where tokens go

**70%** to skill creators. **15%** to validators. **10%** to the DAO treasury. **5%** burned forever.

No public sale. Tokens are earned through contribution -- publishing skills, validating quality, and participating in governance. The only way to get TRUST is to create value.

### Subscription tiers

| Tier | Price | Daily Skills |
|---|---|---|
| Explorer | Free | 5 |
| Builder | 50 TRUST/mo | 50 |
| Professional | 200 TRUST/mo | 200 |
| Enterprise | Custom | Unlimited |

---

## Earn by Living

### The Life Protocol

**Not mining. Not staking. Living.**

TRUST tokens are not just for AI skills. The Life Protocol rewards real human contribution -- verified by the same trust-weighted attestation system that validates skills on SkillChain.

| Category | What You Do | What You Earn |
|---|---|---|
| **Move** | Exercise, walk, stay active | 0.001-0.01 TRUST per activity |
| **Learn** | Complete courses, earn certifications, build new skills | 0.1-1.0 TRUST per completion |
| **Build** | Ship code, create content, build things | 0.5-5.0 TRUST per verified build |
| **Teach** | Mentor, tutor, create educational content | 1.0-10.0 TRUST per session |
| **Serve** | Volunteer, organize, contribute to open source | 1.0-10.0 TRUST per contribution |
| **Produce** | Grow food, generate energy, build infrastructure | TRUST + GC (both tokens) |

### How it works

1. **Do something real.** Walk 10,000 steps. Finish a course. Ship a pull request. Teach someone a new skill. Volunteer at a community garden.
2. **Capture proof.** Your phone detects exercise automatically. Git commits are verified via webhook. Teaching is attested by your students.
3. **Peers attest.** Trusted network participants verify your proof -- the same trust-weighted attestation used for AI skill validation.
4. **Earn TRUST.** Tokens are minted directly to your wallet. No middleman. No approval board.

**Streak bonuses** reward consistency: 7 consecutive days = 1.1x, 30 days = 1.3x, 90 days = 1.5x. **Diversity bonuses** reward being well-rounded: activity across 3+ categories in a day = 1.2x multiplier.

The more you live, the more you earn, the more you can do.

```
Coming Q3 2026
```

---

## FAQ

### What is a skill?

A skill is a reusable AI procedure with a defined execution pattern -- not a document, not a knowledge dump, but a structured procedure with phases, quality gates, and exit criteria. Every skill follows one of two approved execution patterns: **ORPA Loop** (Observe-Reason-Plan-Act) for reactive tasks like code review and debugging, or **Phase Pipeline** for generative tasks like project scaffolding and API design. Each phase defines what to do, what it produces, and how to validate the output before proceeding. This structure is what makes skills reliable enough to be shadow-tested and traded. Skills are packaged as `.skillpack` bundles containing the procedure, test cases, manifest, and cryptographic provenance.

### How is quality enforced?

Shadow validation. Every published skill is tested by independent validators who run it 5 times against known-good outputs. Similarity is scored using a weighted combination of Jaccard (60%) and bigram (40%) metrics. Skills must achieve 75% match rate across shadow runs to pass. There are no star ratings, no reviews, no subjective judgments. Either the skill produces correct outputs or it does not.

### What makes this different from an app store?

Three things. First, quality is verified by testing, not reviews. Second, skills are owned by their creators and stored on IPFS -- they cannot be removed by a platform decision. Third, trust is computed mathematically from validation outcomes, not from download counts or user ratings. The network rewards competence, not popularity.

### Which AI models are supported?

All of them. SkillChain is not a Claude marketplace -- it is the cross-agent skill standard. The `.skillpack` format is agent-agnostic: markdown procedures, JSON manifests, and input/output test cases with no vendor-specific constructs. Platform-specific adapters translate each `.skillpack` into the native format for each agent:

| Platform | Install Target | Status |
|---|---|---|
| Claude Code | `~/.claude/skills/` | Shipped (Q2 2026) |
| GPT / ChatGPT | Custom GPT instructions | Q4 2026 |
| Gemini | System instructions | Q4 2026 |
| Cursor / Windsurf | `.cursor/rules/` | Q4 2026 |
| LangChain / CrewAI | Tool definitions | Q4 2026 |
| Local models (LLaMA, Mistral) | System prompt | Q4 2026 |

A skill published from a Claude-based agent can be imported and used by a GPT-based agent, a Gemini agent, a Cursor user, or any open-source model. Publish once, works everywhere.

### How do I earn TRUST tokens?

Three ways: publish skills that others purchase (earn 70% of price), validate skills (earn 15% of purchase price), or contribute to governance and ecosystem development (grants from DAO treasury). There is no public sale and no way to buy tokens at launch. You earn them.

### Is this another crypto project?

SkillChain uses blockchain for what blockchain is good at: ownership, payments, and governance that no single party controls. The token economics are designed to align incentives around quality, not speculation. The 5% burn creates deflationary pressure. The anti-plutocratic voting formula (`sqrt(stake) * trust^2`) prevents whale capture. And the core innovation -- trust-weighted consensus -- is a patented algorithm backed by a working production system, not a whitepaper promise.

### What is ALG?

The Assured Learning Governor (ALG) is a patented governance framework developed by The Wayfinder Trust. It computes trust using exponential decay with EMA smoothing: trust drops fast on failure and recovers slowly through consistent quality. ALG was originally built for Velma, a 385K+ line cognitive OS, and has been running in production since late 2024. SkillChain adapts ALG as its consensus weight mechanism.

### When does it launch?

Testnet (Base Sepolia) and SDK in Q2 2026. Mainnet token launch and marketplace in Q3 2026. Cross-agent adapters in Q4 2026. See the whitepaper for the full roadmap.

---

## Footer CTA

### Ready to build?

```bash
pip install skillchain
skillchain init
```

Read the [whitepaper](whitepaper.md) | Follow the [getting started guide](getting-started.md) | Join the community

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
