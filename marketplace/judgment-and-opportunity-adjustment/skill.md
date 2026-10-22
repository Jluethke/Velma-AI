# Judgment And Opportunity Adjustment

Adjust the verdict for the value of human judgment lost and the opportunity cost of the build time. A task that carries judgment or that competes with higher-value work can fail the test even when the raw hours pass.

## Inputs

- `breakeven-months`: Raw payback horizon
- `two-year-verdict`: Raw pass or fail

## Outputs

- `adjusted-verdict`: The verdict after judgment and opportunity cost
- `judgment-risk-notes`: What human judgment the automation would remove

## Process

1. Name any human judgment the task carries that an automation would lose or flatten.
2. Weigh the build time against the next best use of that same time.
3. Revise the verdict down when lost judgment or opportunity cost outweighs the raw hours saved.
4. Record why the adjusted verdict differs from the raw break-even result.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
