# Break Even Probability Estimator

Estimate the probability of breaking even given uncertainty in the inputs. Costs might be higher and volume might be lower than expected.

## Inputs

- `cost-structure`: The cost and revenue structure
- `break-even-units`: The break-even volume
- `expected-volume`: Expected units per period

## Outputs

- `break-even-probability`: The estimated probability that the investment breaks even within the planning horizon, given ranges on the key inputs
- `scenario-range`: Best case (favorable inputs), expected case, and worst case (unfavorable inputs), each with their break-even time

## Process

1. For each key input (fixed costs, variable costs, revenue per unit, volume per period), define three values: favorable (things go better than expected), expected (most likely), and unfavorable (things go worse than expected). The unfavorable case should be realistic, not catastrophic.
2. Calculate break-even time under each scenario: favorable (lowest costs, highest volume), expected, and unfavorable (highest costs, lowest volume).
3. Estimate the probability: if all three scenarios break even within the planning horizon, probability is high (above 80%). If only the favorable and expected scenarios break even, probability is moderate (40 to 60%). If only the favorable scenario breaks even, probability is low (below 30%).
4. The probability estimate is rough, not precise. Its purpose is to flag investments where break-even depends on everything going right (low probability) versus investments that break even even when things go wrong (high probability).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
