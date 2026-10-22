# Field Profitability Analyzer

Analyze field-level and zone-level profitability.

## Inputs

- `cleaned-yield-data`: Yield data by zone
- `vra-maps`: Input rates by zone

## Outputs

- `profitability-map`: Net return per acre by zone
- `optimization-recommendations`: Zones to increase, maintain, or decrease inputs

## Process

1. Calculate gross revenue by zone from yield and commodity price.
2. Allocate input costs by zone from the VRA prescription rates.
3. Compute net return per acre for each zone.
4. Recommend input adjustments for unprofitable zones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
