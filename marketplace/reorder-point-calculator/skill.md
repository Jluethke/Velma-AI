# Reorder Point Calculator

Calculate reorder points and safety stock levels for each product.

## Inputs

- `demand-patterns`: Demand patterns and variability
- `forecast-model`: Forecasting model parameters

## Outputs

- `reorder-points`: Reorder point and safety stock per SKU
- `lead-time-assumptions`: Lead time data used in calculations

## Process

1. Gather supplier lead times and lead time variability.
2. Calculate average demand and demand variability during lead time.
3. Compute safety stock at the target service level (95% or 99%).
4. Set the reorder point as average demand during lead time plus safety stock.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
