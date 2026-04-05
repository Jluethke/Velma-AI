# IP BOUNDARY MAPPING — FAMILY F: SKILLCHAIN

**Applicant:** The Wayfinder Trust

**Inventor:** Jonathan Luethke

**Date:** 2026-03-31 (Amended)

---

## What IS Covered

1. **Trust-weighted BFT consensus**: Byzantine fault tolerant consensus where voting power derives from trust scores computed via exponential decay of behavioral divergence with EMA smoothing
2. **Network trust module**: Per-peer trust with web-of-trust weighting, attestation cooldowns, and phase classification into governance tiers
3. **Shadow validation protocol**: Sandboxed execution of skills against test cases with multi-metric similarity scoring and domain competence gating
4. **Domain competence gating**: Restricting validation to peers with demonstrated expertise in the skill's domain
5. **Deterministic dispute resolution**: Cryptographic hash-based arbitrator selection excluding disputing parties, with majority vote resolution
6. **Universal skill format**: Self-contained packaging with metadata, definition, implementation, test cases, validation proofs, and cryptographic signatures
7. **Platform adapters**: Translation of universal format to platform-specific native formats (structured markup, natural language, executable code)
8. **On-chain trust oracle**: Fixed-point polynomial approximation of exponential decay, EMA smoothing, weighted median aggregation, epoch-based cooldowns
9. **Sybil resistance mechanisms**: Diminishing returns, age decay, temporal clustering detection, collusion ring detection
10. **Skill graduation criteria**: Configurable minimum proof count and pass fraction for promotion to graduated status
11. **Verified fix engine**: Multi-candidate fix generation with tournament selection, composite scoring (pass rate improvement, confidence, minimality, regression absence), sandbox isolation for parallel testing, consensus measurement across candidates, before-and-after verification proof, and multi-attempt iteration
12. **Skill composition engine**: DAG-based skill chaining with topological sort execution ordering, upstream-to-downstream context merging, phase filtering for partial skill execution, chain validation (cycle detection, missing reference detection), composite skill export as publishable archives with constituent fee distribution, and visual DAG representation
13. **Life rewards module (Proof of Living)**: Token minting for verified real-world activities across multiple categories, trust-weighted peer attestation verification, anti-gaming mechanisms (daily caps, diminishing returns via exponential decay, cross-category diversity bonuses, streak multipliers with tier interpolation, global daily emission caps), and unified digital/physical token economy
14. **Persistent skill state store**: Cross-session execution state persistence with per-skill namespaces, phase-level completion tracking (status, output, duration), accumulated data key-value persistence, run history archival, incremental execution and partial resumption, and path traversal prevention

## What is NOT Covered

1. The underlying exponential decay trust formula (exp(-gain * divergence)) as a general concept -- belongs to Family B (ALG)
2. Specific agent platform implementations (how any particular agent platform executes skills internally)
3. Specific smart contract deployment details (chain selection, gas optimization techniques)
4. The content or logic of individual skills (the system validates and distributes skills; it does not define their functionality)
5. Standard cryptographic primitives (hash functions, digital signatures, Merkle trees)
6. Standard blockchain patterns (block headers, transaction structures) used without modification
7. ERC-20 token standard implementation
8. Standard DAO governance voting mechanisms
9. General-purpose software debugging or testing tools without the specific multi-candidate tournament scoring and sandbox isolation mechanism
10. General-purpose workflow or pipeline systems without the specific skill-aware DAG execution with context merging and composite skill export
11. General-purpose token reward systems without the specific trust-weighted peer attestation verification and anti-gaming mechanisms
12. General-purpose state persistence or caching systems without the specific phase-level skill execution tracking and cross-session resumption

## Adjacent IP (Other Families)

- **Family B (ALG)**: Provides the exponential decay trust formula (exp(-gain * divergence) with EMA smoothing). Family B claims the formula for runtime learning governance; Family F claims the adaptation of that formula to a decentralized peer-to-peer network with web-of-trust weighting and on-chain fixed-point implementation.
- **Family C (NeurOS/NeuroFS)**: Provides the skill graduation pipeline concept. Family C claims the autonomous skill generation and graduation within a single AI system; Family F claims the network-level validation and graduation across multiple peers.
- **Family D (Bridges)**: Potential consumer of SkillChain governance events. No claim overlap.
- **Family G (Terra Unita)**: Shares the federation governance pattern (trust-derived authority levels). Family G applies it to economic zones; Family F applies it to validator selection. The PRODUCE category in the Life Protocol bridges to Terra Unita's physical production verification. The implementations are independent.

## Trade Secret Boundaries

The following are maintained as trade secrets and NOT included in patent claims:
- Specific decay gain parameter values used in production
- Specific EMA alpha values for trust smoothing
- Specific phase classification threshold values (validator/participant/probation/excluded boundaries)
- Specific weight cap percentage used for validators
- Specific similarity scoring weights (word-level vs word-pair weights)
- Specific graduation criteria (minimum proof count, minimum pass fraction)
- Specific attestation cooldown duration
- Performance optimization techniques for on-chain computation
- Off-chain indexing and caching strategies
- Specific scoring weights used in the verified fix tournament (pass rate improvement, confidence, minimality, regression weights)
- Specific candidate count and maximum attempt count for verified fix mode
- Specific decay factor, diversity bonus multiplier, and streak tier thresholds in the Life Protocol
- Specific daily emission cap amounts and category base reward amounts
- Specific minimum attestor trust threshold for Life Protocol attestation
- Specific file storage paths and directory structure for skill state persistence

## Open Source Boundaries

- The SDK (skill packaging, adapters) will be open-sourced with patent license terms
- Smart contract source code will be publicly visible on-chain once deployed -- patent protection is the ONLY protection mechanism
- The whitepaper describes the protocol at a high level -- the provisional filing must precede any further public distribution
- Reference implementations of the validation protocol may be open-sourced under patent license
- The trust computation parameters and specific threshold values remain proprietary

---

*Classification: CONFIDENTIAL -- DRAFT -- NOT FILED*
*Applicant: The Wayfinder Trust*
