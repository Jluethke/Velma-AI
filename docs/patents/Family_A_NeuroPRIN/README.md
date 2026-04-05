# Family A: NeuroPRIN

**Applicant:** The Wayfinder Trust
**Inventor:** Jonathan Luethke
**Status:** READY FOR FILING
**Urgency:** HIGH
**Cost:** $300 (micro-entity provisional)

## Summary

Runtime trust-based authority governor for autonomous systems with neural trust inference and tamper-evident audit. NeuroPRIN computes divergence between expected and observed system behavior, infers trust through a multi-stage pipeline combining physics-based decay, temporal smoothing, and neural inference via a multi-head network, maps trust to bounded control authority via a monotonic non-increasing function, and enforces actuator commands through a non-bypassable controller-agnostic enforcement adapter that prevents amplification of requested commands. All governance decisions are recorded in a tamper-evident cryptographic audit chain.

## Core Innovation

No prior art provides a general runtime mechanism that simultaneously:
1. Measures model-reality divergence
2. Infers trust through a multi-stage pipeline with both physics-based and neural inference
3. Bounds control authority proportionally through a monotonic mapping
4. Enforces commands through a non-bypassable, controller-agnostic constraint adapter with a severity hierarchy
5. Manages operating modes with authority-weighted recovery hysteresis
6. Produces cryptographically chain-linked audit records

NeuroPRIN governs ACTUATION -- what the system is allowed to DO -- as a complement to ALG (Family B) which governs LEARNING -- what the system is allowed to BECOME.

## Claim Set

**25 claims total** (3 independent: system, method, CRM; 22 dependent)

Consolidated on 2026-03-31 from three prior competing drafts:
- FORMAL PATENT CLAIM SET (32 claims, system-only independent)
- Patent Claims Draft (41 claims, system/method/CRM)
- Assured Autonomy Patent Claims Draft (41 claims, variant of above)

The consolidated set takes the broadest independent claims, removes redundancy, adds claims for innovations present in the source code but missing from all prior drafts (multi-stage pipeline, neural multi-head inference, controller-agnostic enforcement adapter, constraint severity hierarchy, recovery hysteresis), and removes domain-specific embodiment claims (moved to specification as example embodiments).

## Documents in This Folder

| Document | Status | Notes |
|----------|--------|-------|
| Claims.md | Complete | 25 claims (3 independent), consolidated from 3 drafts |
| Provisional.md | Complete | Updated to match consolidated claims |
| Specification.md | Complete | Updated with detailed descriptions for all claimed features |
| 1Pager.md | Complete | Corrected applicant to The Wayfinder Trust |
| BoundaryMapping.md | Complete | Updated 2026-03-31 |

## Quality Checklist

- [x] No implementation language (no Python, C++, numpy, PyTorch references in claims)
- [x] No product names in claims (no "NeuroPRIN", "Velma", "GovernanceNet" in claims)
- [x] Thresholds configurable (all thresholds described as "configurable" not fixed values)
- [x] 3 independent claims (system, method, CRM)
- [x] Applicant: The Wayfinder Trust
- [x] Abstract under 150 words
- [x] Cross-references to related families (B, C, D, E)
- [x] No ALG claims mixed in (learning governance belongs in Family B)
- [x] No Bridges claims mixed in (cross-subsystem coordination belongs in Family D)
- [x] No resonance/oscillator claims mixed in (Kuramoto belongs in Family E)
- [x] Domain-specific embodiments in specification, not claims

## Cross-References

- **Related to Family B (ALG):** Complementary governance layer. NeuroPRIN governs actuation; ALG governs learning. Dual governance architecture.
- **Related to Family C (NeurOS):** NeurOS embeds NeuroPRIN governance via DomainAdapter. Triple-layer governance claim in NeurOS (Claim 37).
- **Related to Family D (Bridges):** Bridges coordinate NeuroPRIN trust signals across subsystems via governance mesh and phase translation.
- **Related to Family E (Applied Energetics):** AE resonance-derived trust signals may serve as additional inputs to the trust inference module.

## Prior Art Status

- **Prior art search completed:** 2026-03-31
- **Prior art differentiation addressed:** Yes -- Specification updated with explicit differentiation from Neural Simplex Architecture (binary switching vs. continuous trust modulation), Aegis Architecture (policy compliance vs. actuation governance), and exponential decay trust models (known math, novel governance application)
- **Claims modified:** None -- claims were already well-structured
- **Specification updated:** Added "Distinction from Prior Art" subsection to Background with explicit differentiation from Neural Simplex, Aegis, and El Salamouny exponential decay models
- **Filing status:** READY -- PRIOR ART CLEARED

## Filing Notes

- Original .docx sources in `Documents/IP Patent Drafts/` contain 5 embedded low-res PNG drawings -- adequate for provisional but need professional redraw for non-provisional.
- Prior art citations strengthened in Specification with explicit differentiation language.
- Implementation evidence: QNX C++ port (38/38 tests, 4.40us WCET, bitwise deterministic). Python implementation in governance/neuroprin/ (4 modules: monitor.py, governance_net.py, constraint_adapter.py, contracts.py).
