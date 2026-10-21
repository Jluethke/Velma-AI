# Gpr Validation

Validate GPR interpretations against ground truth from excavation, boring logs, or known reference targets.

## Inputs

- `feature-catalog`: Interpreted GPR features with predicted locations and depths
- `ground-truth-data`: Boring logs, excavation records, or known target locations

## Outputs

- `validation-results`: Comparison of predicted vs actual feature locations with accuracy statistics
- `depth-accuracy-assessment`: Depth error statistics and velocity model accuracy evaluation

## Process

1. Match each ground-truth feature to the nearest GPR interpretation
2. Compute horizontal and vertical position errors
3. Assess whether the velocity model produced accurate depths or needs refinement
4. Document any features detected by GPR but not confirmed, and vice versa

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
