# Control Limit Calculator

Calculate control limits from the baseline data.

## Inputs

- `baseline-data`: Baseline measurements
- `chart-assignments`: Chart types for each characteristic

## Outputs

- `control-limits`: UCL, CL, and LCL for each chart
- `process-capability`: Cp and Cpk values for each characteristic

## Process

1. Calculate center line and control limits using standard formulas
2. Test for normality and check assumptions
3. Compute Cp and Cpk against specification limits
4. Flag characteristics where Cpk is below 1.33

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
