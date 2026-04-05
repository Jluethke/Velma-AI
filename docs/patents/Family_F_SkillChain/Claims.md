# FORMAL PATENT CLAIM SET — FAMILY F: SKILLCHAIN

**DRAFT -- NOT FILED -- REQUIRES ATTORNEY REVIEW**

**Title:** Systems and Methods for Trust-Weighted Byzantine Fault Tolerant Consensus, Decentralized Skill Validation, and Governed Skill Interoperability in Multi-Agent Computing Networks

**Applicant:** The Wayfinder Trust

**Inventor:** Jonathan Luethke

**Date:** 2026-03-31 (Amended)

---

## Independent Claims

**Claim 1.** A system for decentralized skill validation and distribution in a multi-agent computing network, the system comprising:

a) a network trust module configured to compute per-peer trust scores using exponential decay of behavioral divergence observed during sandboxed skill validation, with exponential moving average smoothing, wherein trust in an attestation is weighted by a trust score of an attesting peer and dampened toward a configurable neutral value based on the attesting peer's trust score to form a web of trust with attestation cooldowns preventing repeated attestations from an attester-subject pair within a configurable time period;

b) a consensus engine configured to implement Byzantine fault tolerant consensus with voting power derived from the trust scores computed by the network trust module rather than from economic stake or computational power, wherein the consensus engine requires agreement from peers holding at least a configurable supermajority fraction of total trust-derived weight;

c) a skill validation engine configured to validate computational skills through sandboxed shadow execution against reference outputs using a multi-metric similarity function, wherein a domain competence gate restricts validation eligibility to peers that have demonstrated expertise in a skill's domain by having contributed or validated at least a configurable number of skills in that domain; and

d) a skill packaging module configured to encapsulate skills in a self-contained archive comprising executable implementation, test cases, reference outputs, validation proofs, and cryptographic signatures, and to translate the archive to platform-specific formats via platform adapters for consumption by heterogeneous agent platforms;

wherein the combination of trust derived from shadow execution behavioral divergence, domain competence gating of validators, web-of-trust dampening with attestation cooldowns, and universal skill packaging with validation proofs provides a meritocratic validation protocol that does not rely on economic stake for authority.

**Claim 2.** A method for achieving Byzantine fault tolerant consensus in a decentralized computing network using trust-derived voting power, the method comprising:

a) computing, for each peer in the network, a trust score using exponential decay of behavioral divergence observed during sandboxed shadow execution of computational skills, with exponential moving average smoothing, wherein each trust observation is dampened toward a configurable neutral value based on a trust score of a peer providing the observation, and wherein attestation cooldowns prevent repeated attestations from an attester-subject pair within a configurable time period;

b) selecting validators for a consensus epoch based on trust score, duration of network participation, and volume of skill contributions, wherein validator eligibility further requires demonstrated domain competence in a skill's domain;

c) computing each validator's voting weight from its trust score;

d) for each block slot within an epoch, selecting a block proposer by computing a cryptographic hash of an epoch seed concatenated with a slot number and performing weighted selection among validators;

e) advancing block consensus through propose, prevote, and precommit phases, each requiring agreement from validators holding at least a configurable supermajority fraction of total trust-derived weight; and

f) committing a block when a precommit supermajority is achieved;

wherein voting power is derived entirely from trust earned through skill validation performance rather than from economic stake or computational power.

**Claim 3.** A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause the one or more processors to perform operations comprising:

a) maintaining per-peer trust scores in a decentralized network using exponential decay of behavioral divergence observed during sandboxed shadow execution of computational skills, with exponential moving average smoothing and web-of-trust weighting wherein attestation influence is dampened toward a neutral value based on attester trust, with attestation cooldowns preventing repeated attestations from an attester-subject pair within a configurable time period;

b) implementing Byzantine fault tolerant consensus with voting power derived from trust scores earned through skill validation performance rather than from economic stake, and configurable supermajority requirements;

c) validating computational skills through sandboxed shadow execution with domain competence gating requiring demonstrated expertise and multi-metric similarity scoring; and

d) resolving validation disputes through deterministic cryptographic selection of arbitrators from a validator set, excluding disputing parties.

---

## Dependent Claims

**Claim 4.** The system of Claim 1, wherein the network trust module computes a raw trust value using an exponential decay function applied to a divergence, where the divergence is computed from shadow execution similarity scores as one minus a mean similarity across validation runs.

**Claim 5.** The system of Claim 1, wherein a web-of-trust weighting computes weighted trust by interpolating between a raw trust value and the configurable neutral value based on the attesting peer's trust score, such that attestations from peers with low trust scores are dampened toward the configurable neutral value.

**Claim 6.** The system of Claim 1, wherein the network trust module enforces an attestation cooldown period between attestations from a given attester-subject pair, rejecting attestations submitted before the cooldown expires.

**Claim 7.** The system of Claim 1, wherein the network trust module classifies peer trust scores into a plurality of trust phases using configurable thresholds, including at least a validator phase, a participant phase, a probation phase, and an excluded phase.

