# Msa Acceptability Assessor

Assess whether the measurement system is acceptable.

## Inputs

- `grr-results`: GRR calculations
- `variance-components`: Variance breakdown

## Outputs

- `acceptability-decision`: Acceptable (under 10%), marginal (10-30%), or unacceptable (over 30%)
- `number-of-distinct-categories`: NDC value (must be 5 or greater)

## Process

1. Apply the acceptance criteria: under 10% GRR is acceptable, 10-30% is marginal, over 30% is unacceptable
2. Calculate the number of distinct categories (NDC): must be 5 or greater
3. Identify the dominant source of variation (repeatability vs reproducibility)
4. Determine if the system can distinguish between parts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
