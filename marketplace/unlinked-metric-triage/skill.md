# Unlinked Metric Triage

For each unlinked metric, decide: should it get an action link, or should it be retired? There are only two valid states for a metric. Either it has a response protocol, or it does not exist.

## Inputs

- `unlinked-metrics`: Metrics that currently have no action linked to them
- `scope-boundary`: The goals and priorities of the team or person, for relevance scoring

## Outputs

- `metrics-to-link`: Unlinked metrics that deserve an action link, because they align with a current goal
- `metrics-to-retire`: Unlinked metrics to stop tracking, because no plausible action would follow from their movement

## Process

1. For each unlinked metric, ask: does this metric align with a current goal or priority? If no, retire it immediately.
2. If yes, ask: if this metric dropped by 30% tomorrow, would anyone do something different? If the answer is still no, retire it.
3. For the survivors: these are metrics that matter but lack a response. They move to the linkage builder.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
