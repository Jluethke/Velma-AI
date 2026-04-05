# Prior Art Report — Family F: SkillChain (Decentralized Skill Economy)
Date: 2026-03-31

## Search Queries Used

1. "trust weighted consensus" AND "blockchain" AND "skill"
2. "shadow validation" AND "AI skill" AND "marketplace"
3. "decentralized skill marketplace" AND "validation protocol"
4. "trust based BFT" AND "competence" AND "consensus"
5. "AI agent skill" AND "blockchain" AND "validation"
6. "skill verification" AND "shadow testing" AND "decentralized"
7. "proof of competence" AND "consensus mechanism"
8. Bittensor TAO decentralized AI skill validation consensus mechanism
9. SingularityNET AGIX decentralized AI marketplace skill verification
10. Ocean Protocol decentralized data marketplace blockchain validation
11. DWBFT decentralized weighted Byzantine fault tolerance trust reputation consensus protocol
12. "skill-based reputation" blockchain "domain competence" OR "domain expertise" validation decentralized
13. Google Patents: "trust weighted" "Byzantine fault tolerant" consensus skill validation blockchain
14. "web of trust" attestation blockchain trust score weighted peer reputation decentralized
15. "sybil resistance" blockchain attestation "collusion detection" graph analysis trust
16. "dispute resolution" blockchain arbitrator selection cryptographic deterministic validator
17. EigenTrust reputation system blockchain exponential moving average peer-to-peer
18. "exponential decay" trust score "behavioral divergence" decentralized network reputation
19. on-chain trust oracle smart contract exponential decay reputation blockchain
20. AI agent skill packaging universal format platform adapter interoperability blockchain
21. Anthropic "agent skills" standard SKILL.md format interoperability 2025
22. Bittensor patent filing intellectual property blockchain AI consensus

---

## Closest Prior Art (ranked by relevance)

### 1. Bittensor / Yuma Consensus (TAO)
- **Source:** Bittensor whitepaper; docs.learnbittensor.org; multiple analyses
- **Date:** 2021-present (active development)
- **What it covers:**
  - Stake-weighted consensus (Yuma Consensus) where validators score miners
  - Stake-weighted median benchmark with outlier clipping
  - Exponentially smoothed bonds for validator rewards
  - Subnet structure where different AI tasks are segregated
  - Incentive alignment through token emissions (41% miners / 41% validators / 18% subnet creator)
  - Validators query miners, evaluate outputs, rank performance
  - Collusion resistance up to 50% validator stake
- **What it DOESN'T cover:**
  - **No trust-derived voting power from behavioral divergence** — Bittensor uses stake (TAO tokens) for voting weight, not trust computed from exponential decay of behavioral divergence
  - **No shadow execution validation** — Bittensor validators directly query miners and compare outputs, not sandboxed shadow execution against reference outputs
  - **No domain competence gating** — Any staked validator can validate any subnet (within registration), no requirement for demonstrated domain expertise
  - **No web-of-trust weighting** — Trust is stake-based, not computed from peer attestations weighted by attester trust
  - **No universal skill packaging format** with platform adapters for heterogeneous agent platforms
  - **No on-chain trust oracle** with fixed-point exponential decay computation
  - **No dispute resolution via deterministic cryptographic arbitrator selection**
  - **No skill graduation pipeline** (minimum validation proofs from distinct validators)
  - **No Sybil resistance via attestation cooldowns, age-based decay, temporal clustering detection, or collusion ring graph analysis**
- **Claims affected:** Claims 1, 2, 3 (partially — consensus mechanism concept), Claim 8 (weight capping concept)
- **Relevance:** HIGH — Closest overall prior art. Both are trust/stake-weighted consensus for AI validation. Key differentiator: Bittensor is stake-weighted (economic), SkillChain is trust-weighted (behavioral). Bittensor validates model outputs via direct query; SkillChain validates skills via sandboxed shadow execution with domain competence gating.

