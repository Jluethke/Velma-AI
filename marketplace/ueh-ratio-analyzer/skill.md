# Ueh Ratio Analyzer

Compute the lifetime value to acquisition cost ratio and the payback.

## Inputs

- `ltv-value`: The lifetime value of a unit
- `cac-value`: The cost to acquire a unit

## Outputs

- `ltv-cac-ratio`: The ratio of lifetime value to acquisition cost
- `cac-payback-months`: The months to recover the acquisition cost

## Process

1. Divide the lifetime value by the acquisition cost for the ratio.
2. Divide the acquisition cost by the monthly contribution for the payback months.
3. Compare the ratio against the three to one line and the twelve month line.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
