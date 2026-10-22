# Switching Cost Calculator

For each commitment that failed the fresh-start test, calculate the actual switching cost. Switching cost is the one-time cost of stopping: cancellation fees, transition effort, relationship disruption, learning curve for the replacement. Compare this to the ongoing cost of continuing. If the switching cost is less than 6 months of ongoing cost, the math says stop now.

## Inputs

- `sunk-cost-suspects`: Commitments that failed the fresh-start test

## Outputs

- `switching-cost-analysis`: For each suspect: the one-time switching cost vs the ongoing monthly cost, with the breakeven calculation
- `stop-now-list`: Commitments where switching cost is less than 6 months of ongoing cost

## Process

1. For each flagged commitment, list every cost of stopping: fees, transition work, relationships, learning curves.
2. Sum the one-time switching cost.
3. Compare to the ongoing monthly cost multiplied by 6. If switching cost < 6 months of ongoing cost, stopping now saves resources within 6 months.
4. For commitments where the switching cost exceeds 6 months of ongoing cost, the math is less clear. These need further analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