### 2. DWBFT: Decentralized Weighted Byzantine Fault Tolerant Protocol
- **Source:** IEEE Xplore (9838903), Ma & Zhang, 2022
- **Date:** 2022
- **What it covers:**
  - Nodes assign weights to each other based on decentralized trust relationships
  - Weights adopted for consensus decision-making
  - Safety when Byzantine weight < 1/5 total weight
  - ~13,000 TPS under 32 nodes
- **What it DOESN'T cover:**
  - No skill validation or AI-specific functionality
  - No exponential decay trust computation from behavioral divergence
  - No shadow execution validation
  - No domain competence gating
  - No web-of-trust with attester weighting
  - No skill packaging or platform adapters
  - No dispute resolution mechanism
  - Weight assignment is manual/static, not computed from validation performance
- **Claims affected:** Claims 1(b), 2(a-f) (consensus mechanism with trust-derived weights)
- **Relevance:** HIGH — Directly addresses trust-weighted BFT consensus. Key differentiator: DWBFT uses manually assigned weights; SkillChain computes trust from exponential decay of behavioral divergence observed during skill validation with web-of-trust weighting. DWBFT is a general-purpose consensus; SkillChain is purpose-built for skill validation.

### 3. WBFT and Reputation-Based PBFT Variants
- **Source:** ScienceDirect (S1319157822002919); PMC (9371408); Nature (s41598-024-82579-1)
- **Date:** 2022-2024
- **What they cover:**
  - Weighted Byzantine fault tolerance with dynamic weighting mechanisms
  - Reputation-based PBFT (T-PBFT) using EigenTrust for node reputation
  - CRPBFT with comprehensive reputation used for consensus node selection
  - Hierarchical BFT based on node reputation
- **What they DON'T cover:**
  - No skill-specific validation or AI domain competence
  - No shadow execution against reference outputs
  - No exponential decay of behavioral divergence specifically from validation
  - No web-of-trust with attester weighting
  - No skill packaging, universal format, or platform adapters
  - No dispute resolution via deterministic arbitrator selection
  - No skill graduation pipeline
- **Claims affected:** Claims 1(b), 2(a-f), 7 (trust phases concept)
- **Relevance:** HIGH — Reputation-weighted BFT is well-established. Key differentiator: These are general consensus protocols; SkillChain's trust is computed specifically from skill validation divergence with domain-competence-gated shadow execution.

### 4. EigenTrust Algorithm
- **Source:** Stanford NLP (Kamvar, Schlosser, Garcia-Molina), ACM WWW 2003
- **Date:** 2003
- **What it covers:**
  - Global trust values for P2P peers based on transaction history
  - Transitive trust: if i trusts j, i also trusts peers trusted by j
  - Local trust values computed from satisfactory/unsatisfactory interactions
  - Power iteration for global trust computation
- **What it DOESN'T cover:**
  - No exponential decay function for behavioral divergence
  - No EMA smoothing of trust
  - No web-of-trust weighting where attestation is dampened by attester trust toward neutral
  - No BFT consensus integration
  - No skill validation, shadow execution, or domain competence gating
  - No blockchain/on-chain implementation
- **Claims affected:** Claims 1(a), 4, 5 (trust computation concept)
- **Relevance:** MEDIUM — Foundational P2P trust algorithm. SkillChain's trust model is distinct: exponential decay of divergence (not eigenvector iteration), EMA smoothing, web-of-trust weighting with neutral dampening, and attestation cooldowns.

### 5. Dynamic Trust Decay for Blockchain Oracles (AEWMA)
- **Source:** Research Square (rs-9152119/v1)
- **Date:** 2025
- **What it covers:**
  - Adaptive Exponential Weighted Moving Average (AEWMA) for oracle reputation
  - Dynamic trust decay factor based on network volatility
  - Addresses reputation inertia problem
  - Sleeper cell detection during stable conditions
- **What it DOESN'T cover:**
  - Oracle-specific, not skill validation
  - No behavioral divergence from shadow execution
  - No BFT consensus integration
  - No domain competence gating
  - No web-of-trust with attester weighting
  - No skill packaging or platform adapters
  - Different decay model (AEWMA vs. exponential decay of divergence with EMA)
