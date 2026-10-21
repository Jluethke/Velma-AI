# Reliability Calculator

Assess internal consistency and test-retest reliability of the instrument.

## Inputs

- `pilot-response-data`: item-level response matrix

## Outputs

- `reliability-metrics`: Cronbach alpha, McDonald omega, item-total correlations, and test-retest coefficient
- `item-flags`: items with low item-total correlation or that reduce alpha if included

## Process

1. Compute Cronbach alpha and McDonald omega for the total scale and each subscale
2. Compute corrected item-total correlations; flag items below 0.30
3. Compute alpha-if-item-deleted to identify items that reduce internal consistency
4. If test-retest data are available, compute the intraclass correlation coefficient

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
