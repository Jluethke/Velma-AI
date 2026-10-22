# Combined Stress Scenario

Run all three shocks simultaneously to find the worst-case scenario: income down, unexpected expense, and rates up at the same time.

## Inputs

- `income-shock-result`: Impact of 50% income drop
- `expense-shock-result`: Impact of 3x expense event
- `rate-shock-result`: Impact of 200bp rate increase

## Outputs

- `combined-stress-result`: The combined scenario: new monthly deficit, reserve depletion timeline, and the minimum actions needed to survive all three simultaneously
- `financial-resilience-score`: A single score from 0 to 100: months of combined-scenario survival divided by 12, capped at 100. Below 25 is fragile. 25 to 50 is vulnerable. 50 to 75 is stable. Above 75 is resilient.

## Process

1. Apply all three shocks simultaneously: reduce the largest income source by 50%, subtract the one-time expense shock from reserves, and increase all variable-rate payments by 200bp.
2. Calculate the combined monthly deficit. Calculate the post-shock reserve level. Divide reserves by the monthly deficit to get months to zero under the combined scenario.
3. Calculate the financial resilience score: combined months of survival divided by 12, multiplied by 100, capped at 100. This normalizes across income levels. A household surviving 6 months of combined stress scores 50. A business surviving 9 months scores 75.
4. List the minimum actions needed to survive the combined scenario for at least 6 months. These are the contingency plans to have ready, not actions to take now.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