- **Claims affected:** Claims 1(a), 4 (trust decay concept)
- **Relevance:** MEDIUM — Uses exponential decay in trust computation for blockchain, but in oracle context with different mathematical formulation and no skill validation.

### 6. Kleros Decentralized Dispute Resolution
- **Source:** kleros.io; multiple academic analyses
- **Date:** 2017-present
- **What it covers:**
  - Decentralized arbitration using random juror selection
  - PNK token staking for juror eligibility (higher stake = higher selection probability)
  - Game-theoretic incentives: coherent jurors rewarded, incoherent jurors lose stake
  - Fully automated on-chain dispute process
- **What it DOESN'T cover:**
  - Stake-based selection, not trust-based
  - No deterministic cryptographic hash-based arbitrator selection excluding specific parties
  - No domain competence requirement for arbitrators
  - Not integrated with skill validation or BFT consensus
  - No trust computation from behavioral divergence
- **Claims affected:** Claim 12 (dispute resolution concept)
- **Relevance:** MEDIUM — Established on-chain dispute resolution. Key differentiator: Kleros uses staking-weighted random selection; SkillChain uses deterministic cryptographic hash-based selection from validator set excluding disputants, with trust-weighted (not stake-weighted) authority.

### 7. SingularityNET (AGIX / ASI)
- **Source:** singularitynet.io; marketplace.singularitynet.io
- **Date:** 2017-present
- **What it covers:**
  - Decentralized marketplace for AI services
  - AGIX token for transactions, governance
  - Reputation system for service quality identification
  - Testing of services before payment
  - Merger with Fetch.ai and Ocean Protocol into ASI Alliance
- **What it DOESN'T cover:**
  - No BFT consensus with trust-derived voting power
  - No shadow execution validation against reference outputs
  - No domain competence gating for validators
  - No exponential decay trust computation
  - No web-of-trust attestation model
  - No skill packaging format or platform adapters for heterogeneous agents
  - No on-chain trust oracle with fixed-point arithmetic
  - Reputation system details are thin/unspecified
- **Claims affected:** Claims 1, 17, 18 (marketplace concept, platform interoperability)
- **Relevance:** MEDIUM — AI marketplace concept is similar at high level. Key differentiator: SingularityNET is a marketplace for AI services (list, test, pay); SkillChain is a validation and consensus system for skill verification with trust-weighted BFT. SingularityNET has no formal validation protocol.

### 8. Ocean Protocol
- **Source:** oceanprotocol.com; multiple analyses
- **Date:** 2017-present
- **What it covers:**
  - Decentralized data exchange protocol
  - ERC721 data NFTs and ERC20 datatokens
  - Compute-to-Data for private data processing
  - Smart contract infrastructure for transactions
  - Datatrusts for integrity validation
- **What it DOESN'T cover:**
  - Data marketplace, not skill marketplace
  - No BFT consensus with trust-derived voting power
  - No shadow execution validation
  - No domain competence gating
  - No trust computation from behavioral divergence
  - No web-of-trust model
  - No skill packaging or platform adapters
- **Claims affected:** None directly
- **Relevance:** LOW — Data marketplace, different domain. No overlap with skill validation mechanisms.

### 9. Anthropic Agent Skills Standard (SKILL.md)
- **Source:** agentskills.io; Anthropic announcement December 2025
- **Date:** December 2025
- **What it covers:**
  - Universal skill format using SKILL.md files (YAML + Markdown)
  - Progressive disclosure design
  - Cross-platform interoperability (Claude, ChatGPT, Copilot)
  - Directory-based skill packaging
  - Adopted by Microsoft, OpenAI, Atlassian, Figma, GitHub
- **What it DOESN'T cover:**
  - No blockchain or decentralized validation
  - No BFT consensus
  - No trust computation or web-of-trust
  - No shadow execution validation
  - No domain competence gating
  - No on-chain trust oracle
  - No dispute resolution
  - Centralized standard, not decentralized protocol
  - No validation proofs or skill graduation
- **Claims affected:** Claims 17, 18 (skill packaging concept)
- **Relevance:** MEDIUM — Directly addresses skill packaging and cross-platform format. Key differentiator: Anthropic's standard is a specification format; SkillChain's packaging includes executable implementation, test cases, reference outputs, validation proofs, and cryptographic signatures in a self-contained archive for decentralized validation. The standards serve different purposes (agent instruction vs. validated computation).

