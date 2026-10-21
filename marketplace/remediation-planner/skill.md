# Remediation Planner

Plan remediation for the prioritized queue, assessing upgrade impact and safe target versions.

## Inputs

- `prioritized-vulnerabilities`: Vulnerabilities ordered by urgency to remediate
- `dependency-inventory`: Direct and transitive dependencies with versions

## Outputs

- `patch-plan`: Target versions and sequence for each remediation
- `upgrade-impact-assessment`: Breaking changes and effort for each upgrade

## Process

1. Determine the fixed version or mitigation for each vulnerability
2. Assess breaking changes and effort for each upgrade path
3. Sequence upgrades to minimize churn and conflicting version pins
4. Note vulnerabilities with no fix that need a compensating control

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
