# Allocation Drift Detector

Define the target allocation and the drift thresholds that trigger rebalancing.

## Inputs

- `target-allocation`: The intended allocation across categories (e.g., 60/30/10 split, or specific dollar amounts per category)
- `rebalancing-cost`: The cost of rebalancing (transaction fees, disruption, switching costs)

## Outputs

- `drift-thresholds`: For each category: the maximum acceptable drift from target before rebalancing triggers (expressed as percentage points or dollar amounts)
- `monitoring-setup`: How to measure drift: the data source, the measurement frequency, and the alert mechanism

## Process

1. Set the target allocation: the intended percentage or amount for each category. This is the baseline.
2. Calculate the drift threshold for each category. The threshold depends on the rebalancing cost: if rebalancing is cheap (moving money between accounts), set tight thresholds (5 percentage points). If rebalancing is expensive (hiring, restructuring), set wider thresholds (15-20 percentage points).
3. Define the monitoring: how often is the actual allocation measured, and how is the drift calculated? Automated monitoring is better than manual checks.
4. Set the alert: when any category drifts beyond its threshold, notify the decision-maker. Do not wait for the next scheduled review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
