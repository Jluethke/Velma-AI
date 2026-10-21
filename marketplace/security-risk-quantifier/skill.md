# Security Risk Quantifier

Quantify security risk in business terms using expected loss from breaches and incidents.

## Inputs

- `capability-gap-list`: Security gaps to quantify
- `current-security-stack`: Context on what is in place

## Outputs

- `risk-quantification`: Annualized loss expectancy for each major risk scenario
- `breach-cost-estimates`: Expected cost of a breach based on industry data and organization size

## Process

1. Identify the top risk scenarios tied to the capability gaps
2. Estimate annualized rate of occurrence for each scenario
3. Estimate single loss expectancy using industry benchmarks (Ponemon, Verizon DBIR)
4. Compute annualized loss expectancy (ALE = SLE x ARO)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
