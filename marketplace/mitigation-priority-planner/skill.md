# Mitigation Priority Planner

Prioritize and plan the mitigations for the top vulnerabilities.

## Inputs

- `vulnerability-list`: The ranked vulnerabilities
- `defense-map`: The current defense posture

## Outputs

- `mitigation-plan`: For each top vulnerability: the mitigation action, the cost, the timeline, and the expected reduction in vulnerability score
- `threat-model-document`: The complete threat model: assets, threats, vectors, defenses, vulnerabilities, and mitigation plan

## Process

1. For each top vulnerability, design the mitigation: what control, process, or behavior change would block the preconditions or detect the vector?
2. Estimate the cost and timeline. Compare to the expected loss (vulnerability score converted to dollars or consequences). If the mitigation costs less than the expected loss, proceed.
3. Look for mitigations that block multiple vectors (shared preconditions). These give the best return on investment.
4. Compile the complete threat model document. Set the review cadence: re-assess whenever the asset inventory changes, a new threat emerges, or a defense is modified.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
