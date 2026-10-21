# Resolution Peak Assessor

Assess chromatographic resolution, peak shape, and separation quality.

## Inputs

- `validation-results`: Method validation data
- `gradient-program`: Current gradient or isocratic conditions

## Outputs

- `resolution-report`: Resolution values for critical pairs, peak symmetry, and plate count
- `method-adjustments`: Any final adjustments to improve peak shape or resolution

## Process

1. Calculate resolution between all critical analyte pairs
2. Measure peak asymmetry factors and theoretical plate counts
3. Identify any co-elution or shouldering that needs further optimization
4. Document final adjustments to temperature, flow rate, or gradient

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