**Claim 8.** The system of Claim 1, wherein each validator's voting weight is subject to a cap equal to a configurable maximum fraction of total network trust-derived weight, and wherein the cap is dynamically adjusted based on a number of active validators to prevent any single validator from exceeding a configurable influence ceiling regardless of its accumulated trust score.

**Claim 9.** The system of Claim 1, wherein the consensus engine selects a block proposer for each slot using a deterministic function of a cryptographic hash of an epoch seed concatenated with a slot number, with weighted selection proportional to trust-derived voting weights.

**Claim 10.** The system of Claim 1, wherein the skill validation engine employs the domain competence gate that requires validators to have demonstrated expertise in a domain of a skill under validation by having contributed at least a configurable number of skills in that domain or validated at least a configurable number of skills in that domain.

**Claim 11.** The system of Claim 1, wherein the multi-metric similarity function used in shadow execution validation computes a weighted combination of a word-level set overlap metric measuring output content coverage and a word-pair sequence overlap metric measuring output structural ordering, with configurable weights, and wherein a similarity score determines the behavioral divergence input to the trust computation of Claim 1.

**Claim 12.** The system of Claim 1, further comprising a dispute resolution module configured to select a configurable number of arbitrators from a validator set using deterministic cryptographic hash-based selection that excludes a challenger and an original validator, and to resolve disputes by majority vote among the selected arbitrators.

**Claim 13.** The system of Claim 1, further comprising an on-chain trust oracle contract configured to:
  i) store attestations in a fixed-size ring buffer per target node;
  ii) enforce epoch-based attestation cooldowns;
  iii) compute exponential decay using a polynomial approximation in fixed-point arithmetic; and
  iv) aggregate trust scores using a weighted median where weights are reporter trust levels.

**Claim 14.** The system of Claim 13, wherein the on-chain trust oracle contract computes exponential decay using a polynomial approximation of configurable order in fixed-point arithmetic with a precision constant of at least a configurable minimum precision.

**Claim 15.** The system of Claim 13, wherein a weighted median aggregation sorts attestation values and finds a value at a cumulative weight midpoint, providing resistance to manipulation by requiring an attacker to control more than half the total weight.

**Claim 16.** The system of Claim 1, further comprising Sybil resistance mechanisms including at least two of: diminishing returns for repeated attestations from an attester-subject pair; age-based weight decay for new nodes; temporal clustering detection; and collusion ring detection via graph analysis of attestation patterns.

**Claim 17.** The system of Claim 1, wherein the skill packaging module encapsulates skills in the self-contained archive comprising skill metadata, a skill definition, executable implementation, test cases, reference outputs, validation proofs, and cryptographic signatures.

**Claim 18.** The system of Claim 1, wherein the platform adapters translate a universal skill format to platform-specific formats by converting skill definitions to structured markup, natural language instructions, or executable code depending on a target platform's native format.

**Claim 19.** The method of Claim 2, wherein the epoch seed is computed as a cryptographic hash of an epoch number and a set of validator identifiers, and wherein the epoch seed is used both for deterministic block proposer selection and for deterministic arbitrator selection in dispute resolution, ensuring reproducible governance decisions across all network participants.

**Claim 20.** The method of Claim 2, further comprising computing a validation proof for a skill by executing the skill in a sandboxed environment against test cases, comparing outputs to reference outputs using a multi-metric similarity function, and recording a run count, a pass count, similarity scores, execution hashes, and an environment hash.

**Claim 21.** The method of Claim 2, further comprising graduating a skill when it accumulates a configurable minimum number of validation proofs from distinct validators and a configurable minimum fraction of those proofs indicate passing results.

**Claim 22.** The system of Claim 13, further comprising an on-chain mathematical library providing fixed-point implementations of exponential moving average, square root via iterative approximation, and binary logarithm via binary decomposition.

### Group 5: Verified Fix Mode (Claims 23-28)

**Claim 23.** The system of Claim 1, further comprising a verified fix engine configured to:

a) generate a plurality of candidate fixes for a detected software defect;

b) provision an isolated sandbox copy of a codebase for each candidate fix, wherein each sandbox is independent such that modifications applied within one sandbox cannot affect any other sandbox or the original codebase;

c) apply each candidate fix to its respective sandbox;

d) execute automated tests in each sandbox independently;

e) compute a composite score for each candidate based on a weighted combination of test pass rate improvement relative to a pre-fix baseline, fix confidence, code minimality measured as an inverse function of a number of modified lines, and absence of test regressions; and

f) select a highest-scoring candidate as a verified fix and apply the selected fix to the original codebase.

**Claim 24.** The system of Claim 23, wherein the composite score is computed as a weighted linear combination of: a test improvement component measuring a ratio of newly passing tests to previously failing tests; a confidence component derived from automated analysis of proposed changes; a minimality component computed as a decreasing function of a total number of modified lines such that fewer changes yield a higher score; and a regression penalty component measuring a fraction of previously passing tests that remain passing, wherein each component weight is configurable.

