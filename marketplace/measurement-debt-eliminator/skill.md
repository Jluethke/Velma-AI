# Measurement Debt Eliminator

For metrics scoring zero on all three questions, decide: retire (stop collecting) or convert (give it an action link to make it useful). The default is retire. The burden of proof is on keeping a metric, not on removing it.

## Inputs

- `debt-candidates`: Metrics with zero scores across all three questions

## Outputs

- `retired-metrics`: Metrics to stop tracking, with the reason and the estimated cost saved
- `converted-metrics`: Metrics given a new action link and a 90-day probation period to prove their value

## Process

1. For each debt candidate, ask one final question: if we stop tracking this, is there a plausible scenario where we would regret it? Be specific. 'We might need it someday' is not a scenario.
2. If no plausible regret scenario exists, retire the metric. Calculate the cost saved (collection time, system resources, attention).
3. If a plausible scenario exists, do not keep the metric as-is. Instead, give it an action link (define what action would be taken if it moved) and put it on 90-day probation. If no one acts on it in 90 days, retire it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
