# Scoring Threshold Setter

Set thresholds that classify leads as hot, warm, or cold.

## Inputs

- `scoring-matrix`: Point values for all signals
- `customer-data`: Historical leads with outcomes

## Outputs

- `score-thresholds`: Numeric boundaries for hot, warm, cold
- `threshold-validation`: Backtested accuracy of thresholds against historical data

## Process

1. Score historical leads using the matrix.
2. Plot score distributions for converted vs non-converted leads.
3. Set thresholds to maximize separation between groups.
4. Calculate precision and recall at each threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
