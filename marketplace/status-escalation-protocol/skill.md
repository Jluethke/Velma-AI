# Status Escalation Protocol

Define when a status report becomes an escalation and how the escalation path works.

## Inputs

- `report-structure`: The report template with status levels
- `exception-writing-guide`: The exception format

## Outputs

- `escalation-rules`: When a yellow becomes a red, when a red triggers an out-of-cycle escalation, and who the escalation path reaches
- `escalation-templates`: Pre-written escalation messages for common scenarios: missed milestone, resource conflict, scope change, quality issue

## Process

1. Yellow to red: a yellow status becomes red when the issue has persisted for two reporting cycles without resolution, or when the impact exceeds a defined threshold (e.g., more than 1 week of delay, more than 10% cost overrun).
2. Red triggers escalation: when the status is red, an out-of-cycle escalation goes to the next level of decision-making within 24 hours. Do not wait for the next regular report.
3. Escalation path: define who receives escalations at each level. Level 1: the project owner. Level 2: the sponsor. Level 3: the executive team.
4. Pre-write the escalation templates. In a crisis, writing from scratch is slow. The template includes: what is the issue, what is the impact, what options are available, what is the recommendation, and what is the deadline for a decision.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
