# Aggregate Vs Cohort Reconciler

Reconcile the cohort findings with the aggregate numbers. When someone says 'retention is flat,' the cohort analysis may show that retention is improving but the mix is shifting toward channels with lower retention, producing a flat aggregate. The cohort view is the truth. The aggregate is the shadow.

## Inputs

- `cohort-insights`: The findings from the cohort analysis
- `analysis-question`: The original question, for framing the final answer

## Outputs

- `reconciled-narrative`: The complete story: what the aggregate says, what the cohorts say, why they differ, and which one to act on
- `cohort-analysis-report`: The full report: question, cohort definition, table, curves, insights, and recommended actions

## Process

1. Calculate the aggregate metric (all cohorts combined). Then compare it to the cohort-level finding. If they disagree, explain why: mix shift, Simpson's paradox, or survivorship bias are the usual culprits.
2. State the conclusion in terms of the original question. Answer the question, do not just present data. 'Retention is improving by 3 points per cohort, masked by a shift toward lower-retention channels' is an answer.
3. Recommend which metric to track going forward: the aggregate (if mix is stable) or the cohort-level metric (if mix is shifting). In most cases, the cohort-level metric is the better management tool.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