### 10. Google A2A Protocol and GOAT Universal Adapter
- **Source:** Google Developers Blog; GOAT documentation
- **Date:** 2025-2026
- **What it covers:**
  - A2A: Open protocol for agent collaboration regardless of framework/vendor
  - GOAT: Universal adapter between AI agents and blockchain applications across 30+ chains
  - Standardized agent interoperability
- **What it DOESN'T cover:**
  - No skill validation or trust-weighted consensus
  - No shadow execution or domain competence gating
  - No trust computation from behavioral divergence
  - Communication/interop protocols, not validation protocols
- **Claims affected:** Claims 17, 18 tangentially (platform adapter concept)
- **Relevance:** LOW — Agent interoperability protocols but no validation, trust, or consensus components.

### 11. Blockchain-Based Skill Verification Systems
- **Source:** ResearchGate, SSRN, Atlantis Press (multiple academic papers)
- **Date:** 2023-2024
- **What they cover:**
  - Blockchain for storing and verifying professional/educational credentials
  - Micro-credentials on blockchain for skill attestation
  - Reducing time on competency checks
  - Immutable credential records
- **What they DON'T cover:**
  - Verify human credentials, not AI computational skills
  - No sandboxed shadow execution against reference outputs
  - No BFT consensus with trust-derived voting power
  - No domain competence gating for validators
  - No exponential decay trust computation
  - No web-of-trust attestation model
  - No AI agent skill packaging or platform adapters
- **Claims affected:** None directly (different domain — human credentials vs. AI computational skills)
- **Relevance:** LOW — Blockchain skill verification for humans, not AI agents. Different problem domain.

### 12. Sybil Resistance Mechanisms
- **Source:** Multiple (MDPI, Wikipedia, Cyfrin, Trusta Labs)
- **Date:** Various
- **What they cover:**
  - Social graph defenses (SybilGuard, SybilLimit)
  - Graph mining for Sybil community detection (Louvain, K-Core)
  - Proof-of-personhood approaches
  - Indirect authentication with random hash-based collusion prevention
- **What they DON'T cover:**
  - No specific combination of attestation cooldowns + age-based weight decay + temporal clustering detection + collusion ring detection as unified Sybil defense
  - No integration with skill validation trust computation
  - Most focus on identity verification, not behavioral trust
- **Claims affected:** Claim 16 (Sybil resistance)
- **Relevance:** MEDIUM — Individual Sybil resistance techniques exist; SkillChain's specific four-mechanism combination integrated with skill validation trust is novel.

### 13. PBFT with Facilitating Node Synchronization (US11397725B2)
- **Source:** Google Patents
- **Date:** 2022
- **What it covers:** PBFT consensus with gossip-based communications and digital signatures for synchronization.
- **What it DOESN'T cover:** No trust-derived voting power; no skill validation; standard PBFT augmentation.
- **Claims affected:** Claims 1(b), 2(e-f) tangentially
- **Relevance:** LOW — Standard PBFT enhancement, no trust weighting or skill validation.

### 14. Proof of Intelligence / Proof of Thought Mechanisms
- **Source:** aelf blog; various blockchain projects
- **Date:** 2024-2025
- **What they cover:**
  - PoI: Rewards nodes for performing AI computations (training, inference, optimization)
  - PoT: Consensus for AI agent coordination
  - Dynamic role assignments based on performance quality
- **What they DON'T cover:**
  - No sandboxed shadow execution against reference outputs
  - No multi-metric similarity scoring
  - No domain competence gating
  - No web-of-trust with attester weighting
  - No exponential decay of behavioral divergence
  - No skill packaging format
  - No dispute resolution via cryptographic arbitrator selection
- **Claims affected:** Claims 1, 2 conceptually (AI-performance-based consensus concept)
- **Relevance:** MEDIUM — Shares the concept of competence-based consensus. Key differentiator: PoI/PoT reward computation quality generally; SkillChain validates specific skills through sandboxed shadow execution with multi-metric similarity and domain competence gating.

