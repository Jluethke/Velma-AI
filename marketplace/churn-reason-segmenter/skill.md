# Churn Reason Segmenter

Segment churned customers by reason and identify leading indicators.

## Inputs

- `churn-metrics`: Churn data by cohort
- `customer-feedback`: Exit survey responses and support ticket history

## Outputs

- `churn-reasons`: Categorized reasons for churn with frequency
- `leading-indicators`: Behavioral signals that precede churn

## Process

1. Categorize churn reasons from exit surveys and cancellation flows.
2. Analyze support ticket patterns in the months before churn.
3. Identify product usage patterns that correlate with churn.
4. Rank leading indicators by predictive strength.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
