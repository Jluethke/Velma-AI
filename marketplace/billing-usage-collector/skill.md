# Billing Usage Collector

Collect billing and usage data from cloud providers to understand current spending patterns.

## Inputs

- `cloud-accounts`: Cloud provider accounts to analyze
- `billing-period`: The time period to analyze

## Outputs

- `billing-data`: Itemized billing data by service and resource
- `spending-trends`: Spending trends over the analysis period

## Process

1. Export billing data from each cloud provider
2. Break down costs by service, region, and resource type
3. Identify the top spending categories
4. Calculate month-over-month spending trends

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
