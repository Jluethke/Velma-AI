# Sampling Plan Selector

Select the statistical sampling plan for each material.

## Inputs

- `inspection-criteria`: Criteria per material
- `risk-classification`: Material risk levels

## Outputs

- `sampling-plans`: AQL-based sampling plans per material
- `switching-rules`: Rules for switching between normal, tightened, and reduced inspection

## Process

1. Select the acceptable quality level (AQL) for each material class
2. Look up the sampling plan from ANSI/ASQ Z1.4 (attributes) or Z1.9 (variables)
3. Define the switching rules (5 consecutive lots accepted for reduced, 2 rejected for tightened)
4. Document the lot definition (what constitutes one lot)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