---

## Novelty Assessment (Claim-by-Claim)

| Claim | Description | Prior Art Risk | Assessment |
|-------|-------------|---------------|------------|
| 1 | System: trust from exp decay of behavioral divergence, trust-weighted BFT, shadow execution validation, skill packaging | MEDIUM | Individual components have analogs but the specific combination is novel. Key novelty: trust from behavioral divergence (not stake), shadow execution validation, domain competence gating, all integrated. |
| 2 | Method: trust-weighted BFT consensus with propose/prevote/precommit phases, cryptographic proposer selection | MEDIUM | BFT phase structure is known (Tendermint); trust-derived voting weight (not stake) with cryptographic proposer selection from trust scores is novel. |
| 3 | CRM: trust maintenance, BFT consensus, shadow validation, dispute resolution | MEDIUM | Combination is novel. |
| 4 | Trust via exponential decay of divergence from shadow execution similarity | LOW | Exponential decay for trust exists; computing divergence from shadow execution similarity scores is novel. |
| 5 | Web-of-trust: interpolation between raw trust and neutral based on attester trust | LOW | Web-of-trust concept exists (PGP); interpolation toward neutral value based on attester trust is a novel formulation. |
| 6 | Attestation cooldown enforcement | LOW | Rate limiting exists; specific cooldown per attester-subject pair for trust attestations is novel. |
| 7 | Trust phase classification (validator/participant/probation/excluded) | LOW | Reputation tiers exist; specific four-phase classification with configurable thresholds tied to validator eligibility is novel in context. |
| 8 | Voting weight cap per validator | LOW | Weight capping exists in various BFT systems. Standard anti-centralization measure. |
| 9 | Deterministic block proposer selection via hash(epoch_seed || slot) | MEDIUM | Tendermint and other BFT systems use proposer selection; specific hash(seed||slot) with trust-weighted selection is a variant. |
| 10 | Domain competence gate for validators | LOW | No prior art found for requiring demonstrated domain expertise (contribution/validation count) as prerequisite for skill validation. Novel. |
| 11 | Multi-metric similarity (word overlap + word-pair sequence overlap) | LOW | Text similarity metrics exist individually; this specific combination is a minor variant. |
| 12 | Dispute resolution via deterministic cryptographic arbitrator selection excluding disputants | LOW | Kleros uses stake-weighted random selection; deterministic hash-based selection excluding specific parties is novel. |
| 13 | On-chain trust oracle with ring buffer, epoch cooldowns, polynomial exp decay in fixed-point | VERY LOW | No prior art found for this specific on-chain trust oracle architecture. Novel. |
| 14 | Polynomial approximation of exp decay in fixed-point arithmetic | LOW | Fixed-point math on chain exists; polynomial approximation of exp decay for trust is a specific implementation. |
| 15 | Weighted median aggregation for trust scores | MEDIUM | Weighted median is a known statistical technique; application to trust attestation aggregation exists in some form. |
| 16 | Four-mechanism Sybil resistance (cooldowns + age decay + temporal clustering + collusion graphs) | LOW | Individual mechanisms exist; the specific four-mechanism combination is novel. |
| 17 | Self-contained skill archive (metadata, definition, implementation, tests, reference outputs, proofs, signatures) | LOW | Anthropic SKILL.md exists for format; SkillChain's archive with validation proofs and cryptographic signatures for decentralized validation is novel. |
| 18 | Platform adapters (structured markup / NL instructions / executable code) | MEDIUM | Cross-platform conversion exists (A2A, GOAT); specific three-mode translation for skill format is novel. |
| 19 | Epoch seed from hash(epoch_number, validator_set) | LOW | Standard cryptographic construction. |
| 20 | Validation proof recording (run count, pass count, similarity, execution hash, env hash) | VERY LOW | No prior art for this specific validation proof structure. Novel. |
| 21 | Skill graduation threshold (min proofs from distinct validators + min pass fraction) | VERY LOW | No prior art found for this specific graduation mechanism. Novel. |
| 22 | On-chain math library (fixed-point EMA, sqrt via iteration, binary log via decomposition) | LOW | Fixed-point math libraries exist on chain; this specific combination is implementation-specific. |

