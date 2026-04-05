# Family B: ALG (Assured Learning Governor)

**Applicant:** The Wayfinder Trust
**Inventor:** Jonathan Luethke
**Status:** READY FOR FILING
**Urgency:** HIGH
**Cost:** $300 (micro-entity provisional)

## Summary

Runtime trust-based governance system for safety-critical adaptive systems. The governor implements a six-stage pipeline (OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, AUDIT) that interposes between an adaptive process and the system state it seeks to modify. It computes divergence across configurable measurement axes, derives trust via exponential decay with EMA smoothing, projects trust forward using divergence trend extrapolation with Bayesian crisis memory, maps trust to authority constraints via linear interpolation between phase-specific levels, enforces bounded operational modifications through a two-layer rollback mechanism, and records all decisions in a tamper-evident cryptographically chained audit trail. The system is domain-agnostic via an abstract adapter interface.

## Core Innovation

No prior art provides a general runtime mechanism that governs ADAPTATION itself during deployment. This governor constrains what a system BECOMES (model parameters, learned behavior) as opposed to the companion system in Family A which governs what a system DOES (actuator commands). The system is algorithm-agnostic -- it works with any adaptive process without requiring modification to the underlying algorithm.

## Documents in This Folder

| Document | Status | Notes |
|----------|--------|-------|
| Provisional.md | Complete | Full provisional with 3 independent claims, 7 figure descriptions, cross-references to Families A, D, F, G |
| Claims.md | Complete | 26 claims (3 independent: system + method + CRM, 23 dependent). Expanded from original 1 independent + 29 dependent. |
| Specification.md | Complete | Full specification with 7 figure descriptions and support for all 26 claims |
| 1Pager.md | Complete | Applicant corrected to The Wayfinder Trust |
| BoundaryMapping.md | Complete | Updated to reflect new claim structure and cross-family references |

## Claim Structure (Updated March 31, 2026)

- **Claim 1:** Independent system claim -- computing system for runtime governance
- **Claim 2:** Independent method claim -- method for governing an adaptive system at runtime
- **Claim 3:** Independent CRM claim -- non-transitory computer-readable medium
- **Claims 4-6:** N-axis divergence monitoring (configurable axes, temporal axis, weighted aggregation)
- **Claims 7-9:** Trust computation (asymmetric dynamics, EMA time constant, post-trust callback)
- **Claims 10-13:** Trust horizon and predictive governance (trend projection, crisis memory, pattern matching, probation)
- **Claims 14-16:** Authority gate and phase management (linear interpolation, phase thresholds, phase set)
- **Claims 17-18:** Two-layer rollback (governance + domain state, dual trigger conditions)
- **Claim 19:** Domain adapter pattern (abstract interface for domain-agnostic governance)
- **Claims 20-23:** Audit trail (record structure, tamper evidence, session root hash, deterministic replay)
- **Claims 24-25:** Recovery and emergency (automatic recovery, emergency override)
- **Claim 26:** Cross-reference to Family A actuation governance (does not claim the combination)

## Changes from Prior Draft (March 31, 2026)

1. **Expanded from 1 to 3 independent claims:** Added method claim (Claim 2) and CRM claim (Claim 3).
2. **Added 7 figure descriptions:** FIG. 1-7 covering pipeline, trust computation, trust horizon, authority mapping, two-layer rollback, audit chain, and phase state machine.
3. **Removed Claim 30 (dual governance):** Replaced with Claim 26 that cross-references Family A without claiming the combination, avoiding family boundary crossing.
4. **Added Trust Horizon claims:** Claims 10-13 cover predictive trust projection, crisis memory bank, pattern matching, and adaptive recovery.
5. **Added Domain Adapter claim:** Claim 19 explicitly claims the abstract adapter interface pattern.
6. **Added asymmetric trust dynamics:** Claim 7 covers configurable decay-to-recovery ratio.
7. **Added linear interpolation:** Claim 14 covers smooth authority transitions without phase boundary discontinuities.
8. **Added two-layer rollback:** Claim 17 explicitly claims independent governance state and domain state rollback.
9. **Quality checked:** No implementation language, no product names, thresholds configurable, abstract under 150 words.

## Cross-References

- **Related to Family A (Runtime Actuation Governance):** Complementary governance layer. Claim 26 cross-references without claiming the combination.
- **Related to Family D (Cross-Subsystem Coordination):** Bridges transmit ALG trust signals across subsystems.
- **Related to Family F (Cognitive Memory Governance):** Applies the ALG architecture to memory governance.
- **Related to Family G (Agent Swarm Governance):** Applies the ALG architecture to multi-agent governance.

## Prior Art Status

- **Prior art search completed:** 2026-03-31
- **Prior art differentiation addressed:** Yes -- Specification updated with explicit differentiation from ATOM OS (reasoning governance vs. learning governance), El Salamouny exponential decay models (known math, novel learning governance application), AuditableLLM (post-hoc audit vs. runtime governance), and emphasis on governing LEARNING (what a system becomes) vs. prior art governing ACTIONS (what a system does)
- **Claims modified:** None -- claims were already well-structured with 3 independent claims
- **Specification updated:** Added "Distinction from Prior Art" subsection to Background with explicit differentiation from ATOM OS, El Salamouny, and AuditableLLM
- **Filing status:** READY -- PRIOR ART CLEARED

## Filing Notes

- 3 independent claims (system, method, CRM) -- ready for filing.
- 23 dependent claims covering all major innovations.
- 7 figure descriptions included in both Provisional and Specification (figures to be drawn before non-provisional).
- No implementation language (no Python, no specific hash function names).
- No product names (no Velma; "assured learning governor" used only in title context).
- All thresholds are configurable, not hardcoded values.
- Abstract is under 150 words.
- Prior art citations strengthened in Specification with explicit differentiation language.

---

*Classification: CONFIDENTIAL -- Internal / NDA Use Only*
*Applicant: The Wayfinder Trust*
