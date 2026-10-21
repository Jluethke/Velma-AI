# Tensile Specimen Comparator

Compare mechanical properties across specimens and test conditions.

## Inputs

- `yield-strengths`: Yield strength per specimen
- `uts-values`: UTS per specimen
- `elastic-moduli`: Young's modulus per specimen

## Outputs

- `comparison-table`: Side-by-side property comparison with statistical tests
- `property-distributions`: Histograms and box plots of each property

## Process

1. Tabulate all mechanical properties by specimen and group (material, condition, orientation)
2. Compute group means, standard deviations, and confidence intervals
3. Run statistical comparisons (t-test or ANOVA) between groups if multiple conditions exist
4. Generate comparison plots showing property distributions by group

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