---

## Recommendation

### Strong Claims (proceed as-is)
- **Claims 4, 5, 6, 10, 12, 13, 16, 17, 20, 21**: Highly novel. The trust computation from shadow execution divergence with web-of-trust dampening, domain competence gating, deterministic arbitrator selection, on-chain trust oracle architecture, four-mechanism Sybil resistance, validation proof structure, and skill graduation are all novel with no close prior art.

### Claims Needing Narrowing or Strengthening
- **Claims 1, 2, 3 (independent)**: These face the highest scrutiny. While the overall system is novel, individual components have analogs:
  - Bittensor: stake-weighted consensus for AI validation (but different mechanism)
  - DWBFT/WBFT: trust-weighted BFT (but general purpose, not skill validation)
  - Kleros: on-chain dispute resolution (but stake-based, not trust-based)
  - EigenTrust: P2P trust computation (but different algorithm)
  
  **Recommendation**: Strengthen independent claims by emphasizing the specific integration of:
  1. Trust computed from exponential decay of behavioral divergence observed during **sandboxed shadow execution** (not stake, not general behavior)
  2. **Domain competence gating** restricting validation to peers with demonstrated expertise
  3. **Web-of-trust weighting** where attestation influence is dampened toward neutral based on attester trust
  4. **Universal skill packaging** with validation proofs and platform adapters
  
  These four elements together are not found in any prior art.

- **Claim 8**: Voting weight caps are standard in BFT systems. Consider merging into independent claims or making the cap mechanism more specific.
- **Claim 9**: Proposer selection via hash is known (Tendermint variant). The trust-weighted aspect is the novel element — ensure this is emphasized.
- **Claim 15**: Weighted median is a known technique. Strengthen by emphasizing the trust attestation context and manipulation resistance properties.
- **Claim 18**: Platform adapters are an active area (A2A, GOAT). Narrow to emphasize the three-mode translation specific to validated skill archives.

### At-Risk Claims
- **Claim 8** (voting weight cap): Standard anti-concentration measure in BFT literature. Weak standalone novelty. Keep as dependent claim.
- **Claim 11** (multi-metric similarity): Word overlap + sequence overlap is a minor variant of existing text similarity metrics. Weak standalone novelty. Keep as dependent claim.
- **Claim 19** (epoch seed computation): Standard cryptographic construction. Weak standalone novelty. Keep as dependent claim.

### Critical Differentiators from Bittensor (Closest Art)

| Feature | Bittensor | SkillChain |
|---------|-----------|------------|
| Voting power source | TAO stake (economic) | Trust from behavioral divergence (meritocratic) |
| Validation method | Direct query/evaluation | Sandboxed shadow execution against reference outputs |
| Validator eligibility | Stake registration | Domain competence gate (demonstrated expertise) |
| Trust model | Stake weight | Exponential decay of divergence + web-of-trust + EMA |
| Consensus mechanism | Yuma Consensus (median + clip) | Modified BFT (propose/prevote/precommit + supermajority) |
| Dispute resolution | None formalized | Deterministic cryptographic arbitrator selection |
| Skill format | Subnet-specific APIs | Universal archive with platform adapters |
| Sybil resistance | Stake requirement | Four-mechanism behavioral defense |

### Overall Assessment
**MODERATE-TO-STRONG NOVELTY.** The individual concepts of trust-weighted consensus, skill validation, and blockchain-based reputation all have prior art. However, the specific combination — trust computed from shadow execution divergence, domain competence gating, web-of-trust with neutral dampening, BFT consensus with trust-derived (not stake-derived) voting power, deterministic arbitrator selection, universal skill packaging with validation proofs, and on-chain trust oracle with fixed-point polynomial approximation — has no direct precedent.

The highest risk is from Bittensor (stake-weighted AI validation consensus) and DWBFT (trust-weighted BFT). Neither combines trust computation from skill-specific behavioral divergence with domain competence gating and shadow execution validation. The independent claims should be drafted to clearly distinguish from these systems.
