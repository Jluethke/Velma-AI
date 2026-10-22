# Compensation Data Analyzer

Analyze the compensation data comparing internal pay to market benchmarks.

## Inputs

- `matched-roles`: Matched roles
- `market-data`: Market data

## Outputs

- `comp-analysis`: Analysis of internal pay vs market percentiles
- `pay-ratios`: Compa-ratios for each role

## Process

1. Calculate the 25th, 50th, and 75th percentile for each benchmarked role
2. Compute the compa-ratio (actual pay / market midpoint) for each incumbent
3. Adjust for geographic cost-of-labor differences
4. Identify roles significantly above or below market

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
