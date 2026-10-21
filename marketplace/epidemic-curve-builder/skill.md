# Epidemic Curve Builder

Construct and interpret the epidemic curve to determine the pattern of spread and estimate the incubation period.

## Inputs

- `line-list`: Case line list with onset dates
- `case-definition`: Investigation time boundaries

## Outputs

- `epidemic-curve`: Histogram of case counts by onset date with outbreak pattern classification
- `incubation-estimate`: Estimated incubation period range based on the curve shape and known exposures

## Process

1. Plot case counts by date of onset using appropriate time intervals
2. Classify the curve shape (point source, continuous, propagated, intermittent)
3. Estimate the probable exposure window by back-calculating from onset dates
4. Estimate the incubation period from cases with known single exposures

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
