# Msa Gage Rr Calculator

Calculate repeatability, reproducibility, and total Gage R&R.

## Inputs

- `measurement-data`: Collected measurements
- `tolerance`: Specification tolerance

## Outputs

- `grr-results`: Repeatability, reproducibility, part variation, and total GRR
- `variance-components`: ANOVA variance component breakdown

## Process

1. Run the ANOVA method to decompose total variation into components
2. Calculate equipment variation (repeatability) and appraiser variation (reproducibility)
3. Compute the operator-by-part interaction
4. Calculate %GRR as a percentage of tolerance and as a percentage of total variation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
