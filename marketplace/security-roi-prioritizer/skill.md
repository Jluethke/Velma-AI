# Security Roi Prioritizer

Prioritize proposed investments by return on security investment (ROSI) and implementation feasibility.

## Inputs

- `investment-risk-map`: Investments linked to risk reduction
- `cost-estimates`: Cost of each investment
- `risk-quantification`: ALE for each risk scenario

## Outputs

- `prioritized-investments`: Investments ranked by ROSI with recommended sequencing
- `quick-wins`: Low-cost, high-impact investments to implement first

## Process

1. Compute ROSI for each investment: (risk reduction minus cost) divided by cost
2. Rank by ROSI, adjusting for implementation complexity
3. Identify quick wins (high ROSI, low complexity, short timeline)
4. Group into phases: immediate, 6-month, 12-month

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
