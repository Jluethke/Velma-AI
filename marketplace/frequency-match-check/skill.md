# Frequency Match Check

For surviving metrics, check whether the update frequency matches the decision frequency. A metric that updates daily on a dashboard reviewed monthly wastes 29 out of 30 updates. A metric that updates monthly on a dashboard checked daily creates 29 days of stale information per cycle.

## Inputs

- `action-linked-metrics`: Metrics that passed the last-action test

## Outputs

- `frequency-matched`: Metrics where the update frequency is within 2x of the decision frequency
- `frequency-mismatched`: Metrics where the update and decision frequencies are misaligned, with the recommended adjustment

## Process

1. For each metric, determine the decision frequency: how often does someone make or adjust a decision based on this number? Daily decisions need daily (or faster) data. Weekly decisions need weekly data.
2. Compare to the update frequency. If the metric updates 4x faster than the decision frequency, it is over-updating (creating noise). If it updates slower, it is under-updating (the decision-maker is looking at stale data).
3. Recommend the adjustment: change the update frequency to match the decision frequency, or if that is not possible, add a note on the dashboard showing the data freshness.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
