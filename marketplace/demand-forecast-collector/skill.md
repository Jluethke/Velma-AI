# Demand Forecast Collector

Collect demand forecasts and the order backlog.

## Inputs

- `sales-forecast`: Forward-looking demand forecast by product
- `order-backlog`: Current open orders with due dates

## Outputs

- `demand-plan`: Consolidated demand by product and time period
- `priority-rules`: Order priority criteria (due date, customer tier, margin)

## Process

1. Merge sales forecast with confirmed orders
2. Resolve conflicts between forecast and actual orders
3. Set priority rules for sequencing (due date, customer class, profitability)
4. Aggregate demand into planning time buckets

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
