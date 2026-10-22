# Utility Billing Analyzer

Collect and analyze utility billing data to establish the facility's energy baseline.

## Inputs

- `facility-info`: Description of the facility including type, size, and operating hours
- `utility-bills`: At least 12 months of utility billing data (electric, gas, water)

## Outputs

- `energy-baseline`: Baseline energy consumption by fuel type, with seasonal patterns and cost breakdown
- `billing-anomalies`: Any anomalies or irregularities found in the billing data

## Process

1. Organize billing data by month, fuel type, and rate component (demand, energy, fixed charges).
2. Calculate annual energy consumption (kWh, therms) and cost by fuel type.
3. Identify seasonal patterns and peak demand months.
4. Flag any anomalies such as unusual spikes or billing errors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
