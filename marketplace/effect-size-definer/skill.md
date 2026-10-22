# Effect Size Definer

Define the minimum change you care about detecting. If your conversion rate is 5%, do you care about a change to 5.1% or only to 6%? The smaller the change you want to detect, the more data you need. Most people skip this step and then wonder why their data is inconclusive.

## Inputs

- `metric-name`: The metric you are trying to evaluate (conversion rate, weight, revenue, error rate, etc.)
- `current-value`: The current baseline value of the metric, with units

## Outputs

- `minimum-detectable-effect`: The smallest change worth detecting, expressed as an absolute change and a percentage change from baseline
- `effect-rationale`: Why this effect size matters (the business or personal consequence of missing a change smaller than this)

## Process

1. State the current baseline value. Then ask: what is the smallest change that would make you do something different? That is your minimum detectable effect.
2. Express it as both an absolute number (from 5% to 6% = 1 percentage point) and a relative change (1/5 = 20% relative increase).
3. If you cannot define this, you are not ready to measure. Go back and define what decision this measurement is supposed to inform.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
