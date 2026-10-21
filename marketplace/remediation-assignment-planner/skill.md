# Remediation Assignment Planner

Assign remediation actions for each gap to owners with timelines.

## Inputs

- `gap-list`: Threats with no or insufficient mitigation
- `ranked-threat-list`: Threats ordered by risk score

## Outputs

- `remediation-plan`: Prioritized list of remediation actions with owners and deadlines
- `residual-risk-summary`: Expected risk posture after remediation

## Process

1. For each gap, propose one or more remediation options with cost estimates
2. Assign each remediation to an owner (team or individual)
3. Set timelines based on risk priority (critical within 30 days, high within 90 days)
4. Calculate the residual risk assuming remediation succeeds

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
