# Rate Optimization Modeler

Model the cost impact of rate optimization strategies.

## Inputs

- `tariff-details`: Parsed tariff components
- `rate-alternatives`: Alternative rate schedules

## Outputs

- `optimization-scenarios`: Modeled scenarios (rate class change, demand management, time-of-use shifting) with projected savings
- `rate-analysis-report`: Complete rate analysis report with findings and recommendations

## Process

1. Recompute each account's cost under every eligible rate schedule to find the lowest-cost option.
2. Model demand management strategies: peak shaving, load shifting to off-peak hours.
3. Model time-of-use optimization: shifting discretionary loads to lower-cost periods.
4. Produce the report with current cost, optimized cost, annual savings, and implementation steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
