# Isotope Precision Assessor

Quantify analytical precision from replicate measurements and propagate uncertainty to final interpretations.

## Inputs

- `delta-values`: All sample and replicate delta values
- `correction-log`: Corrections applied and their uncertainties

## Outputs

- `precision-report`: Internal and external precision, reproducibility, and total uncertainty budget
- `uncertainty-budget`: Breakdown of uncertainty contributions from measurement, correction, and blank

## Process

1. Compute internal precision from within-run replicates.
2. Compute external precision from between-session replicates of reference materials.
3. Build the uncertainty budget showing the contribution of each error source.
4. Report the total combined uncertainty for each sample.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
