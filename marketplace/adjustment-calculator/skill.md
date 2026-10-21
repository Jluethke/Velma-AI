# Adjustment Calculator

Calculate the adjustment for each breakpoint: estimate the shift magnitude and apply it to the earlier segment to create a homogeneous record.

## Inputs

- `classified-breakpoints`: Breakpoints with causes and shift magnitudes
- `difference-series`: Target minus reference for adjustment estimation

## Outputs

- `adjustment-values`: The correction applied at each breakpoint (additive for temperature, multiplicative for precipitation)
- `homogenized-record`: The adjusted climate record

## Process

1. For each breakpoint, estimate the adjustment from the mean difference before and after.
2. Apply adjustments cumulatively from the most recent breakpoint backward.
3. Use an additive model for temperature and a multiplicative (ratio) model for precipitation.
4. Preserve the most recent segment as the reference period (fewest adjustments).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
