# Value Vs Failure Classification

Classify each sampled item as value demand, which is work the operation exists to do, or failure demand, which is work caused by not doing something right earlier. The ratio is usually higher than the operation believes.

## Inputs

- `demand-sample`: Sampled incoming work
- `sample-window`: The period sampled

## Outputs

- `value-demand`: Items the operation exists to serve
- `failure-demand`: Items caused by an earlier failure to do it right
- `failure-demand-ratio`: Failure demand as a share of total demand

## Process

1. Classify an item as value demand when it is work the operation exists to perform.
2. Classify an item as failure demand when it exists only because something earlier was not done right.
3. Resolve ambiguous items by asking whether the requester should have needed to make contact at all.
4. Compute the failure-demand ratio against the sample total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
