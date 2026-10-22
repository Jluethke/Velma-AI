# Metric Designer

For each high-uncertainty decision, design the metric that reduces the uncertainty.

## Inputs

- `highest-uncertainty-decisions`: The decisions that need metrics
- `context`: The operating context

## Outputs

- `metric-definitions`: For each decision: the metric name, what it measures, how it is calculated, the data source, measurement frequency, and the threshold that triggers action
- `metric-limitations`: What each metric does NOT measure and the decisions it should NOT be used for

## Process

1. For each decision, ask: what single number, if you could see it updated in real time, would most reduce your uncertainty?
2. Define the metric precisely: name, calculation formula, data source, measurement frequency. Two people measuring independently should get the same number.
3. Set the action threshold: what metric value triggers a change in the decision?
4. Document the limitations: what does this metric NOT capture? Every metric is a proxy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
