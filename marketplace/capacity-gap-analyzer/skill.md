# Capacity Gap Analyzer

Identify capacity shortfalls and over-provisioned resources.

## Inputs

- `demand-forecast`: Projected capacity needs
- `utilization-baselines`: Current baselines

## Outputs

- `capacity-gaps`: Components that will exceed capacity within the forecast period
- `optimization-opportunities`: Over-provisioned resources that can be right-sized

## Process

1. Compare the demand forecast against current capacity.
2. Identify components that will hit capacity limits.
3. Identify components that are over-provisioned and can be downsized.
4. Rank gaps by business impact and urgency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
