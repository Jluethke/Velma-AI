# Sos Classification Assessment

Classify the system of systems by governance model (directed, acknowledged, collaborative, virtual) and characterize constituent system independence, evolution authority, and operational autonomy.

## Inputs

- `mission-objectives`: The operational capabilities the SoS must deliver
- `constituent-system-list`: Known or candidate constituent systems and their current owners/operators

## Outputs

- `sos-classification`: Directed, acknowledged, collaborative, or virtual with justification
- `constituent-profiles`: Per-system profile: owner, operational independence level, evolution authority, interface maturity

## Process

1. List each constituent system and its current owner, operator, and funding source. A system with a single controlling authority points toward directed SoS; independent evolution authority points toward acknowledged or collaborative.
2. Score each constituent on three axes: operational independence (runs without the SoS), managerial independence (evolves on its own schedule), and geographic distribution. Sum the scores to place the SoS on the directed-to-virtual spectrum.
3. For each constituent, assess interface maturity on a 1-5 scale: 1 = no interface exists, 2 = ad hoc, 3 = documented but not controlled, 4 = controlled ICD, 5 = verified and regression-tested.
4. Document the classification with rationale. If the SoS spans multiple governance models (common in practice), identify which subgraph is directed and which is collaborative.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
