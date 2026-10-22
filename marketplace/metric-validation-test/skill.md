# Metric Validation Test

Validate that the metric actually reduces decision uncertainty.

## Inputs

- `metric-definitions`: The defined metrics
- `highest-uncertainty-decisions`: The decisions they serve

## Outputs

- `validation-results`: For each metric: does a change in value change the decision? Is it gameable? Is it timely?
- `final-metric-set`: The validated metrics with definitions, thresholds, and the decisions they inform

## Process

1. For each metric, run the thought experiment: if this metric moved to twice its current value, would you make a different decision? If neither doubling nor halving changes the decision, the metric is not useful.
2. Test for gaming: could someone improve the metric without improving the underlying reality?
3. Test for timeliness: by the time you see the metric, is it too late to act?
4. The final metric set should be 3-10 metrics total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
