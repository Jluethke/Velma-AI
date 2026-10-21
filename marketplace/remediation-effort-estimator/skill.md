# Remediation Effort Estimator

Estimate the effort, cost, and timeline to remediate each compliance gap.

## Inputs

- `prioritized-gap-list`: Prioritized gaps to estimate
- `existing-controls-inventory`: Current controls for build-vs-extend analysis

## Outputs

- `effort-estimates`: Effort, cost, and timeline estimates per gap
- `quick-win-list`: Gaps that can be closed quickly with minimal effort

## Process

1. For each gap, determine whether it requires a new control or an extension of an existing one
2. Estimate person-hours, tooling costs, and elapsed time for each remediation
3. Identify dependencies between remediation items
4. Flag quick wins (high-priority gaps with low effort) for immediate action

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
