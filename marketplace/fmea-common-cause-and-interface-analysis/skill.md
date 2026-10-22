# Fmea Common Cause And Interface Analysis

Extend the FMEA to cover common cause failures that defeat redundancy and interface failures at system boundaries.

## Inputs

- `rpn-rankings`: RPN scores for all failure modes
- `corrective-action-plan`: Actions already assigned

## Outputs

- `common-cause-failures`: List of failure causes that can simultaneously affect redundant paths: shared power supply, shared environment, shared software, shared manufacturing lot, shared maintenance action
- `interface-failure-modes`: Failure modes at each system interface: electrical, mechanical, thermal, data, and timing boundaries
- `updated-action-plan`: Corrective action plan amended with common cause and interface mitigations

## Process

1. Identify every pair of redundant elements in the design. For each pair, ask: do they share a power source, a clock source, a physical environment (same board area, same enclosure zone), a software function, a manufacturing process, or a maintenance procedure? Each shared element is a common cause path.
2. Rate common cause exposure using the beta factor method: beta is the fraction of failures that affect both channels simultaneously. For physically separated, independently powered, dissimilar implementations, beta is 0.01 to 0.05. For co-located, same-design, same-power channels, beta can be 0.1 to 0.3. This directly multiplies the system failure probability.
3. For every interface identified in the analysis boundary, add failure modes specific to the boundary: impedance mismatch causing signal reflection, protocol timeout from clock drift, thermal expansion causing connector intermittent, data format change from software update incompatibility, and ground potential difference causing common mode noise.
4. Amend the corrective action plan with mitigations for common cause and interface failures. Common cause mitigations: physical separation, diverse implementations, independent power domains, staggered maintenance. Interface mitigations: defined tolerance bands, protocol checksums, watchdog timers across boundaries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
