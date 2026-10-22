# Risk Radar Dashboard

Produce the weekly risk radar report: a visual summary of all risks by score and proximity.

## Inputs

- `risk-proximity-map`: The proximity-tagged risks
- `approaching-risk-alerts`: The acceleration alerts

## Outputs

- `risk-radar-report`: The weekly report: risk count by zone (red/yellow/green), approaching risks requiring action, risks retired since last scan, and the single highest-priority risk
- `mitigation-action-items`: Actions needed this week for immediate and near-term risks

## Process

1. Produce the radar summary: how many risks in each proximity zone, how many moved closer, how many were retired (the trigger event passed without the risk materializing or the risk was mitigated).
2. Highlight the single highest-priority risk: the one with the highest score among the immediate and near-term risks. This is the one that demands the most attention this week.
3. List the mitigation actions for the week: what must happen this week to address immediate and near-term risks?
4. Distribute the report to the project team and stakeholders. The format should be scannable in under 2 minutes: headline risk count, top risk, and action items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
