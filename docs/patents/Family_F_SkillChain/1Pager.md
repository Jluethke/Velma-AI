# IP 1-PAGER — FAMILY F: SKILLCHAIN

**Applicant:** The Wayfinder Trust

**Inventor:** Jonathan Luethke

**Date:** 2026-03-31

---

**Title:** Systems and Methods for Trust-Weighted Byzantine Fault Tolerant Consensus, Decentralized Skill Validation, and Governed Skill Interoperability in Multi-Agent Computing Networks

**Problem:** Autonomous computing agents (LLM-based, rule-based, hybrid) each maintain proprietary skill formats and quality frameworks. Skills developed for one platform cannot be used by another. Existing consensus mechanisms derive validator authority from economic resources (stake, computation), not competence. Cross-platform skill validation is non-trivial because different platforms produce semantically equivalent but textually different outputs. Decentralized trust systems are vulnerable to Sybil attacks via synthetic identity creation.

**Solution:** A decentralized skill validation and distribution network comprising: (1) trust-weighted BFT consensus where voting power derives from exponential decay of behavioral divergence with EMA smoothing, not economic stake; (2) network trust with web-of-trust weighting, attestation cooldowns, and phase classification; (3) shadow validation via sandboxed execution against reference outputs with multi-metric similarity scoring and domain competence gating; (4) a universal skill format with platform-specific adapters; and (5) an on-chain trust oracle using fixed-point polynomial approximation of exponential decay with weighted median aggregation.

**Key Innovation:** Replacing economic stake with behavioral trust as the basis for BFT consensus authority. Trust is computed via exponential decay of divergence observed during actual skill validation, weighted by the attester's own trust (web of trust), smoothed via EMA, and classified into governance phases. This creates proof-of-competence rather than proof-of-stake, where validator authority is earned through demonstrated validation accuracy rather than purchased through token holdings. Individual validator weight is capped to prevent authority concentration.

**Claims Summary:** 3 independent claims (system, method, computer-readable medium) covering trust-weighted BFT, shadow validation with domain gating, and dispute resolution. 35 dependent claims covering on-chain trust oracle, Sybil resistance, universal skill format, platform adapters, graduation criteria, fixed-point mathematics, verified fix engine with tournament selection, skill composition via DAG pipelines, life rewards with proof-of-living, and persistent skill state. 38 claims total.

**Prior Art Differentiation:**
- Tendermint/CometBFT: Stake-weighted consensus, not trust-weighted; no behavioral divergence measurement
- Proof-of-Authority: Fixed validator set, no dynamic trust computation
- Filecoin: Proof-of-storage, not proof-of-competence
- eBay/Stack Overflow reputation: Simple aggregate metrics (average ratings), not exponential decay with EMA; not used for BFT consensus
- Agent frameworks (AutoGPT, CrewAI): No decentralized validation, no cross-platform interoperability
- Package managers (npm, PyPI): No sandboxed validation against reference outputs, no trust-weighted quality assessment

**Filing Status:** Provisional patent application drafted 2026-03-31. Not yet filed. URGENT: Smart contracts will be deployed on-chain, making code permanently public. Must file before deployment.

**Estimated Filing Cost:** $300 (USPTO provisional filing fee, micro entity)

---

*Classification: CONFIDENTIAL -- DRAFT -- NOT FILED*
*Applicant: The Wayfinder Trust*
