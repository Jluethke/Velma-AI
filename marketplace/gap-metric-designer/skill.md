# Gap Metric Designer

For each blind spot, design the metric that should exist. The metric does not need to be perfect. A rough weekly estimate is better than no measurement at all. The goal is to move from 'flying blind' to 'flying with instruments, even if the instruments are imprecise.'

## Inputs

- `unmeasured-goals`: Goals with no tracking metric
- `total-measurement-cost`: The current cost of measurement, to budget the new metrics

## Outputs

- `new-metrics`: For each blind spot: the metric name, collection method, update frequency, target value, and action protocol
- `measurement-budget`: The total cost of the new metrics, funded by the savings from retiring debt metrics

## Process

1. For each blind spot, ask: what is the simplest number that would tell you whether you are making progress? Not the ideal metric, but the minimum viable measurement. A weekly manual estimate is acceptable.
2. Define the collection method (automated pull, manual entry, proxy metric), the frequency (weekly minimum), and the target value.
3. Fund the new metrics from the savings of retiring debt metrics. If the new metrics cost more than the savings, prioritize by blind spot importance and defer the rest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
