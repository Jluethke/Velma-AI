# Distribution Metric Calculator

Compute the key distribution metrics (D10, D50, D90, span) from the raw size data.

## Inputs

- `raw-size-data`: Raw particle size measurement data
- `replicate-summary`: Repeatability metrics

## Outputs

- `distribution-metrics`: D10, D50, D90, span, and mean diameter with standard deviations
- `cumulative-distribution`: Cumulative and frequency distribution curves

## Process

1. Compute the volume-weighted (or number-weighted) size distribution
2. Calculate D10, D50, D90 from the cumulative distribution
3. Compute the span ((D90 - D10) / D50) as a measure of distribution width
4. Generate the cumulative and frequency distribution plots

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
