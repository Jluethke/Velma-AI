# Price Increase Test Design

Design the price test: increase by 10%, measure for a defined period, and determine the sample size needed for a reliable result.

## Inputs

- `baseline-metrics`: Current performance data
- `product-to-test`: The product being tested

## Outputs

- `test-design`: The test parameters: new price (10% higher), test duration (minimum 30 days), how volume will be measured, and what constitutes a conclusive result
- `decision-criteria`: The specific thresholds: if volume drops by less than X%, the price increase is net-positive for revenue

## Process

1. Set the test price at 10% above current. This is large enough to measure an effect but small enough that it will not cause a dramatic reaction.
2. Define the test duration: minimum 30 days for products with short purchase cycles, 60-90 days for longer cycles. The test must be long enough for the price change to be noticed by the full buying population.
3. Define the decision criterion: a 10% price increase is revenue-positive as long as volume drops by less than 10%. Calculate the exact break-even volume drop for your margins.
4. If possible, run an A/B test (show the new price to half the audience). If not possible, run a before-after test with the full audience.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
