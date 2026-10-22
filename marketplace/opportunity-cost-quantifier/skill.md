# Opportunity Cost Quantifier

Quantify the opportunity cost. Express it in the same units as the direct cost so the two can be added for the true total cost.

## Inputs

- `proposed-use`: The proposed resource allocation
- `best-alternative`: The best alternative use identified

## Outputs

- `true-cost-calculation`: The true cost of the proposed use: direct cost plus opportunity cost (the value of the best alternative foregone)
- `decision-threshold`: The minimum value the proposed use must produce to be worthwhile: it must exceed the true cost, not just the direct cost

## Process

1. Calculate the direct cost of the proposed use: the money spent, the time consumed, the wear on equipment, the attention diverted.
2. Calculate the opportunity cost: the value the best alternative would have produced. This is the foregone benefit.
3. Add them: true cost = direct cost + opportunity cost. The proposed use must produce value exceeding this sum to be a rational allocation.
4. If the proposed use barely exceeds the direct cost but falls short of the true cost, the allocation is destroying value. The resource should go to the best alternative instead.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
