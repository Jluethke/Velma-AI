# Demand Sampling

Sample the incoming work over a bounded window so the mix can be measured rather than guessed. Sampling at the point of intake catches what gets absorbed quietly before anyone records it as a problem.

## Inputs

- `work-intake-source`: Where incoming work or requests arrive
- `sampling-period`: The window over which intake is sampled

## Outputs

- `demand-sample`: The sampled set of incoming work items
- `sample-window`: The bounded period the sample represents

## Process

1. Capture incoming work items at the point of intake over a bounded window.
2. Record each item in the requester's own words before it is reclassified internally.
3. Keep the window long enough to cover normal variation in the work mix.
4. Note the total volume so later ratios map back to real load.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
