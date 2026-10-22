# Waste Identifier

Identify unused and underutilized resources that represent wasted spending.

## Inputs

- `billing-data`: Itemized billing data
- `utilization-metrics`: Resource utilization data from monitoring

## Outputs

- `waste-inventory`: List of unused or underutilized resources
- `potential-savings`: Estimated savings from eliminating waste

## Process

1. Find unattached storage volumes and elastic IPs
2. Identify instances with consistently low CPU and memory utilization
3. Find idle load balancers and unused database instances
4. Calculate the monthly cost of each wasted resource

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
