# Fmea Occurrence And Detection Rating

Rate the probability of occurrence for each failure cause and the effectiveness of current detection controls, using field data where available.

## Inputs

- `effect-chain`: Effect chains for all failure modes
- `severity-ratings`: Severity scores for all failure modes
- `mechanism-cause-map`: Mechanisms and causes for each mode

## Outputs

- `occurrence-ratings`: Occurrence score (1 to 10) for each failure cause, anchored to failure rate ranges: 1 = less than 1 in 1,000,000, 3 = 1 in 100,000, 5 = 1 in 10,000, 7 = 1 in 1,000, 10 = 1 in 10 or higher
- `detection-ratings`: Detection score (1 to 10) for each failure mode: 1 = design prevents the failure (error-proofed), 2 = automatic detection and correction, 5 = inspection or test catches it, 8 = only manual audit might find it, 10 = no current control exists
- `current-controls`: List of existing prevention and detection controls for each failure mode

## Process

1. Rate occurrence from field data when available. If the same component or process has been used before, pull failure rates from warranty databases or reliability test results. When no data exists, use handbook rates (MIL-HDBK-217, FIDES) as a starting point, adjusted for the operating environment.
2. Distinguish between prevention controls (design features that reduce occurrence) and detection controls (tests, inspections, or monitors that catch the failure after it occurs). Rate detection based on the best current control, not a planned future control.
3. Detection rating must reflect when the failure is caught relative to the customer. A test that catches it at incoming inspection is better (lower score) than a test at final assembly, which is better than a field monitor. If detection relies on the customer reporting it, the score is 9 or 10.
4. For process FMEA, occurrence maps to process capability (Cpk): Cpk > 1.67 corresponds to occurrence 1-2, Cpk 1.33-1.67 is 3-4, Cpk 1.0-1.33 is 5-6, and Cpk < 1.0 is 7+. Tie the rating to measurable process data, not opinions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
