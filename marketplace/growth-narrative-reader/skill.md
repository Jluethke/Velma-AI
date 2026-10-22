# Growth Narrative Reader

Read the narrative from the numbers. The same topline growth rate can tell very different stories depending on the composition.

## Inputs

- `cohort-classification`: New, retained, resurrected, and churned counts per period
- `growth-equation-table`: The growth decomposition table

## Outputs

- `growth-narrative`: The story the data tells: is growth driven by acquisition (new), reactivation (resurrected), or retention improvement? Is churn masked by new growth?
- `health-diagnosis`: Assessment: healthy growth (retention improving, churn declining), leaky bucket (high new offset by high churn), or zombie growth (flat topline with different people each period)

## Process

1. If growth is positive but churn is also high: you have a leaky bucket. You are acquiring fast enough to mask attrition, but the underlying retention is weak.
2. If growth is positive because of resurrection: you have a reactivation story, not an acquisition story. Something brought back dormant users (a new feature, a campaign, a seasonal effect).
3. If retained count is growing as a percentage of active: retention is improving. This is the strongest growth signal because retained users compound.
4. If the active count is flat but new and churned are both high: you have zombie growth. Different people each period, no compounding. This is unsustainable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