**Claim 25.** The system of Claim 23, wherein provisioning each sandbox comprises creating a copy of the codebase in an ephemeral directory with automatic exclusion of non-essential artifacts, and wherein all sandboxes are automatically removed upon completion of a tournament regardless of outcome.

**Claim 26.** The system of Claim 23, further comprising a consensus measurement module configured to compute a consensus score based on a fraction of candidate fixes that modify same files or same functions as a plurality candidate, wherein a higher consensus score indicates higher confidence in an identified fix location.

**Claim 27.** The system of Claim 23, further comprising a verification proof module configured to execute an automated test suite both before any fix is applied and after a winning fix is applied to the original codebase, and to produce a verifiable before-and-after comparison record comprising a total test count, a pass rate, and specific errors resolved.

**Claim 28.** The system of Claim 23, wherein if the highest-scoring candidate does not achieve full test passage, the verified fix engine iterates through candidates in descending score order, applying and verifying each in turn, up to a configurable maximum number of attempts, and rolling back any candidate that does not improve a test pass rate relative to the pre-fix baseline.

### Group 6: Skill Composition and Chaining (Claims 29-32)

**Claim 29.** The system of Claim 1, further comprising a skill composition engine configured to:

a) accept a directed acyclic graph of skill steps with dependency edges, wherein each step references a skill and may declare dependencies on one or more upstream steps;

b) resolve an execution order via topological sort of the dependency graph;

c) execute skills in the resolved execution order, merging output data from each completed upstream step into an input context of each downstream step; and

d) support parallel execution of steps that share no mutual dependencies.

**Claim 30.** The system of Claim 29, wherein the skill composition engine is further configured to export a composed skill chain as a new publishable skill archive, wherein a composite skill archive references its constituent skills and their dependency relationships, and wherein the system distributes usage fees among all constituent skill creators in proportion to their contribution to the composite chain.

**Claim 31.** The system of Claim 29, wherein each step in the directed acyclic graph may specify a phase filter restricting execution to a subset of the referenced skill's execution phases, enabling partial skill execution when only certain outputs are needed by downstream steps.

**Claim 32.** The system of Claim 29, further comprising a chain validation module configured to detect, prior to execution: circular dependencies via cycle detection in the dependency graph; references to missing or unresolved skills; and duplicate step identifiers, and further configured to generate a visual representation of an execution graph for inspection.

### Group 7: Life Protocol / Proof of Living (Claims 33-36)

**Claim 33.** The system of Claim 1, further comprising a life rewards module configured to mint tokens in a token economy of the skill marketplace in response to verified real-world human activities, across a plurality of activity categories including at least physical activity, knowledge acquisition, creative production, knowledge transfer, community service, and physical goods production.

**Claim 34.** The system of Claim 33, wherein verification of a submitted activity proof requires a configurable minimum number of attestations from peers whose trust scores exceed a configurable minimum trust threshold, and wherein self-attestation is prohibited.

**Claim 35.** The system of Claim 33, further comprising anti-gaming mechanisms including at least two of: a configurable maximum number of reward-eligible activities per category per time period; diminishing returns wherein successive activities within a time period yield progressively reduced rewards computed via an exponential decay function; cross-category diversity bonuses wherein engaging in activities across a configurable minimum number of distinct categories within a time period yields a multiplied reward; and streak bonuses wherein consecutive time periods of activity yield increasing reward multipliers up to a configurable ceiling.

**Claim 36.** The system of Claim 33, wherein the life rewards module mints tokens in the token economy and using a same token contract as the skill marketplace, such that tokens earned through verified physical activities may be spent to acquire computational skills, and tokens earned through skill creation and validation may be used to fund physical production rewards, thereby bridging digital and physical economic activity within a unified token economy.

### Group 8: Persistent Skill State (Claims 37-38)

**Claim 37.** The system of Claim 1, further comprising a skill state store configured to persist execution state between skill invocations using a file-based storage backend organized by skill identity, wherein persisted state includes phase completion records, accumulated data that survives across invocations, and a chronological run history, such that a subsequent invocation of the same skill can load previous state and resume or build upon prior results.

**Claim 38.** The system of Claim 37, wherein the skill state store tracks a completion status, output data, and a duration of each execution phase within a skill run, enabling partial resumption of a previously interrupted execution and incremental execution across sessions wherein only uncompleted phases are re-executed.

---

## Cross-References

This claim set relates to and should be read in conjunction with:
- Family B (ALG): The exponential decay trust function adapted to decentralized network context
- Family C (NeurOS/NeuroFS): The skill graduation pipeline extended to network validation
- Family D (Bridges): Potential consumer of SkillChain governance events
- Family G (Terra Unita): Shared governance patterns (trust-derived authority)

---

*Classification: CONFIDENTIAL -- DRAFT -- NOT FILED*
*Applicant: The Wayfinder Trust*
