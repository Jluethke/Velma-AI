# Baseline Measurement

Measure the current price, volume, and revenue as the baseline before any test.

## Inputs

- `product-to-test`: The product or service whose price you want to test
- `current-price`: The current price

## Outputs

- `baseline-metrics`: Current price, units sold per period, total revenue per period, conversion rate (if applicable)
- `baseline-period`: The time period measured and whether it is representative (not a seasonal peak or trough)

## Process

1. Record the current price, units sold per month (or per quarter), total revenue, and conversion rate for at least 3 months of data.
2. Verify the period is representative. Do not baseline during a holiday season, a promotion, or an unusual period. You need the normal run rate.
3. If you have a subscription product, measure both new signups and churn separately. Price changes affect them differently.
4. Record the customer acquisition cost if known. A price increase that reduces volume but increases profit per customer may still be the right move.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
