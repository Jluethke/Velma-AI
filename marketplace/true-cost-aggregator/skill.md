# True Cost Aggregator

Sum all four cost layers into the true cost per unit and compare it against the value delivered to determine the net position.

## Inputs

- `direct-cost-per-unit`: Direct cost per unit
- `time-cost`: Time cost per unit
- `opportunity-cost`: Opportunity cost per unit
- `overhead-allocation`: Overhead per unit
- `switching-cost`: Amortized switching cost per unit

## Outputs

- `true-cost-per-unit`: Sum of all four cost layers per unit, showing the breakdown and the percentage each layer contributes
- `value-vs-cost-verdict`: Does the value delivered exceed the true cost? If yes, keep. If no, cut or replace. If marginal, specify what would tip the decision.

## Process

1. Sum: direct cost + time cost + opportunity cost + overhead allocation + amortized switching cost = true cost per unit. Show the percentage each layer contributes to reveal where the real cost lives.
2. Estimate the value delivered per unit. Value is specific and measurable: revenue generated, time saved elsewhere, risk avoided, or satisfaction produced. If the value cannot be stated specifically, it is probably lower than assumed.
3. Compare value to true cost. If value exceeds true cost by more than 50%, it's clearly worth keeping. If true cost exceeds value, it should be cut. If they are within 50% of each other, the decision is marginal and depends on which cost layer is the biggest contributor (a subject with high direct cost but low time cost is different from one with low direct cost but high time cost).
4. Produce the final unit economics table showing all five cost components, the value estimate, and the keep/cut/replace verdict with the specific reasoning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
